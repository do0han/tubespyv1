import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// 복원 데이터 타입 정의
interface RestoreData {
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

// POST: 데이터 복원 실행
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const overwriteExisting = formData.get('overwriteExisting') === 'true';

    if (!file) {
      return NextResponse.json({ error: '파일이 제공되지 않았습니다' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    let restoreData: RestoreData;

    try {
      const fileContent = await file.text();
      
      if (file.name.endsWith('.json')) {
        // JSON 파일 처리
        restoreData = JSON.parse(fileContent);
      } else if (file.name.endsWith('.csv')) {
        // CSV 파일 처리 (간단한 파싱)
        return NextResponse.json({ 
          error: 'CSV 복원 기능은 현재 지원되지 않습니다. JSON 파일을 사용해주세요.' 
        }, { status: 400 });
      } else {
        return NextResponse.json({ error: '지원되지 않는 파일 형식입니다' }, { status: 400 });
      }
    } catch (parseError) {
      return NextResponse.json({ error: '파일 파싱 중 오류가 발생했습니다' }, { status: 400 });
    }

    // 백업 파일 구조 검증
    if (!restoreData.metadata || !restoreData.channels || !restoreData.videos) {
      return NextResponse.json({ 
        error: '잘못된 백업 파일 구조입니다' 
      }, { status: 400 });
    }

    let restoredChannels = 0;
    let restoredVideos = 0;
    let skippedChannels = 0;
    let skippedVideos = 0;

    // 채널 복원
    for (const channelData of restoreData.channels) {
      try {
        const existingChannel = await prisma.channel.findFirst({
          where: {
            youtubeId: channelData.youtubeId,
            user: { id: user.id }
          }
        });

        if (existingChannel && !overwriteExisting) {
          skippedChannels++;
          continue;
        }

        const channelToCreate = {
          youtubeId: channelData.youtubeId,
          title: channelData.title,
          description: channelData.description,
          customUrl: channelData.customUrl,
          subscriberCount: channelData.subscriberCount || 0,
          videoCount: channelData.videoCount || 0,
          viewCount: channelData.viewCount || 0,
          thumbnailUrl: channelData.thumbnailUrl,
          publishedAt: channelData.publishedAt ? new Date(channelData.publishedAt) : null,
          user: { connect: { id: user.id } }
        };

        if (existingChannel && overwriteExisting) {
          await prisma.channel.update({
            where: { id: existingChannel.id },
            data: channelToCreate
          });
        } else {
          await prisma.channel.create({
            data: channelToCreate
          });
        }

        restoredChannels++;
      } catch (channelError) {
        console.error('채널 복원 오류:', channelError);
        skippedChannels++;
      }
    }

    // 비디오 복원
    for (const videoData of restoreData.videos) {
      try {
        const existingVideo = await prisma.video.findFirst({
          where: {
            youtubeId: videoData.youtubeId,
            user: { id: user.id }
          }
        });

        if (existingVideo && !overwriteExisting) {
          skippedVideos++;
          continue;
        }

        // 비디오가 속한 채널 찾기
        const relatedChannel = await prisma.channel.findFirst({
          where: {
            youtubeId: videoData.channelId || videoData.channel?.youtubeId,
            user: { id: user.id }
          }
        });

        if (!relatedChannel) {
          skippedVideos++;
          continue;
        }

        const videoToCreate = {
          youtubeId: videoData.youtubeId,
          title: videoData.title,
          description: videoData.description,
          thumbnailUrl: videoData.thumbnailUrl,
          duration: videoData.duration,
          viewCount: videoData.viewCount || 0,
          likeCount: videoData.likeCount || 0,
          commentCount: videoData.commentCount || 0,
          publishedAt: videoData.publishedAt ? new Date(videoData.publishedAt) : null,
          channel: { connect: { id: relatedChannel.id } },
          user: { connect: { id: user.id } }
        };

        if (existingVideo && overwriteExisting) {
          await prisma.video.update({
            where: { id: existingVideo.id },
            data: videoToCreate
          });
        } else {
          await prisma.video.create({
            data: videoToCreate
          });
        }

        restoredVideos++;
      } catch (videoError) {
        console.error('비디오 복원 오류:', videoError);
        skippedVideos++;
      }
    }

    return NextResponse.json({
      success: true,
      message: '데이터 복원이 완료되었습니다',
      stats: {
        restoredChannels,
        restoredVideos,
        skippedChannels,
        skippedVideos,
        totalChannels: restoreData.channels.length,
        totalVideos: restoreData.videos.length
      }
    });

  } catch (error) {
    console.error('데이터 복원 중 오류:', error);
    return NextResponse.json(
      { error: '데이터 복원 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 