'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Youtube, BarChart3, TrendingUp, Users, Eye, Loader2, Search, Play, ThumbsUp, MessageCircle, Calendar, ArrowUpDown, ChevronUp, ChevronDown, Download, Star, Target, Filter, Settings, Database } from 'lucide-react';
import SearchFilterPanel from '@/components/SearchFilterPanel';

// YouTube 영상 타입 정의
interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  subscriberCount: string;
  totalVideos: string;
  channelContribution: string;
  performanceMultiplier: string;
  cii: string;
  engagementRate: string;
  subtitles: string;
  rawViewCount: number;
  rawLikeCount: number;
  rawCommentCount: number;
  rawSubscriberCount?: number; // 실제 API 데이터용
}

type SortField = 'title' | 'channelTitle' | 'viewCount' | 'likeCount' | 'commentCount' | 'publishedAt';
type SortDirection = 'asc' | 'desc';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('viewCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // 필터 상태 (이미지 디자인에 맞게 수정)
  const [filters, setFilters] = useState({
    sortOrder: 'latest' as 'latest' | 'viewCount',
    maxResults: 100,
    period: '7days',
    country: 'KR',
    contentType: 'all' as 'all' | 'shorts' | 'long',
    influenceLevel: [] as string[],
    viewCountFilter: 'none',
    subscriberFilter: 'none',
    searchMode: 'video' as 'video' | 'channel'
  });

  const searchVideos = async (query: string, searchFilters: any, isLoadMore = false, pageToken?: string) => {
    if (!query.trim()) return;
    
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setSearching(true);
        setSearchResults([]); // 새 검색시 기존 결과 초기화
        setNextPageToken(null);
        setHasMoreData(false);
        setCurrentQuery(query);
      }
      setError(null);
      
      const searchMode = searchFilters.searchMode || 'video';
      console.log(`🔍 ${searchMode === 'video' ? '영상' : '채널'} 검색 중:`, query, isLoadMore ? '(더보기)' : '(새검색)');
      
      // 검색 모드에 따라 다른 API 호출
      const apiEndpoint = searchMode === 'video' ? 'videos' : 'channels';
      let url = `/api/youtube/${apiEndpoint}?q=${encodeURIComponent(query)}&maxResults=${searchFilters.maxResults}`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API 호출 실패');
      }
      
      if (data.usesFallback) {
        console.log('⚠️ 더미 데이터 사용');
        setError('YouTube API 할당량 초과 - 더미 데이터를 표시합니다');
      }
      
      // 페이지네이션 정보 업데이트
      setNextPageToken(data.nextPageToken || null);
      setHasMoreData(!!data.nextPageToken);

      if (searchMode === 'video') {
        // 영상 검색 결과 처리
        const videosWithGrades = (data.videos || []).map((video: any) => ({
          ...video,
          cii: (() => {
            const gradeData = getPerformanceGrade(video.rawViewCount, video.rawSubscriberCount);
            return gradeData.grade;
          })()
        }));
        
        if (isLoadMore) {
          // 중복 제거하면서 결과 추가
          setSearchResults(prev => {
            const existingIds = new Set(prev.map((v: any) => v.id));
            const newVideos = videosWithGrades.filter((v: any) => !existingIds.has(v.id));
            return [...prev, ...newVideos];
          });
        } else {
          setSearchResults(videosWithGrades);
        }
      } else {
        // 채널 검색 결과를 영상 형태로 변환하여 표시
        const channelsAsVideos = (data.channels || []).map((channel: any) => ({
          id: channel.id,
          title: channel.title,
          channelTitle: channel.title,
          thumbnails: channel.thumbnails,
          publishedAt: channel.publishedAt,
          duration: '채널',
          viewCount: channel.viewCount,
          likeCount: channel.subscriberCount,
          commentCount: channel.videoCount,
          subscriberCount: channel.subscriberCount,
          totalVideos: channel.videoCount,
          channelContribution: channel.activityRate + '%',
          performanceMultiplier: channel.activityRate + '%',
          cii: channel.activityRate > 50 ? 'Good' : channel.activityRate > 20 ? 'Soso' : 'Bad',
          engagementRate: channel.activityRate + '%',
          subtitles: '채널',
          rawViewCount: channel.rawViewCount,
          rawLikeCount: channel.rawSubscriberCount,
          rawCommentCount: channel.rawVideoCount,
          rawSubscriberCount: channel.rawSubscriberCount,
          isChannel: true // 채널임을 표시
        }));
        
        if (isLoadMore) {
          // 중복 제거하면서 결과 추가
          setSearchResults(prev => {
            const existingIds = new Set(prev.map((v: any) => v.id));
            const newChannels = channelsAsVideos.filter((v: any) => !existingIds.has(v.id));
            return [...prev, ...newChannels];
          });
        } else {
          setSearchResults(channelsAsVideos);
        }
      }
      
    } catch (error: any) {
      console.error('❌ 검색 실패:', error);
      setError(`검색 실패: ${error.message}`);
      
      // 에러시 더미 데이터 생성
      const fallbackVideos = generateDummyVideos(query);
      setSearchResults(fallbackVideos);
      
    } finally {
      setSearching(false);
      setLoadingMore(false);
    }
  };

  // 더미 데이터 생성
  const generateDummyVideos = (query: string) => {
    const channels = [
      { name: '프로 튜토리얼', subscribers: 125000 },
      { name: '트렌드 워치', subscribers: 89000 },
      { name: '실무 꿀팁', subscribers: 167000 },
      { name: '비교 분석가', subscribers: 234000 },
      { name: '초보자 친화', subscribers: 78000 }
    ];

    return Array.from({ length: Math.min(filters.maxResults, 20) }, (_, i) => {
      const channel = channels[i % channels.length];
      // 새로운 성과도 기준에 맞춰 조회수 범위 설정
      const baseViews = Math.random(); // 0~1 사이 랜덤값
      let views;
      
      if (baseViews < 0.2) { // 20% - Bad (구독자수의 0.1~0.5배)
        views = Math.floor(channel.subscribers * (Math.random() * 0.4 + 0.1));
      } else if (baseViews < 0.4) { // 20% - Soso (구독자수의 0.5~1배)
        views = Math.floor(channel.subscribers * (Math.random() * 0.5 + 0.5));
      } else if (baseViews < 0.6) { // 20% - Not bad (구독자수의 1~2배)
        views = Math.floor(channel.subscribers * (Math.random() * 1 + 1));
      } else if (baseViews < 0.8) { // 20% - Good (구독자수의 2~5배) ✨ 이게 좋은 영상!
        views = Math.floor(channel.subscribers * (Math.random() * 3 + 2));
      } else { // 20% - Great! (구독자수의 5배 이상)
        views = Math.floor(channel.subscribers * (Math.random() * 5 + 5));
      }
      
      const likes = Math.floor(views * (Math.random() * 0.05 + 0.01));
      const comments = Math.floor(views * (Math.random() * 0.01 + 0.001));
      const channelAvgViews = Math.floor(channel.subscribers * 0.1);
      const performanceMultiplier = (views / channelAvgViews).toFixed(1);
      const ciiScore = Math.floor((views * 0.7 + likes * 30 + comments * 100) / 1000);
      const channelContribution = ((views / (channel.subscribers * 150)) * 100).toFixed(1);
      const engagementRate = (((likes + comments) / views) * 100).toFixed(2);
      
      // 성과도 등급 계산
      const performanceGrade = getPerformanceGrade(views, channel.subscribers);
      
      return {
        id: `video_${i + 1}`,
        title: `${query} 관련 ${['완벽 가이드', '실전 활용법', '트렌드 분석', '비교 리뷰', '초보자 팁'][i % 5]} - ${i + 1}편`,
        channelTitle: channel.name,
        thumbnails: {
          default: { url: 'https://via.placeholder.com/120x90' },
          medium: { url: 'https://via.placeholder.com/320x180' },
          high: { url: 'https://via.placeholder.com/480x360' }
        },
        publishedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        duration: `${Math.floor(Math.random() * 20 + 5)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        viewCount: views.toLocaleString(),
        likeCount: likes.toLocaleString(),
        commentCount: comments.toLocaleString(),
        subscriberCount: channel.subscribers.toLocaleString(),
        totalVideos: Math.floor(Math.random() * 500 + 50).toString(),
        channelContribution: channelContribution + '%',
        performanceMultiplier: performanceMultiplier + 'x',
        cii: performanceGrade.grade, // 숫자 대신 등급으로 변경
        engagementRate: engagementRate + '%',
        subtitles: Math.random() > 0.5 ? '✓' : '✗',
        rawViewCount: views,
        rawLikeCount: likes,
        rawCommentCount: comments,
        rawSubscriberCount: channel.subscribers
      };
    });
  };

  // 더보기 함수 추가
  const loadMoreResults = async () => {
    if (!hasMoreData || !nextPageToken || !currentQuery || loadingMore) return;
    
    await searchVideos(currentQuery, filters, true, nextPageToken);
  };

  // 데이터베이스 동기화 함수
  const syncToDatabase = async () => {
    if (!searchResults.length || syncing) return;
    
    try {
      setSyncing(true);
      setSyncMessage('');
      setError(null);
      
      console.log(`🔄 데이터베이스 동기화 시작: ${searchResults.length}개 항목`);
      
      const searchMode = filters.searchMode || 'video';
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchResults: searchResults,
          searchMode: searchMode
        })
      });

      const result = await response.json();

      if (result.success) {
        setSyncMessage(`✅ ${result.message}`);
        console.log('✅ 동기화 성공:', result.data);
      } else {
        setError(`동기화 실패: ${result.error}`);
        console.error('❌ 동기화 실패:', result);
      }

    } catch (error) {
      console.error('❌ 동기화 오류:', error);
      setError('동기화 중 오류가 발생했습니다');
    } finally {
      setSyncing(false);
      // 메시지 자동 제거
      setTimeout(() => {
        setSyncMessage('');
      }, 5000);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchVideos(searchQuery, filters);
    }
  };

  const getPerformanceColor = (multiplier: string) => {
    const value = parseFloat(multiplier);
    if (value >= 3.0) return 'bg-green-100 text-green-800';
    if (value >= 1.0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // 구독자 수와 조회수 관계로 성과도 등급 계산
  const getPerformanceGrade = (viewCount: number, subscriberCount: number) => {
    // 조회수가 구독자수의 몇 배인지 계산
    const viewToSubRatio = viewCount / subscriberCount;
    
    if (viewToSubRatio >= 5) return { grade: 'Great!', color: 'bg-green-500 text-white' }; // 조회수가 구독자수의 5배 이상
    if (viewToSubRatio >= 2) return { grade: 'Good', color: 'bg-green-200 text-green-800' }; // 조회수가 구독자수의 2배 이상 
    if (viewToSubRatio >= 1) return { grade: 'Not bad', color: 'bg-yellow-200 text-yellow-800' }; // 조회수가 구독자수와 비슷
    if (viewToSubRatio >= 0.5) return { grade: 'Soso', color: 'bg-orange-200 text-orange-800' }; // 조회수가 구독자수의 절반 이상
    return { grade: 'Bad', color: 'bg-red-500 text-white' }; // 조회수가 구독자수의 절반 미만
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedResults = [...searchResults].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'viewCount':
        aValue = a.rawViewCount;
        bValue = b.rawViewCount;
        break;
      case 'likeCount':
        aValue = a.rawLikeCount;
        bValue = b.rawLikeCount;
        break;
      case 'commentCount':
        aValue = a.rawCommentCount;
        bValue = b.rawCommentCount;
        break;
      case 'publishedAt':
        aValue = new Date(a.publishedAt).getTime();
        bValue = new Date(b.publishedAt).getTime();
        break;
      default:
        aValue = a[sortField].toLowerCase();
        bValue = b[sortField].toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-4 w-4" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="ml-1 h-4 w-4" /> : 
      <ChevronDown className="ml-1 h-4 w-4" />;
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>로그인이 필요합니다</CardTitle>
            <CardDescription>YouTube 분석 도구에 접근하려면 로그인해주세요.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Youtube className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">TubeSpy</h1>
              <span className="text-sm text-gray-500">영상 분석 도구</span>
              <div className="flex space-x-2 ml-8">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-50 border-blue-200 text-blue-700"
                >
                  🔍 YouTube 검색
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/analytics')}
                  className="bg-green-50 border-green-200 text-green-700"
                >
                  📊 데이터 분석
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/data-management')}
                  className="bg-red-50 border-red-200 text-red-700"
                >
                  🗑️ 데이터 관리
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">반갑습니다, {session.user?.name}님</span>
              <img 
                src={session.user?.image || '/default-avatar.png'} 
                alt="Profile" 
                className="w-8 h-8 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-6 pr-12">
        <div className="flex gap-12 max-w-none min-h-screen">
          {/* 새로운 필터 패널 - 폭 1.5배 증가 */}
          <div className="w-80 flex-shrink-0 sticky top-0 h-fit">
            <SearchFilterPanel
            onSearch={(query, filterState) => {
              setSearchQuery(query);
              setCurrentQuery(query); // 현재 검색어 저장
              // 새로운 필터 형식을 기존 형식으로 변환
              const updatedFilters = {
                sortOrder: filterState.sortOrder,
                maxResults: filterState.maxResults,
                period: filterState.period,
                country: filterState.country,
                contentType: filterState.contentType,
                influenceLevel: filterState.influenceLevel,
                viewCountFilter: filterState.viewCountFilter,
                subscriberFilter: filterState.subscriberFilter,
                searchMode: filterState.searchMode || 'video' as 'video' | 'channel'
              };
              setFilters(updatedFilters);
              // 새 검색시 페이지네이션 상태 초기화
              setNextPageToken(null);
              setHasMoreData(true);
              searchVideos(query, updatedFilters);
            }}
            loading={searching}
          />
          </div>

          {/* 메인 컨텐츠 영역 - 더 넓은 공간 사용 */}
          <div className="flex-1 min-w-0">
            {/* 상단 툴바 */}
            <div className="bg-white rounded-lg border p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold">영상 분석 결과</h2>
                  {searchResults.length > 0 && (
                    <span className="text-sm text-gray-500">
                      총 {searchResults.length}개 결과
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={syncToDatabase}
                    disabled={syncing || searchResults.length === 0}
                    className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                  >
                    {syncing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="mr-2 h-4 w-4" />
                    )}
                    {syncing ? '동기화 중...' : 'DB에 저장'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Excel 내보내기
                  </Button>
                  <Button variant="outline" size="sm">
                    <Star className="mr-2 h-4 w-4" />
                    즐겨찾기
                  </Button>
                </div>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <Card className="mb-6 bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <p className="text-yellow-800 text-sm">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* 동기화 성공 메시지 */}
            {syncMessage && (
              <Card className="mb-6 bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <p className="text-green-800 text-sm">{syncMessage}</p>
                </CardContent>
              </Card>
            )}

            {/* 검색 결과 테이블 */}
            {searchResults.length > 0 ? (
              <Card className="w-full">
                <CardContent className="p-0">
                  <div className="overflow-x-auto overflow-y-auto max-h-[700px] border rounded-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <table className="text-xs min-w-[550px] w-full">
                                              <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-10">
                            N
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r w-16">
                            썸네일
                          </th>
                          <th 
                            className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer border-r min-w-[60px] hover:bg-gray-200"
                            onClick={() => handleSort('channelTitle')}
                          >
                            <div className="flex items-center justify-center">
                              채널명
                              <SortIcon field="channelTitle" />
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer border-r min-w-[100px] hover:bg-gray-200"
                            onClick={() => handleSort('title')}
                          >
                            <div className="flex items-center justify-center">
                              제목
                              <SortIcon field="title" />
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer border-r min-w-[70px] hover:bg-gray-200"
                            onClick={() => handleSort('publishedAt')}
                          >
                            <div className="flex items-center justify-center">
                              게시일
                              <SortIcon field="publishedAt" />
                            </div>
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r min-w-[70px]">
                            구독자 수
                          </th>
                          <th 
                            className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer border-r min-w-[70px] hover:bg-gray-200"
                            onClick={() => handleSort('viewCount')}
                          >
                            <div className="flex items-center justify-center">
                              조회수
                              <SortIcon field="viewCount" />
                            </div>
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r min-w-[70px]">
                            채널 기여도
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r min-w-[70px]">
                            성과도 배율
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r min-w-[50px]">
                            CII
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r min-w-[60px]">
                            영상 길이
                          </th>
                          <th 
                            className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer border-r min-w-[60px] hover:bg-gray-200"
                            onClick={() => handleSort('likeCount')}
                          >
                            <div className="flex items-center justify-center">
                              좋아요 수
                              <SortIcon field="likeCount" />
                            </div>
                          </th>
                          <th 
                            className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer border-r min-w-[60px] hover:bg-gray-200"
                            onClick={() => handleSort('commentCount')}
                          >
                            <div className="flex items-center justify-center">
                              댓글 수
                              <SortIcon field="commentCount" />
                            </div>
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r min-w-[50px]">
                            참여율
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r min-w-[60px]">
                            총 영상 수
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[40px]">
                            자막
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedResults.map((video, index) => (
                          <tr key={`${video.id}-${index}`} className={`hover:bg-gray-50 ${index % 3 === 1 ? 'bg-yellow-50' : ''}`}>
                            {/* N */}
                            <td className="px-2 py-2 text-center text-xs text-gray-900 border-r w-10">
                              {index + 1}
                            </td>
                            {/* 썸네일 */}
                            <td className="px-2 py-2 text-center border-r w-16">
                              <img 
                                src={video.thumbnails.medium.url} 
                                alt="썸네일"
                                className="w-12 h-8 object-cover rounded mx-auto cursor-pointer hover:scale-105 transition-transform"
                              />
                            </td>
                            {/* 채널명 */}
                            <td className="px-2 py-2 text-center text-xs text-gray-900 border-r min-w-[60px] max-w-[80px]">
                              <div className="truncate">{video.channelTitle}</div>
                            </td>
                            {/* 제목 */}
                            <td className="px-2 py-2 text-left text-xs text-gray-900 border-r min-w-[100px] max-w-[120px]">
                              <div className="line-clamp-2 leading-tight">{video.title}</div>
                            </td>
                            {/* 게시일 */}
                            <td className="px-2 py-2 text-center text-xs text-gray-900 border-r min-w-[70px]">
                              {new Date(video.publishedAt).toLocaleDateString('ko-KR', { 
                                year: '2-digit', 
                                month: '2-digit', 
                                day: '2-digit' 
                              }).replace(/\. /g, '-').replace('.', '')}
                            </td>
                            {/* 구독자 수 */}
                            <td className="px-2 py-2 text-center text-xs text-gray-900 border-r min-w-[70px]">
                              <span className="font-medium">{video.subscriberCount}</span>
                            </td>
                            {/* 조회수 */}
                            <td className="px-2 py-2 text-center text-xs text-gray-900 border-r min-w-[70px]">
                              <span className="font-medium text-blue-600">{video.viewCount}</span>
                            </td>
                            {/* 채널 기여도 */}
                            <td className="px-2 py-2 text-center text-xs text-gray-900 border-r min-w-[70px]">
                              {video.channelContribution || '1%'}
                            </td>
                            {/* 성과도 배율 */}
                            <td className="px-2 py-2 text-center text-xs text-gray-900 border-r min-w-[70px]">
                              {(() => {
                                const subscriberCount = video.rawSubscriberCount || parseInt(video.subscriberCount.replace(/[^0-9]/g, '')) || 1;
                                const ratio = (video.rawViewCount / subscriberCount).toFixed(2);
                                return ratio;
                              })()}
                            </td>
                            {/* CII */}
                            <td className="px-2 py-2 text-center border-r min-w-[50px]">
                              {(() => {
                                const subscriberCount = video.rawSubscriberCount || parseInt(video.subscriberCount.replace(/[^0-9]/g, '')) || 1;
                                const gradeData = getPerformanceGrade(video.rawViewCount, subscriberCount);
                                return (
                                  <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded ${gradeData.color}`}>
                                    {gradeData.grade}
                                  </span>
                                );
                              })()}
                            </td>
                            {/* 영상 길이 */}
                            <td className="px-2 py-2 text-center text-xs text-gray-900 border-r min-w-[60px]">
                              {video.duration}
                            </td>
                            {/* 좋아요 수 */}
                            <td className="px-2 py-2 text-center text-xs text-gray-900 border-r min-w-[60px]">
                              {video.likeCount}
                            </td>
                            {/* 댓글 수 */}
                            <td className="px-2 py-2 text-center text-xs text-gray-900 border-r min-w-[60px]">
                              {video.commentCount}
                            </td>
                            {/* 참여율 */}
                            <td className="px-2 py-2 text-center text-xs text-gray-900 border-r min-w-[50px]">
                              {video.engagementRate || '1%'}
                            </td>
                            {/* 총 영상 수 */}
                            <td className="px-2 py-2 text-center text-xs text-gray-900 border-r min-w-[60px]">
                              {video.totalVideos}
                            </td>
                            {/* 자막 */}
                            <td className="px-2 py-2 text-center text-xs text-gray-900 min-w-[40px]">
                              {video.subtitles}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* 더보기 버튼 */}
                  {hasMoreData && nextPageToken && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={loadMoreResults}
                        disabled={loadingMore}
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            더 많은 결과 로딩 중...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            더 많은 결과 보기
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Youtube className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">영상을 검색해보세요</h3>
                  <p className="text-gray-500">
                    좌측 검색창에 키워드를 입력하고 검색 버튼을 클릭하세요.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 