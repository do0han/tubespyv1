'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Youtube, BarChart3, TrendingUp, Users, Eye, Loader2, Search, Play, ThumbsUp, MessageCircle, Calendar, ArrowUpDown, ChevronUp, ChevronDown, Download, Star, Target, Filter, Settings } from 'lucide-react';

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
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('viewCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // 필터 상태
  const [filters, setFilters] = useState({
    maxResults: 50,
    minViews: '',
    maxViews: '',
    minSubscribers: 10000,
    maxSubscribers: 10000000,
    videoDuration: 'any',
    sortBy: 'relevance'
  });

  const searchVideos = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearching(true);
      setError(null);
      
      console.log('🔍 검색 중:', searchQuery);
      
      // 실제 API 호출
      const response = await fetch(`/api/youtube/videos?q=${encodeURIComponent(searchQuery)}&maxResults=${filters.maxResults}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API 호출 실패');
      }
      
      if (data.usesFallback) {
        console.log('⚠️ 더미 데이터 사용');
        setError('YouTube API 할당량 초과 - 더미 데이터를 표시합니다');
      }
      
      // 실제 YouTube API 데이터에 새로운 성과도 등급 적용
      const videosWithGrades = (data.videos || []).map((video: any) => ({
        ...video,
        cii: (() => {
          const gradeData = getPerformanceGrade(video.rawViewCount, video.rawSubscriberCount);
          return gradeData.grade;
        })()
      }));
      
      setSearchResults(videosWithGrades);
      
    } catch (error: any) {
      console.error('❌ 검색 실패:', error);
      setError(`검색 실패: ${error.message}`);
      
      // 에러시 더미 데이터 생성
      const fallbackVideos = generateDummyVideos(searchQuery);
      setSearchResults(fallbackVideos);
      
    } finally {
      setSearching(false);
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

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchVideos();
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Youtube className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">TubeSpy</h1>
              <span className="text-sm text-gray-500">영상 분석 도구</span>
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 좌측 필터 패널 */}
          <div className="w-80">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="mr-2 h-5 w-5" />
                  영상 검색 & 분석
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 검색어 입력 */}
                <div>
                  <Label htmlFor="search">검색 키워드</Label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="예: 쿠팡꿀템, 주식투자, 요리레시피"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="mt-1"
                  />
                </div>

                {/* 검색 버튼 */}
                <Button 
                  onClick={searchVideos} 
                  disabled={searching || !searchQuery.trim()}
                  className="w-full"
                >
                  {searching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      검색 중...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      영상 검색
                    </>
                  )}
                </Button>

                {/* 고급 필터 */}
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3 flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    고급 필터
                  </h3>
                  
                  {/* 결과 수 */}
                  <div className="mb-4">
                    <Label>결과 수: {filters.maxResults}개</Label>
                    <Slider
                      value={[filters.maxResults]}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, maxResults: value[0] }))}
                      max={50}
                      min={10}
                      step={10}
                      className="mt-2"
                    />
                  </div>

                  {/* 구독자 수 범위 */}
                  <div className="mb-4">
                    <Label>구독자 수 범위</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm text-gray-500">
                        {filters.minSubscribers.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">-</span>
                      <span className="text-sm text-gray-500">
                        {filters.maxSubscribers.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 영상 길이 */}
                  <div className="mb-4">
                    <Label>영상 길이</Label>
                    <Select value={filters.videoDuration} onValueChange={(value) => setFilters(prev => ({ ...prev, videoDuration: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">전체</SelectItem>
                        <SelectItem value="short">짧음 (4분 미만)</SelectItem>
                        <SelectItem value="medium">보통 (4-20분)</SelectItem>
                        <SelectItem value="long">김 (20분 이상)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 정렬 방식 */}
                  <div>
                    <Label>정렬 방식</Label>
                    <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">관련성</SelectItem>
                        <SelectItem value="date">최신순</SelectItem>
                        <SelectItem value="viewCount">조회수</SelectItem>
                        <SelectItem value="rating">평점</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 메인 컨텐츠 영역 */}
          <div className="flex-1">
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

            {/* 검색 결과 테이블 */}
            {searchResults.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            썸네일
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('title')}
                          >
                            <div className="flex items-center">
                              제목
                              <SortIcon field="title" />
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('channelTitle')}
                          >
                            <div className="flex items-center">
                              채널명
                              <SortIcon field="channelTitle" />
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('viewCount')}
                          >
                            <div className="flex items-center">
                              조회수
                              <SortIcon field="viewCount" />
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('likeCount')}
                          >
                            <div className="flex items-center">
                              좋아요
                              <SortIcon field="likeCount" />
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('commentCount')}
                          >
                            <div className="flex items-center">
                              댓글수
                              <SortIcon field="commentCount" />
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            성과도
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('publishedAt')}
                          >
                            <div className="flex items-center">
                              게시일
                              <SortIcon field="publishedAt" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedResults.map((video, index) => (
                          <tr key={video.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <img 
                                src={video.thumbnails.medium.url} 
                                alt="썸네일"
                                className="w-20 h-auto rounded"
                              />
                            </td>
                            <td className="px-4 py-4 max-w-xs">
                              <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                {video.title}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{video.channelTitle}</div>
                              <div className="text-xs text-gray-500">구독자 {video.subscriberCount}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{video.viewCount}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{video.likeCount}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{video.commentCount}</div>
                            </td>
                                                         <td className="px-4 py-4 whitespace-nowrap">
                               {(() => {
                                 // rawSubscriberCount가 있으면 사용, 없으면 subscriberCount에서 파싱
                                 const subscriberCount = video.rawSubscriberCount || parseInt(video.subscriberCount.replace(/[^0-9]/g, '')) || 1;
                                 const gradeData = getPerformanceGrade(video.rawViewCount, subscriberCount);
                                 return (
                                   <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${gradeData.color}`}>
                                     {gradeData.grade}
                                   </span>
                                 );
                               })()}
                             </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(video.publishedAt).toLocaleDateString('ko-KR')}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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