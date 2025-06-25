'use client';

import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Youtube, BarChart3, TrendingUp, Users, Eye, Loader2, Search, Play, ThumbsUp, MessageCircle, Calendar, ArrowUpDown, ChevronUp, ChevronDown, Download, Star, Target, TrendingDown } from 'lucide-react';
import { DashboardHeader } from './components/dashboard-header';
import { YouTubeChannel } from '@/lib/youtube';

// YouTube 영상 타입 정의
interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  publishedAt: string;
  channelTitle: string;
  channelId: string;
  duration: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  tags?: string[];
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
  rawSubscriberCount: number;
  rawTotalVideos: number;
}

type SortField = 'title' | 'channelTitle' | 'viewCount' | 'likeCount' | 'commentCount' | 'publishedAt' | 'duration' | 'subscriberCount' | 'channelContribution' | 'performanceMultiplier' | 'cii' | 'engagementRate';
type SortDirection = 'asc' | 'desc';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('viewCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchChannels();
    }
  }, [status, session]);

  const fetchChannels = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 임시 모킹 데이터 - 실제 YouTube API 대신 사용
      console.log('🚀 임시 모킹 데이터로 대시보드 표시');
      
      const mockChannels: YouTubeChannel[] = [
        {
          id: 'UC_mock_channel_id',
          title: 'doo han yoon',
          description: 'YouTube 채널에 오신 것을 환영합니다!',
          thumbnails: {
            default: { url: session.user?.image || '/default-avatar.png' },
            medium: { url: session.user?.image || '/default-avatar.png' },
            high: { url: session.user?.image || '/default-avatar.png' }
          },
          publishedAt: '2020-01-01T00:00:00Z',
          subscriberCount: '156',
          videoCount: '23',
          viewCount: '15420'
        }
      ];
      
      setChannels(mockChannels);
      console.log('✅ 모킹 채널 데이터 로드 완료:', mockChannels.length);
      
    } catch (err) {
      setError('네트워크 오류가 발생했습니다');
      console.error('채널 정보 가져오기 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchVideos = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearching(true);
      setError(null);
      
      console.log('🔍 실제 YouTube API 호출:', searchQuery);
      
      // 실제 YouTube API 호출
      const response = await fetch(`/api/youtube/videos?q=${encodeURIComponent(searchQuery)}&maxResults=50`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'YouTube API 호출 실패');
      }
      
      if (data.usesFallback) {
        console.log('⚠️ API 할당량 초과 - 더미 데이터 사용');
        setError('YouTube API 할당량 초과 - 더미 데이터를 표시합니다');
      } else {
        console.log(`✅ 실제 YouTube 데이터 로드: ${data.videos.length}개`);
      }
      
      setSearchResults(data.videos || []);
      
    } catch (error: any) {
      console.error('❌ YouTube API 호출 실패:', error);
      setError(`검색 실패: ${error.message}`);
      
      // 에러 발생시 더미 데이터로 대체
      console.log('🔄 에러 발생 - 더미 데이터로 대체');
      const fallbackVideos = generateFallbackVideos(searchQuery);
      setSearchResults(fallbackVideos);
      
    } finally {
      setSearching(false);
    }
  };

  // 에러시 사용할 더미 데이터 생성 함수 (컴포넌트 내부용)
  const generateFallbackVideos = (query: string) => {
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
        rawSubscriberCount: channel.subscribers,
        rawTotalVideos: channel.videos,
        subscriberCount: channel.subscribers >= 1000000 ? `${(channel.subscribers / 1000000).toFixed(1)}M` : `${(channel.subscribers / 1000).toFixed(0)}K`,
        totalVideos: channel.videos >= 1000 ? `${(channel.videos / 1000).toFixed(1)}K` : channel.videos.toString(),
        channelContribution: ((views / channelTotalViews) * 100).toFixed(2),
        performanceMultiplier: (((likes + comments) / views) * 1000).toFixed(2),
        cii: ((views / channel.subscribers) * 100).toFixed(2),
        engagementRate: (((likes + comments) / views) * 100).toFixed(2),
        subtitles: Math.random() > 0.3 ? '있음' : '없음'
      };
    });
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchVideos();
    }
  };

  const formatNumber = (num: string) => {
    const number = parseInt(num);
    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(1)}M`;
    } else if (number >= 1000) {
      return `${(number / 1000).toFixed(1)}K`;
    }
    return number.toLocaleString();
  };

  const formatDuration = (duration: string) => {
    // 이미 포맷된 문자열이면 그대로 반환
    if (duration.includes(':')) return duration;
    
    // 초 단위로 변환
    const totalSeconds = parseInt(duration);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return '오늘';
    if (diffInDays === 1) return '1일 전';
    if (diffInDays < 7) return `${diffInDays}일 전`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}주 전`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}개월 전`;
    return `${Math.floor(diffInDays / 365)}년 전`;
  };

  // 성과 등급 계산 함수
  const getPerformanceGrade = (views: number, likes: number, comments: number) => {
    const likeRatio = (likes / views) * 100;
    const commentRatio = (comments / views) * 100;
    const engagementScore = likeRatio + commentRatio;
    
    if (engagementScore >= 8) return { grade: 'Great!', color: 'bg-green-500', textColor: 'text-green-700' };
    if (engagementScore >= 5) return { grade: 'Good', color: 'bg-blue-400', textColor: 'text-blue-700' };
    if (engagementScore >= 2) return { grade: 'Not bad', color: 'bg-yellow-400', textColor: 'text-yellow-700' };
    return { grade: 'Bad', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  // 경쟁력 점수 계산
  const getCompetitiveScore = (views: number, publishedAt: string) => {
    const daysOld = Math.floor((Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24));
    const dailyViews = views / Math.max(daysOld, 1);
    
    if (dailyViews >= 10000) return { score: 99, label: '최고 경쟁력' };
    if (dailyViews >= 5000) return { score: 85, label: '높은 경쟁력' };
    if (dailyViews >= 1000) return { score: 65, label: '보통 경쟁력' };
    if (dailyViews >= 100) return { score: 35, label: '낮은 경쟁력' };
    return { score: 15, label: '매우 낮음' };
  };

  // 추천도 계산
  const getRecommendationScore = (views: number, likes: number, comments: number) => {
    const engagement = ((likes + comments * 3) / views) * 100;
    return Math.min(Math.floor(engagement * 20), 100);
  };

  // 엑셀 내보내기 함수
  const exportToExcel = () => {
    if (searchResults.length === 0) {
      alert('내보낼 데이터가 없습니다. 먼저 검색을 해주세요.');
      return;
    }

    const csvContent = [
      // 헤더 (이미지와 동일한 컬럼 구성)
      ['순위', '제목', '채널명', '게시일', '구독자수', '조회수', '좋아요 기여도(%)', '성과등급', 'CII', '영상길이', '좋아요수', '경쟁력(%)', '댓글수', '추천도(%)', '분석일자', 'URL'].join(','),
      // 데이터
      ...sortedResults.map((video, index) => {
        const rawViews = parseInt(video.viewCount.replace(/[^\d]/g, '')) || 0;
        const rawLikes = parseInt(video.likeCount.replace(/[^\d]/g, '')) || 0;
        const rawComments = parseInt(video.commentCount.replace(/[^\d]/g, '')) || 0;
        
        const performance = getPerformanceGrade(rawViews, rawLikes, rawComments);
        const competitive = getCompetitiveScore(rawViews, video.publishedAt);
        const recommendation = getRecommendationScore(rawViews, rawLikes, rawComments);
        const likeContributionRatio = rawViews > 0 ? ((rawLikes / rawViews) * 100).toFixed(1) : '0.0';
        const subscriberCount = Math.floor(Math.random() * 1000000) + 10000;
        const cti = (Math.random() * 10).toFixed(1);

        return [
          index + 1,
          `"${video.title.replace(/"/g, '""')}"`,
          `"${video.channelTitle.replace(/"/g, '""')}"`,
          formatDate(video.publishedAt),
          formatNumber(subscriberCount.toString()),
          formatNumber(video.viewCount),
          likeContributionRatio,
          performance.grade,
          cti,
          formatDuration(video.duration),
          formatNumber(video.likeCount),
          competitive.score,
          formatNumber(video.commentCount),
          recommendation,
          new Date().toLocaleDateString('ko-KR'),
          `"https://youtube.com/watch?v=${video.id}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `TubeSpy_YouTube분석결과_${searchQuery || '전체'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 성공 메시지
    alert(`✅ 분석 결과가 성공적으로 내보내졌습니다!\n📊 ${searchResults.length}개 영상 데이터\n📁 다운로드 폴더를 확인하세요.`);
  };

  // 정렬 함수
  const handleSort = (field: SortField) => {
    let direction: SortDirection = 'desc';
    if (sortField === field && sortDirection === 'desc') {
      direction = 'asc';
    }
    setSortField(field);
    setSortDirection(direction);
  };

  // 정렬된 결과 계산
  const sortedResults = [...searchResults].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'channelTitle':
        aValue = a.channelTitle.toLowerCase();
        bValue = b.channelTitle.toLowerCase();
        break;
      case 'viewCount':
        aValue = a.rawViewCount || 0;
        bValue = b.rawViewCount || 0;
        break;
      case 'likeCount':
        aValue = a.rawLikeCount || 0;
        bValue = b.rawLikeCount || 0;
        break;
      case 'commentCount':
        aValue = a.rawCommentCount || 0;
        bValue = b.rawCommentCount || 0;
        break;
      case 'subscriberCount':
        aValue = a.rawSubscriberCount || 0;
        bValue = b.rawSubscriberCount || 0;
        break;
      case 'publishedAt':
        aValue = new Date(a.publishedAt).getTime();
        bValue = new Date(b.publishedAt).getTime();
        break;
      case 'duration':
        // 영상 길이를 초로 변환해서 정렬
        const getDurationInSeconds = (duration: string) => {
          const parts = duration.split(':');
          if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
          }
          return 0;
        };
        aValue = getDurationInSeconds(a.duration);
        bValue = getDurationInSeconds(b.duration);
        break;
      case 'channelContribution':
        aValue = parseFloat(a.channelContribution || '0');
        bValue = parseFloat(b.channelContribution || '0');
        break;
      case 'performanceMultiplier':
        aValue = parseFloat(a.performanceMultiplier || '0');
        bValue = parseFloat(b.performanceMultiplier || '0');
        break;
      case 'cii':
        aValue = parseFloat(a.cii || '0');
        bValue = parseFloat(b.cii || '0');
        break;
      case 'engagementRate':
        aValue = parseFloat(a.engagementRate || '0');
        bValue = parseFloat(b.engagementRate || '0');
        break;
      default:
        aValue = 0;
        bValue = 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // 정렬 아이콘 렌더링
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-blue-600" /> : 
      <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  // 로딩 중이거나 세션이 없을 때
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  // 총 통계 계산
  const totalStats = {
    channels: channels.length,
    totalViews: searchResults.reduce((sum, video) => sum + parseInt(video.viewCount), 0),
    totalLikes: searchResults.reduce((sum, video) => sum + parseInt(video.likeCount), 0),
    totalVideos: searchResults.length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {session && <DashboardHeader session={session} />}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">내 채널</CardTitle>
              <Youtube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.channels}</div>
              <p className="text-xs text-muted-foreground">연결된 채널 수</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">검색된 영상</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalVideos}</div>
              <p className="text-xs text-muted-foreground">분석 대상 영상</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 조회수</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totalStats.totalViews.toString())}</div>
              <p className="text-xs text-muted-foreground">검색 영상 누적 조회수</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 좋아요</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totalStats.totalLikes.toString())}</div>
              <p className="text-xs text-muted-foreground">검색 영상 누적 좋아요</p>
            </CardContent>
          </Card>
        </div>

        {/* YouTube 영상 검색 섹션 */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Search className="mr-2 h-5 w-5" />
              YouTube 영상 검색 및 분석
            </h2>
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="검색할 키워드를 입력하세요 (예: 코딩 튜토리얼, 요리 레시피, 리뷰 등)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={searchVideos} 
                disabled={searching || !searchQuery.trim()}
                className="min-w-[100px]"
              >
                {searching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    검색 중...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    검색
                  </>
                )}
              </Button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* 검색 결과 - 전문 분석 테이블 */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    YouTube 영상 분석 결과 ({searchResults.length}개 영상)
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    성과등급, 경쟁력, 추천도를 포함한 전문 분석 데이터
                  </p>
                </div>
                <Button 
                  onClick={exportToExcel}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  엑셀 내보내기
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="px-2 py-3 text-center w-12">
                        <span className="text-xs font-medium text-gray-600 uppercase">#</span>
                      </th>
                      <th className="px-3 py-3 text-left w-20">
                        <span className="text-xs font-medium text-gray-600 uppercase">썸네일</span>
                      </th>
                      <th 
                        className="px-3 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors w-24"
                        onClick={() => handleSort('channelTitle')}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">채널명</span>
                          <SortIcon field="channelTitle" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors min-w-[200px]"
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">제목</span>
                          <SortIcon field="title" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors w-20"
                        onClick={() => handleSort('publishedAt')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">게시일</span>
                          <SortIcon field="publishedAt" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors w-20"
                        onClick={() => handleSort('subscriberCount')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">구독자 수</span>
                          <SortIcon field="subscriberCount" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors w-20"
                        onClick={() => handleSort('viewCount')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">조회수</span>
                          <SortIcon field="viewCount" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors w-20"
                        onClick={() => handleSort('channelContribution')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">채널 기여도</span>
                          <SortIcon field="channelContribution" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors w-20"
                        onClick={() => handleSort('performanceMultiplier')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">성과도 배율</span>
                          <SortIcon field="performanceMultiplier" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors w-16"
                        onClick={() => handleSort('cii')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">CII</span>
                          <SortIcon field="cii" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors w-20"
                        onClick={() => handleSort('duration')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">영상 길이</span>
                          <SortIcon field="duration" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors w-20"
                        onClick={() => handleSort('likeCount')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">좋아요 수</span>
                          <SortIcon field="likeCount" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors w-20"
                        onClick={() => handleSort('commentCount')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">댓글 수</span>
                          <SortIcon field="commentCount" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors w-20"
                        onClick={() => handleSort('engagementRate')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">참여율</span>
                          <SortIcon field="engagementRate" />
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center w-20">
                        <span className="text-xs font-medium text-gray-600 uppercase">총 영상 수</span>
                      </th>
                      <th className="px-3 py-3 text-center w-20">
                        <span className="text-xs font-medium text-gray-600 uppercase">자막</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedResults.map((video, index) => {
                      return (
                        <tr key={video.id} className="hover:bg-gray-50 transition-colors text-xs">
                          {/* 순위 */}
                          <td className="px-2 py-2 text-center">
                            <span className="font-medium">{index + 1}</span>
                          </td>
                          
                          {/* 썸네일 */}
                          <td className="px-3 py-2">
                            <img
                              src={video.thumbnails.medium.url}
                              alt={video.title}
                              className="w-16 h-10 object-cover rounded shadow-sm"
                            />
                          </td>
                          
                          {/* 채널명 */}
                          <td className="px-3 py-2">
                            <p className="text-xs text-gray-700 font-medium truncate max-w-[100px]">
                              {video.channelTitle}
                            </p>
                          </td>
                          
                          {/* 제목 */}
                          <td className="px-3 py-2">
                            <div className="max-w-[200px]">
                              <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight">
                                {video.title}
                              </p>
                            </div>
                          </td>
                          
                          {/* 게시일 */}
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs text-gray-600">{formatDate(video.publishedAt)}</span>
                          </td>
                          
                          {/* 구독자 수 */}
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs font-medium">{video.subscriberCount}</span>
                          </td>
                          
                          {/* 조회수 */}
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs font-bold text-blue-600">{video.viewCount}</span>
                          </td>
                          
                          {/* 채널 기여도 */}
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs text-green-600 font-medium">{video.channelContribution}%</span>
                          </td>
                          
                          {/* 성과도 배율 */}
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs text-purple-600 font-medium">{video.performanceMultiplier}</span>
                          </td>
                          
                          {/* CII (채널 영향력 지수) */}
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs text-orange-600 font-medium">{video.cii}</span>
                          </td>
                          
                          {/* 영상 길이 */}
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs text-gray-600">{formatDuration(video.duration)}</span>
                          </td>
                          
                          {/* 좋아요 수 */}
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs text-red-500 font-medium">{video.likeCount}</span>
                          </td>
                          
                          {/* 댓글 수 */}
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs text-blue-500 font-medium">{video.commentCount}</span>
                          </td>
                          
                          {/* 참여율 */}
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs text-green-500 font-bold">{video.engagementRate}%</span>
                          </td>
                          
                          {/* 총 영상 수 */}
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs text-gray-500">{video.totalVideos}</span>
                          </td>
                          
                          {/* 자막 */}
                          <td className="px-3 py-2 text-center">
                            <span className={`text-xs px-2 py-1 rounded-full text-white font-medium ${
                              video.subtitles === '있음' ? 'bg-green-500' : 'bg-gray-400'
                            }`}>
                              {video.subtitles}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 내 채널 정보 */}
        {channels.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">내 YouTube 채널</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {channels.map((channel) => (
                <Card key={channel.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={channel.thumbnails.medium.url}
                        alt={channel.title}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <CardTitle className="text-lg">{channel.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {formatDate(channel.publishedAt)}에 시작
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">구독자</span>
                      <span className="font-medium">{formatNumber(channel.subscriberCount)}명</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">동영상</span>
                      <span className="font-medium">{formatNumber(channel.videoCount)}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">총 조회수</span>
                      <span className="font-medium">{formatNumber(channel.viewCount)}회</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 