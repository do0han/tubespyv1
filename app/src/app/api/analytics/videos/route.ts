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

    // URL 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'publishedAt'; // publishedAt, viewCount, likeCount, commentCount
    const order = searchParams.get('order') || 'desc'; // asc, desc

    console.log(`📊 비디오 분석 데이터 조회: 사용자 ${session.user.id}`);

    // 비디오 데이터 조회 조건 설정
    const whereCondition: any = {
      userId: session.user.id
    };

    // 특정 채널 필터링
    if (channelId) {
      whereCondition.channelId = channelId;
    }

    // 정렬 조건 설정
    const orderBy: any = {};
    orderBy[sortBy] = order;

    // 비디오 데이터 조회
    const videos = await prisma.video.findMany({
      where: whereCondition,
      include: {
        channel: {
          select: {
            id: true,
            youtubeId: true,
            title: true,
            thumbnailUrl: true
          }
        }
      },
      orderBy,
      take: limit
    });

    if (videos.length === 0) {
      return NextResponse.json({
        success: true,
        message: '저장된 비디오 데이터가 없습니다',
        data: {
          videos: [],
          totalVideos: 0,
          analytics: {
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            avgViews: 0,
            avgLikes: 0,
            avgComments: 0,
            avgEngagementRate: 0
          }
        }
      });
    }

    // 비디오 데이터 가공
    const processedVideos = videos.map(video => {
      // 참여율 계산
      const engagementRate = video.viewCount && video.viewCount > 0 ? 
        (((video.likeCount || 0) + (video.commentCount || 0)) / video.viewCount * 100).toFixed(2) : '0.00';

      // 업로드 경과 시간 계산
      const uploadedDaysAgo = video.publishedAt ? 
        Math.floor((Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24)) : null;

      // 성과 등급 계산 (조회수 기준)
      let performanceGrade = 'low';
      if (video.viewCount) {
        if (video.viewCount > 100000) performanceGrade = 'excellent';
        else if (video.viewCount > 50000) performanceGrade = 'high';
        else if (video.viewCount > 10000) performanceGrade = 'medium';
      }

      return {
        id: video.id,
        youtubeId: video.youtubeId,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        
        // 메타데이터
        publishedAt: video.publishedAt,
        duration: video.duration,
        categoryId: video.categoryId,
        tags: video.tags ? JSON.parse(video.tags) : [],
        
        // 통계
        viewCount: video.viewCount || 0,
        likeCount: video.likeCount || 0,
        commentCount: video.commentCount || 0,
        
        // 상태
        privacyStatus: video.privacyStatus,
        uploadStatus: video.uploadStatus,
        
        // 계산된 분석 데이터
        analytics: {
          engagementRate: parseFloat(engagementRate),
          uploadedDaysAgo,
          performanceGrade,
          viewsPerDay: uploadedDaysAgo && uploadedDaysAgo > 0 ? 
            Math.round((video.viewCount || 0) / uploadedDaysAgo) : video.viewCount || 0,
          likesPerView: video.viewCount && video.viewCount > 0 ? 
            ((video.likeCount || 0) / video.viewCount).toFixed(4) : '0.0000',
          commentsPerView: video.viewCount && video.viewCount > 0 ? 
            ((video.commentCount || 0) / video.viewCount).toFixed(4) : '0.0000'
        },
        
        // 채널 정보
        channel: video.channel,
        
        // 타임스탬프
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        lastSyncAt: video.lastSyncAt
      };
    });

    // 전체 분석 통계 계산
    const totalVideos = processedVideos.length;
    const totalViews = processedVideos.reduce((sum, video) => sum + video.viewCount, 0);
    const totalLikes = processedVideos.reduce((sum, video) => sum + video.likeCount, 0);
    const totalComments = processedVideos.reduce((sum, video) => sum + video.commentCount, 0);
    
    const avgViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0;
    const avgLikes = totalVideos > 0 ? Math.round(totalLikes / totalVideos) : 0;
    const avgComments = totalVideos > 0 ? Math.round(totalComments / totalVideos) : 0;
    const avgEngagementRate = totalViews > 0 ? 
      ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : '0.00';

    // 성과별 비디오 개수
    const performanceStats = {
      excellent: processedVideos.filter(v => v.analytics.performanceGrade === 'excellent').length,
      high: processedVideos.filter(v => v.analytics.performanceGrade === 'high').length,
      medium: processedVideos.filter(v => v.analytics.performanceGrade === 'medium').length,
      low: processedVideos.filter(v => v.analytics.performanceGrade === 'low').length
    };

    // 최근 업로드 추세 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentVideos = processedVideos.filter(video => 
      video.publishedAt && new Date(video.publishedAt) > thirtyDaysAgo
    );

    console.log(`✅ 비디오 분석 완료: ${totalVideos}개 비디오 처리`);

    return NextResponse.json({
      success: true,
      data: {
        videos: processedVideos,
        pagination: {
          total: totalVideos,
          limit,
          hasMore: totalVideos === limit // 실제로는 더 정확한 페이지네이션 로직 필요
        },
        analytics: {
          totalVideos,
          totalViews,
          totalLikes,
          totalComments,
          avgViews,
          avgLikes,
          avgComments,
          avgEngagementRate: parseFloat(avgEngagementRate),
          
          // 성과 분포
          performanceDistribution: performanceStats,
          
          // 최근 활동
          recentActivity: {
            videosLast30Days: recentVideos.length,
            avgViewsRecent: recentVideos.length > 0 ? 
              Math.round(recentVideos.reduce((sum, v) => sum + v.viewCount, 0) / recentVideos.length) : 0,
            avgEngagementRecent: recentVideos.length > 0 && recentVideos.reduce((sum, v) => sum + v.viewCount, 0) > 0 ?
              ((recentVideos.reduce((sum, v) => sum + v.likeCount + v.commentCount, 0) / 
                recentVideos.reduce((sum, v) => sum + v.viewCount, 0)) * 100).toFixed(2) : '0.00'
          },
          
          // 상위 5개 비디오
          topVideos: processedVideos
            .sort((a, b) => b.viewCount - a.viewCount)
            .slice(0, 5)
            .map(video => ({
              id: video.id,
              title: video.title,
              viewCount: video.viewCount,
              engagementRate: video.analytics.engagementRate,
              publishedAt: video.publishedAt
            }))
        }
      }
    });

  } catch (error) {
    console.error('❌ 비디오 분석 데이터 조회 실패:', error);
    return NextResponse.json(
      { 
        error: '비디오 분석 데이터 조회에 실패했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 