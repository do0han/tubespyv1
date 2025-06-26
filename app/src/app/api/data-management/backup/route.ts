import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// 백업 데이터 타입 정의
interface BackupData {
  metadata: {
    exportedAt: string;
    userEmail: string;
    version: string;
    totalChannels: number;
    totalVideos: number;
  };
  channels: any[];
  videos: any[];
}

// POST: 데이터 백업 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { format = 'json', includeChannels = true, includeVideos = true } = await request.json();

    // 지원되는 형식 검증
    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json({ error: '지원되지 않는 형식입니다' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    // 채널 데이터 조회
    let channels: any[] = [];
    if (includeChannels) {
      channels = await prisma.channel.findMany({
        where: { user: { id: user.id } },
        select: {
          youtubeId: true,
          title: true,
          description: true,
          customUrl: true,
          subscriberCount: true,
          videoCount: true,
          viewCount: true,
          thumbnailUrl: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true
        }
      });
    }

    // 비디오 데이터 조회
    let videos: any[] = [];
    if (includeVideos) {
      videos = await prisma.video.findMany({
        where: { user: { id: user.id } },
        select: {
          youtubeId: true,
          title: true,
          description: true,
          channelId: true,
          thumbnailUrl: true,
          duration: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          channel: {
            select: {
              title: true
            }
          }
        }
      });
    }

    // 백업 메타데이터 생성
    const metadata = {
      exportedAt: new Date().toISOString(),
      userEmail: user.email,
      version: '1.0.0',
      totalChannels: channels.length,
      totalVideos: videos.length
    };

    if (format === 'json') {
      // JSON 형식으로 백업
      const backupData: BackupData = {
        metadata,
        channels,
        videos
      };

      const fileName = `tubespy-backup-${new Date().toISOString().split('T')[0]}.json`;

      return new NextResponse(JSON.stringify(backupData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } else if (format === 'csv') {
      // CSV 형식으로 백업
      let csvContent = '';

      if (includeChannels && channels.length > 0) {
        // 채널 CSV 헤더
        csvContent += '=== CHANNELS ===\n';
        const channelHeaders = Object.keys(channels[0]).join(',');
        csvContent += channelHeaders + '\n';
        
        // 채널 데이터
        channels.forEach(channel => {
          const values = Object.values(channel).map(value => 
            typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          );
          csvContent += values.join(',') + '\n';
        });
        csvContent += '\n';
      }

      if (includeVideos && videos.length > 0) {
        // 비디오 CSV 헤더
        csvContent += '=== VIDEOS ===\n';
        const videoHeaders = Object.keys(videos[0]).join(',');
        csvContent += videoHeaders + '\n';
        
        // 비디오 데이터
        videos.forEach(video => {
          const values = Object.values(video).map(value => 
            typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          );
          csvContent += values.join(',') + '\n';
        });
      }

      // 메타데이터 추가
      csvContent = `=== METADATA ===\n${Object.entries(metadata).map(([key, value]) => `${key},${value}`).join('\n')}\n\n${csvContent}`;

      const fileName = `tubespy-backup-${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

  } catch (error) {
    console.error('백업 생성 중 오류:', error);
    return NextResponse.json(
      { error: '백업 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 