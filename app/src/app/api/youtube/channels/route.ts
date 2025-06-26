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
      'channel', 
      parseInt(maxResults), 
      pageToken || undefined
    );

    // 캐시에서 결과 확인
    const cachedResult = getCachedSearchResults(cacheKey);
    if (cachedResult) {
      console.log('📄 캐시된 채널 결과 반환:', query);
      return NextResponse.json(cachedResult);
    }

    // YouTube Data API v3 직접 호출
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY
    });

    console.log('🔍 YouTube 채널 검색 시작:', query);

    // 채널 검색
    const searchOptions: any = {
      part: ['snippet'],
      q: query,
      type: ['channel'], // 채널만 검색
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
      console.log('⚠️ 채널 검색 결과 없음');
      return NextResponse.json({ channels: [] });
    }

    // 채널 ID 추출
    const channelIds = searchResponse.data.items
      .map(item => item.id?.channelId)
      .filter(Boolean)
      .join(',');

    // 채널 상세 정보 가져오기
    const channelsResponse = await youtube.channels.list({
      part: ['snippet', 'statistics', 'brandingSettings'],
      id: [channelIds]
    });

    // 각 채널의 최신 영상 몇 개 가져오기
    const channelVideos = new Map();
    for (const channel of channelsResponse.data.items || []) {
      if (channel.id) {
        try {
          const recentVideos = await youtube.search.list({
            part: ['snippet'],
            channelId: channel.id,
            type: ['video'],
            order: 'date',
            maxResults: 5 // 최신 5개 영상
          });
          
          if (recentVideos.data.items) {
            channelVideos.set(channel.id, recentVideos.data.items);
          }
        } catch (error) {
          console.log(`채널 ${channel.id}의 영상 조회 실패:`, error);
          channelVideos.set(channel.id, []);
        }
      }
    }

    // 데이터 포맷팅
    const channels = channelsResponse.data.items?.map(channel => {
      const snippet = channel.snippet;
      const statistics = channel.statistics;
      const branding = channel.brandingSettings;
      const recentVideos = channelVideos.get(channel.id) || [];

      // 숫자 포맷팅 함수
      const formatNumber = (num: string | undefined) => {
        if (!num) return '0';
        const n = parseInt(num);
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toString();
      };

      // 평균 조회수 계산 (최근 영상들 기준)
      const avgViews = recentVideos.length > 0 
        ? Math.round(recentVideos.reduce((sum: number, video: any) => sum + (parseInt(video.statistics?.viewCount || '0')), 0) / recentVideos.length)
        : 0;

      // 채널 활동도 계산 (구독자 대비 평균 조회수)
      const activityRate = statistics?.subscriberCount && parseInt(statistics.subscriberCount) > 0
        ? ((avgViews / parseInt(statistics.subscriberCount)) * 100).toFixed(2)
        : '0.00';

      return {
        id: channel.id,
        title: snippet?.title || 'Unknown Channel',
        description: snippet?.description || '',
        customUrl: snippet?.customUrl || '',
        thumbnails: {
          default: { url: snippet?.thumbnails?.default?.url || '' },
          medium: { url: snippet?.thumbnails?.medium?.url || '' },
          high: { url: snippet?.thumbnails?.high?.url || '' }
        },
        publishedAt: snippet?.publishedAt || '',
        country: snippet?.country || 'Unknown',
                 // 통계 정보
         subscriberCount: formatNumber(statistics?.subscriberCount || undefined),
         videoCount: formatNumber(statistics?.videoCount || undefined),
         viewCount: formatNumber(statistics?.viewCount || undefined),
        // 원본 숫자 (정렬용)
        rawSubscriberCount: parseInt(statistics?.subscriberCount || '0'),
        rawVideoCount: parseInt(statistics?.videoCount || '0'),
        rawViewCount: parseInt(statistics?.viewCount || '0'),
        // 추가 분석 데이터
        avgViews: formatNumber(avgViews.toString()),
        rawAvgViews: avgViews,
        activityRate: activityRate,
        // 최신 영상 정보
        recentVideos: recentVideos.map((video: any) => ({
          id: video.id?.videoId,
          title: video.snippet?.title,
          publishedAt: video.snippet?.publishedAt,
          thumbnails: video.snippet?.thumbnails
        })),
        // 브랜딩 정보
        keywords: branding?.channel?.keywords || '',
        bannerImageUrl: branding?.image?.bannerExternalUrl || ''
      };
    }) || [];

    console.log(`✅ YouTube 채널 검색 완료: ${channels.length}개 결과`);

    const result = { 
      channels,
      totalResults: searchResponse.data.pageInfo?.totalResults || 0,
      nextPageToken: searchResponse.data.nextPageToken,
      query: query
    };

    // 결과를 캐시에 저장 (5분 TTL)
    setCachedSearchResults(cacheKey, result, 5 * 60 * 1000);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ YouTube 채널 API 오류:', error);
    
    // API 할당량 초과나 인증 오류시 더미 데이터 반환
    if (error.code === 403 || error.code === 401) {
      console.log('🔄 API 할당량 초과 - 더미 채널 데이터 반환');
      return NextResponse.json({ 
        error: 'API quota exceeded',
        usesFallback: true,
        channels: generateFallbackChannels(request.nextUrl.searchParams.get('q') || 'search')
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch channels', details: error.message },
      { status: 500 }
    );
  }
}

// API 오류시 사용할 더미 채널 데이터 생성 함수
function generateFallbackChannels(query: string) {
  return [
    {
      id: 'dummy1',
      title: `${query} 전문 채널`,
      description: `${query}에 대한 전문적인 콘텐츠를 제공하는 채널입니다.`,
      customUrl: '@dummy-channel-1',
      thumbnails: {
        default: { url: '/placeholder-channel.jpg' },
        medium: { url: '/placeholder-channel.jpg' },
        high: { url: '/placeholder-channel.jpg' }
      },
      publishedAt: '2020-01-15T00:00:00Z',
      country: 'KR',
      subscriberCount: '125K',
      videoCount: '234',
      viewCount: '15.2M',
      rawSubscriberCount: 125000,
      rawVideoCount: 234,
      rawViewCount: 15200000,
      avgViews: '65K',
      rawAvgViews: 65000,
      activityRate: '52.00',
      recentVideos: [],
      keywords: query,
      bannerImageUrl: ''
    },
    {
      id: 'dummy2',
      title: `트렌드 ${query}`,
      description: `최신 ${query} 트렌드와 정보를 빠르게 전달합니다.`,
      customUrl: '@trend-channel',
      thumbnails: {
        default: { url: '/placeholder-channel.jpg' },
        medium: { url: '/placeholder-channel.jpg' },
        high: { url: '/placeholder-channel.jpg' }
      },
      publishedAt: '2019-06-20T00:00:00Z',
      country: 'KR',
      subscriberCount: '89K',
      videoCount: '156',
      viewCount: '8.9M',
      rawSubscriberCount: 89000,
      rawVideoCount: 156,
      rawViewCount: 8900000,
      avgViews: '57K',
      rawAvgViews: 57000,
      activityRate: '64.00',
      recentVideos: [],
      keywords: query,
      bannerImageUrl: ''
    }
  ];
} 