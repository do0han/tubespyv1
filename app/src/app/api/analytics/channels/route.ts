import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    console.log(`📊 채널 분석 데이터 조회: 사용자 ${session.user.id}`);

    // 사용자의 채널 데이터 조회
    const channels = await prisma.channel.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        videos: {
          orderBy: { publishedAt: 'desc' },
          take: 50 // 최근 50개 비디오
        }
      },
      orderBy: { lastSyncAt: 'desc' }
    });

    if (channels.length === 0) {
      return NextResponse.json({
        success: true,
        message: '저장된 채널 데이터가 없습니다',
        data: {
          channels: [],
          totalChannels: 0,
          totalVideos: 0
        }
      });
    }

    // 분석 데이터 계산
    const analytics = channels.map(channel => {
      const videos = channel.videos;
      
      // 기본 통계
      const totalVideos = videos.length;
      const totalViews = videos.reduce((sum, video) => sum + (video.viewCount || 0), 0);
      const totalLikes = videos.reduce((sum, video) => sum + (video.likeCount || 0), 0);
      const totalComments = videos.reduce((sum, video) => sum + (video.commentCount || 0), 0);
      
      // 평균 통계
      const avgViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0;
      const avgLikes = totalVideos > 0 ? Math.round(totalLikes / totalVideos) : 0;
      const avgComments = totalVideos > 0 ? Math.round(totalComments / totalVideos) : 0;
      
      // 참여율 계산 (Engagement Rate)
      const engagementRate = totalViews > 0 ? 
        ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : '0.00';
      
      // 최근 업로드된 비디오들 (최근 30일)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentVideos = videos.filter(video => 
        video.publishedAt && new Date(video.publishedAt) > thirtyDaysAgo
      );
      
      // 성과가 좋은 비디오 (평균 조회수 이상)
      const highPerformingVideos = videos.filter(video => 
        (video.viewCount || 0) > avgViews
      );

      return {
        id: channel.id,
        youtubeId: channel.youtubeId,
        title: channel.title,
        description: channel.description,
        thumbnailUrl: channel.thumbnailUrl,
        customUrl: channel.customUrl,
        
        // 채널 통계
        subscriberCount: channel.subscriberCount || 0,
        viewCount: channel.viewCount || 0,
        videoCount: channel.videoCount || 0,
        
        // 메타데이터
        publishedAt: channel.publishedAt,
        country: channel.country,
        language: channel.language,
        lastSyncAt: channel.lastSyncAt,
        
        // 계산된 분석 데이터
        analytics: {
          totalVideos,
          totalViews,
          totalLikes,
          totalComments,
          avgViews,
          avgLikes,
          avgComments,
          engagementRate: parseFloat(engagementRate),
          recentVideosCount: recentVideos.length,
          highPerformingVideosCount: highPerformingVideos.length,
          
          // 최근 비디오들
          recentVideos: recentVideos.slice(0, 10).map(video => ({
            id: video.id,
            youtubeId: video.youtubeId,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            publishedAt: video.publishedAt,
            viewCount: video.viewCount || 0,
            likeCount: video.likeCount || 0,
            commentCount: video.commentCount || 0,
            duration: video.duration
          })),
          
          // 성과 높은 비디오들
          topVideos: highPerformingVideos
            .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
            .slice(0, 5)
            .map(video => ({
              id: video.id,
              youtubeId: video.youtubeId,
              title: video.title,
              thumbnailUrl: video.thumbnailUrl,
              publishedAt: video.publishedAt,
              viewCount: video.viewCount || 0,
              likeCount: video.likeCount || 0,
              commentCount: video.commentCount || 0,
              duration: video.duration
            }))
        }
      };
    });

    // 전체 요약 통계
    const totalChannels = channels.length;
    const totalVideos = analytics.reduce((sum, channel) => sum + channel.analytics.totalVideos, 0);
    const totalViews = analytics.reduce((sum, channel) => sum + channel.analytics.totalViews, 0);
    const totalSubscribers = analytics.reduce((sum, channel) => sum + channel.subscriberCount, 0);

    console.log(`✅ 채널 분석 완료: ${totalChannels}개 채널, ${totalVideos}개 비디오`);

    return NextResponse.json({
      success: true,
      data: {
        channels: analytics,
        summary: {
          totalChannels,
          totalVideos,
          totalViews,
          totalSubscribers,
          avgEngagementRate: analytics.length > 0 ? 
            (analytics.reduce((sum, ch) => sum + ch.analytics.engagementRate, 0) / analytics.length).toFixed(2) : '0.00'
        }
      }
    });

  } catch (error) {
    console.error('❌ 채널 분석 데이터 조회 실패:', error);
    return NextResponse.json(
      { 
        error: '채널 분석 데이터 조회에 실패했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 