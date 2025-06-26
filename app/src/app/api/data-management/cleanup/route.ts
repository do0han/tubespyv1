import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 데이터 보존 설정 타입
interface DataRetentionSettings {
  enabled: boolean;
  retentionDays: number;
  applyToChannels: boolean;
  applyToVideos: boolean;
  lastCleanupAt?: string;
}

// GET: 현재 사용자의 데이터 보존 설정 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        dataRetentionSettings: true 
      }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    // 기본 설정값
    const defaultSettings: DataRetentionSettings = {
      enabled: false,
      retentionDays: 30,
      applyToChannels: false,
      applyToVideos: true,
    };

    const settings = user.dataRetentionSettings 
      ? { ...defaultSettings, ...(user.dataRetentionSettings as any) }
      : defaultSettings;

    return NextResponse.json({ 
      success: true, 
      settings 
    });

  } catch (error) {
    console.error('설정 조회 오류:', error);
    return NextResponse.json(
      { error: '설정을 불러올 수 없습니다' }, 
      { status: 500 }
    );
  }
}

// POST: 데이터 보존 설정 저장
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, retentionDays, applyToChannels, applyToVideos } = body;

    // 입력값 검증
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: '활성화 설정이 올바르지 않습니다' }, { status: 400 });
    }

    if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 365) {
      return NextResponse.json({ error: '보존 기간은 1일에서 365일 사이여야 합니다' }, { status: 400 });
    }

    if (typeof applyToChannels !== 'boolean' || typeof applyToVideos !== 'boolean') {
      return NextResponse.json({ error: '적용 대상 설정이 올바르지 않습니다' }, { status: 400 });
    }

    const settings: DataRetentionSettings = {
      enabled,
      retentionDays,
      applyToChannels,
      applyToVideos,
      lastCleanupAt: new Date().toISOString(),
    };

    await prisma.user.update({
      where: { email: session.user.email },
      data: { dataRetentionSettings: settings }
    });

    return NextResponse.json({ 
      success: true, 
      message: '설정이 저장되었습니다',
      settings 
    });

  } catch (error) {
    console.error('설정 저장 오류:', error);
    return NextResponse.json(
      { error: '설정을 저장할 수 없습니다' }, 
      { status: 500 }
    );
  }
}

// DELETE: 수동 데이터 정리 실행
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const url = new URL(request.url);
    const retentionDays = url.searchParams.get('retentionDays');
    const applyToChannels = url.searchParams.get('applyToChannels') === 'true';
    const applyToVideos = url.searchParams.get('applyToVideos') === 'true';

    if (!retentionDays || isNaN(Number(retentionDays))) {
      return NextResponse.json({ error: '보존 기간을 제대로 입력해주세요' }, { status: 400 });
    }

    const days = Number(retentionDays);
    if (days < 1 || days > 365) {
      return NextResponse.json({ error: '보존 기간은 1일에서 365일 사이여야 합니다' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let deletedVideos = 0;
    let deletedChannels = 0;

    // 비디오 정리
    if (applyToVideos) {
      const deleteVideosResult = await prisma.video.deleteMany({
        where: {
          userId: user.id,
          createdAt: { lt: cutoffDate }
        }
      });
      deletedVideos = deleteVideosResult.count;
    }

    // 채널 정리 (비디오가 없는 채널만)
    if (applyToChannels) {
      const deleteChannelsResult = await prisma.channel.deleteMany({
        where: {
          userId: user.id,
          createdAt: { lt: cutoffDate },
          videos: { none: {} }
        }
      });
      deletedChannels = deleteChannelsResult.count;
    }

    // 정리 실행 시간 업데이트
    const currentSettings = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dataRetentionSettings: true }
    });

    if (currentSettings?.dataRetentionSettings) {
      const updatedSettings = {
        ...(currentSettings.dataRetentionSettings as any),
        lastCleanupAt: new Date().toISOString()
      };

      await prisma.user.update({
        where: { id: user.id },
        data: { dataRetentionSettings: updatedSettings }
      });
    }

    return NextResponse.json({
      success: true,
      message: `정리 완료: 비디오 ${deletedVideos}개, 채널 ${deletedChannels}개가 삭제되었습니다`,
      result: {
        deletedVideos,
        deletedChannels,
        cutoffDate: cutoffDate.toISOString()
      }
    });

  } catch (error) {
    console.error('데이터 정리 오류:', error);
    return NextResponse.json(
      { error: '데이터 정리 중 오류가 발생했습니다' }, 
      { status: 500 }
    );
  }
} 