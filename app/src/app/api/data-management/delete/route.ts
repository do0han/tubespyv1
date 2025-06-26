import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'channel', 'video', 'bulk'
    const id = searchParams.get('id');
    const ids = searchParams.get('ids')?.split(',');

    console.log(`🗑️ 데이터 삭제 요청: 사용자 ${session.user.id}, 타입: ${type}, ID: ${id || ids}`);

    switch (type) {
      case 'channel':
        if (!id) {
          return NextResponse.json(
            { error: '채널 ID가 필요합니다' },
            { status: 400 }
          );
        }

        // 채널이 사용자 소유인지 확인
        const channel = await prisma.channel.findFirst({
          where: {
            id: id,
            userId: session.user.id
          }
        });

        if (!channel) {
          return NextResponse.json(
            { error: '채널을 찾을 수 없거나 권한이 없습니다' },
            { status: 404 }
          );
        }

        // 해당 채널의 모든 비디오 삭제
        const deletedVideos = await prisma.video.deleteMany({
          where: {
            channelId: id
          }
        });

        // 채널 삭제
        await prisma.channel.delete({
          where: { id: id }
        });

        return NextResponse.json({
          success: true,
          message: `채널과 관련 비디오 ${deletedVideos.count}개가 삭제되었습니다`,
          deletedVideos: deletedVideos.count
        });

      case 'video':
        if (!id) {
          return NextResponse.json(
            { error: '비디오 ID가 필요합니다' },
            { status: 400 }
          );
        }

        // 비디오가 사용자 소유인지 확인
        const video = await prisma.video.findFirst({
          where: {
            id: id,
            userId: session.user.id
          }
        });

        if (!video) {
          return NextResponse.json(
            { error: '비디오를 찾을 수 없거나 권한이 없습니다' },
            { status: 404 }
          );
        }

        // 비디오 삭제
        await prisma.video.delete({
          where: { id: id }
        });

        return NextResponse.json({
          success: true,
          message: '비디오가 삭제되었습니다'
        });

      case 'bulk':
        if (!ids || ids.length === 0) {
          return NextResponse.json(
            { error: 'ID 목록이 필요합니다' },
            { status: 400 }
          );
        }

        const itemType = searchParams.get('itemType'); // 'channels' or 'videos'

        if (itemType === 'channels') {
          // 선택된 채널들이 모두 사용자 소유인지 확인
          const userChannels = await prisma.channel.findMany({
            where: {
              id: { in: ids },
              userId: session.user.id
            }
          });

          if (userChannels.length !== ids.length) {
            return NextResponse.json(
              { error: '일부 채널에 대한 권한이 없습니다' },
              { status: 403 }
            );
          }

          // 해당 채널들의 모든 비디오 삭제
          const deletedVideosResult = await prisma.video.deleteMany({
            where: {
              channelId: { in: ids }
            }
          });

          // 채널들 삭제
          const deletedChannelsResult = await prisma.channel.deleteMany({
            where: {
              id: { in: ids },
              userId: session.user.id
            }
          });

          return NextResponse.json({
            success: true,
            message: `채널 ${deletedChannelsResult.count}개와 관련 비디오 ${deletedVideosResult.count}개가 삭제되었습니다`,
            deletedChannels: deletedChannelsResult.count,
            deletedVideos: deletedVideosResult.count
          });

        } else if (itemType === 'videos') {
          // 선택된 비디오들이 모두 사용자 소유인지 확인
          const userVideos = await prisma.video.findMany({
            where: {
              id: { in: ids },
              userId: session.user.id
            }
          });

          if (userVideos.length !== ids.length) {
            return NextResponse.json(
              { error: '일부 비디오에 대한 권한이 없습니다' },
              { status: 403 }
            );
          }

          // 비디오들 삭제
          const deletedVideosResult = await prisma.video.deleteMany({
            where: {
              id: { in: ids },
              userId: session.user.id
            }
          });

          return NextResponse.json({
            success: true,
            message: `비디오 ${deletedVideosResult.count}개가 삭제되었습니다`,
            deletedVideos: deletedVideosResult.count
          });

        } else {
          return NextResponse.json(
            { error: '올바른 아이템 타입을 지정해주세요 (channels 또는 videos)' },
            { status: 400 }
          );
        }

      default:
        return NextResponse.json(
          { error: '올바른 삭제 타입을 지정해주세요 (channel, video, bulk)' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('🔥 데이터 삭제 오류:', error);
    return NextResponse.json(
      { error: '데이터 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 