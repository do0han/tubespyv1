import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { google } from 'googleapis';
import { 
  createSearchCacheKey, 
  getCachedSearchResults, 
  setCachedSearchResults 
} from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const maxResults = searchParams.get('maxResults') || '50';
    const pageToken = searchParams.get('pageToken');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // 캐시 키 생성
    const cacheKey = createSearchCacheKey(
      query, 
      'video', 
      parseInt(maxResults), 
      pageToken || undefined
    );

    // 캐시에서 결과 확인
    const cachedResult = getCachedSearchResults(cacheKey);
    if (cachedResult) {
      console.log('📄 캐시된 결과 반환:', query);
      return NextResponse.json(cachedResult);
    }

    // YouTube Data API v3 직접 호출
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY
    });

    console.log('🔍 YouTube API 검색 시작:', query);

    // 영상 검색
    const searchOptions: any = {
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults: parseInt(maxResults),
      order: 'relevance',
      regionCode: 'KR',
      relevanceLanguage: 'ko'
    };
    
    // pageToken이 있으면 추가
    if (pageToken && pageToken.trim() !== '') {
      searchOptions.pageToken = pageToken;
    }
    
    const searchResponse = await youtube.search.list(searchOptions);

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      console.log('⚠️ 검색 결과 없음');
      return NextResponse.json({ videos: [] });
    }

    // 비디오 ID 추출
    const videoIds = searchResponse.data.items
      .map(item => item.id?.videoId)
      .filter(Boolean)
      .join(',');

    // 채널 ID 추출 (중복 제거)
    const channelIds = [...new Set(searchResponse.data.items
      .map(item => item.snippet?.channelId)
      .filter(Boolean))].join(',');

    // 비디오 상세 정보 가져오기 (조회수, 좋아요 등)
    const videosResponse = await youtube.videos.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      id: [videoIds]
    });

    // 채널 정보 가져오기 (구독자 수, 총 영상 수 등)
    const channelsResponse = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      id: [channelIds]
    });

    // 채널 정보를 빠른 조회를 위해 맵으로 변환
    const channelData = new Map();
    channelsResponse.data.items?.forEach(channel => {
      if (channel.id) {
        channelData.set(channel.id, {
          subscriberCount: channel.statistics?.subscriberCount ?? '0',
          videoCount: channel.statistics?.videoCount ?? '0',
          totalViewCount: channel.statistics?.viewCount ?? '0'
        });
      }
    });

    // 데이터 포맷팅
    const videos = videosResponse.data.items?.map(video => {
      const snippet = video.snippet;
      const statistics = video.statistics;
      const contentDetails = video.contentDetails;
      const channelInfo = channelData.get(snippet?.channelId) || { subscriberCount: '0', videoCount: '0', totalViewCount: '0' };

      // 영상 길이 파싱 (PT15M33S -> 15:33)
      const duration = contentDetails?.duration || 'PT0S';
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = match?.[1] ? parseInt(match[1]) : 0;
      const minutes = match?.[2] ? parseInt(match[2]) : 0;
      const seconds = match?.[3] ? parseInt(match[3]) : 0;
      
      let formattedDuration = '';
      if (hours > 0) {
        formattedDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }

      // 숫자 포맷팅 함수
      const formatNumber = (num: string | undefined) => {
        if (!num) return '0';
        const n = parseInt(num);
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toString();
      };

      // 채널 기여도 계산 (영상 조회수 / 채널 총 조회수 * 100)
      const channelContribution = channelInfo.totalViewCount !== '0' 
        ? ((parseInt(statistics?.viewCount || '0') / parseInt(channelInfo.totalViewCount)) * 100).toFixed(2)
        : '0.00';

      // 성과도 배율 계산 (좋아요 + 댓글) / 조회수 * 1000
      const engagementMultiplier = statistics?.viewCount && parseInt(statistics.viewCount) > 0
        ? (((parseInt(statistics?.likeCount || '0') + parseInt(statistics?.commentCount || '0')) / parseInt(statistics.viewCount)) * 1000).toFixed(2)
        : '0.00';

      // CII (채널 영향력 지수) 계산 - 구독자 대비 조회수 비율
      const cii = channelInfo.subscriberCount !== '0'
        ? ((parseInt(statistics?.viewCount || '0') / parseInt(channelInfo.subscriberCount)) * 100).toFixed(2)
        : '0.00';

      // 참여율 계산 (좋아요 + 댓글) / 조회수 * 100
      const engagementRate = statistics?.viewCount && parseInt(statistics.viewCount) > 0
        ? (((parseInt(statistics?.likeCount || '0') + parseInt(statistics?.commentCount || '0')) / parseInt(statistics.viewCount)) * 100).toFixed(2)
        : '0.00';

      // 자막 정보 (API에서는 직접 제공하지 않으므로 추정)
      const hasSubtitles = snippet?.defaultLanguage || snippet?.defaultAudioLanguage ? '있음' : '확인필요';

      return {
        id: video.id,
        title: snippet?.title || 'No Title',
        description: snippet?.description || '',
        thumbnails: {
          default: { url: snippet?.thumbnails?.default?.url || '' },
          medium: { url: snippet?.thumbnails?.medium?.url || '' },
          high: { url: snippet?.thumbnails?.high?.url || '' }
        },
        publishedAt: snippet?.publishedAt || '',
        channelTitle: snippet?.channelTitle || 'Unknown Channel',
        channelId: snippet?.channelId || '',
        viewCount: formatNumber(statistics?.viewCount),
        likeCount: formatNumber(statistics?.likeCount),
        commentCount: formatNumber(statistics?.commentCount),
        duration: formattedDuration,
        tags: snippet?.tags || [],
        // 원본 숫자 (정렬용)
        rawViewCount: parseInt(statistics?.viewCount || '0'),
        rawLikeCount: parseInt(statistics?.likeCount || '0'),
        rawCommentCount: parseInt(statistics?.commentCount || '0'),
        // 새로 추가된 데이터
        subscriberCount: formatNumber(channelInfo.subscriberCount),
        rawSubscriberCount: parseInt(channelInfo.subscriberCount),
        totalVideos: formatNumber(channelInfo.videoCount),
        rawTotalVideos: parseInt(channelInfo.videoCount),
        channelContribution: channelContribution,
        performanceMultiplier: engagementMultiplier,
        cii: cii,
        engagementRate: engagementRate,
        subtitles: hasSubtitles
      };
    }) || [];

    console.log(`✅ YouTube API 검색 완료: ${videos.length}개 결과`);

    const result = { 
      videos,
      totalResults: searchResponse.data.pageInfo?.totalResults || 0,
      nextPageToken: searchResponse.data.nextPageToken,
      query: query
    };

    // 결과를 캐시에 저장 (5분 TTL)
    setCachedSearchResults(cacheKey, result, 5 * 60 * 1000);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ YouTube API 오류:', error);
    
    // 에러 타입별 처리
    if (error.code === 403 || error.message?.includes('quota')) {
      console.log('🔄 API 할당량 초과 - 더미 데이터 반환');
      return NextResponse.json({ 
        error: 'YouTube API quota exceeded',
        code: 'QUOTA_EXCEEDED',
        usesFallback: true,
        videos: generateFallbackVideos(request.nextUrl.searchParams.get('q') || 'search')
      });
    }
    
    if (error.code === 401 || error.message?.includes('authentication')) {
      return NextResponse.json({
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
        message: '인증에 실패했습니다. 다시 로그인해주세요.'
      }, { status: 401 });
    }
    
    if (error.code === 400 || error.message?.includes('Invalid')) {
      return NextResponse.json({
        error: 'Invalid request parameters',
        code: 'INVALID_REQUEST',
        message: '잘못된 요청입니다.'
      }, { status: 400 });
    }
    
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      return NextResponse.json({
        error: 'Request timeout',
        code: 'TIMEOUT',
        message: '요청 시간이 초과되었습니다.'
      }, { status: 408 });
    }

    // 기본 서버 오류
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: '서버 내부 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// API 오류시 사용할 더미 데이터 생성 함수
function generateFallbackVideos(query: string) {
  const channels = [
    { name: '프로 튜토리얼', subscribers: 125000, videos: 234 },
    { name: '트렌드 워치', subscribers: 89000, videos: 156 },
    { name: '실무 꿀팁', subscribers: 167000, videos: 89 },
    { name: '비교 분석가', subscribers: 234000, videos: 445 },
    { name: '초보자 친화', subscribers: 78000, videos: 123 },
    { name: '전문가 리뷰', subscribers: 345000, videos: 567 },
    { name: '데일리 크리에이터', subscribers: 56000, videos: 234 },
    { name: '스마트 가이드', subscribers: 198000, videos: 345 },
    { name: '인기 유튜버', subscribers: 567000, videos: 678 },
    { name: 'IT 뉴스', subscribers: 123000, videos: 234 }
  ];

  return Array.from({ length: 50 }, (_, i) => {
    const channel = channels[i % channels.length];
    const views = Math.floor(Math.random() * 5000000 + 10000);
    const likes = Math.floor(views * (Math.random() * 0.05 + 0.01));
    const comments = Math.floor(views * (Math.random() * 0.01 + 0.001));
    const channelTotalViews = channel.subscribers * 150; // 구독자당 평균 150회 조회수 가정
    
    return {
      id: `video_${i + 1}`,
      title: `${query} 관련 ${['완벽 가이드', '실전 활용법', '트렌드 분석', '비교 리뷰', '초보자 팁', '전문가 해설', '최신 업데이트', '실무 적용', '심화 학습', '기초 입문'][i % 10]} - ${i + 1}편`,
      description: `${query}에 대한 상세한 설명과 실용적인 팁을 제공하는 영상입니다.`,
      thumbnails: {
        default: { url: 'https://via.placeholder.com/120x90' },
        medium: { url: 'https://via.placeholder.com/320x180' },
        high: { url: 'https://via.placeholder.com/480x360' }
      },
      publishedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      channelTitle: channel.name,
      channelId: `channel_${i % channels.length + 1}`,
      viewCount: views >= 1000000 ? `${(views / 1000000).toFixed(1)}M` : `${(views / 1000).toFixed(0)}K`,
      likeCount: likes >= 1000 ? `${(likes / 1000).toFixed(1)}K` : likes.toString(),
      commentCount: comments >= 1000 ? `${(comments / 1000).toFixed(1)}K` : comments.toString(),
      duration: `${Math.floor(Math.random() * 30 + 5)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      tags: [`${query}`, '튜토리얼', '가이드'],
      rawViewCount: views,
      rawLikeCount: likes,
      rawCommentCount: comments,
      subscriberCount: channel.subscribers >= 1000000 ? `${(channel.subscribers / 1000000).toFixed(1)}M` : `${(channel.subscribers / 1000).toFixed(0)}K`,
      rawSubscriberCount: channel.subscribers,
      totalVideos: channel.videos >= 1000 ? `${(channel.videos / 1000).toFixed(1)}K` : channel.videos.toString(),
      rawTotalVideos: channel.videos,
      channelContribution: ((views / channelTotalViews) * 100).toFixed(2),
      performanceMultiplier: (((likes + comments) / views) * 1000).toFixed(2),
      cii: ((views / channel.subscribers) * 100).toFixed(2),
      engagementRate: (((likes + comments) / views) * 100).toFixed(2),
      subtitles: Math.random() > 0.3 ? '있음' : '없음'
    };
  });
} 