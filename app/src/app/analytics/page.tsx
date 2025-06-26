'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCcw, AlertCircle, Database, Youtube } from 'lucide-react';

import MetricCard from '@/components/analytics/MetricCard';
import ChannelOverview from '@/components/analytics/ChannelOverview';
import VideoAnalyticsList from '@/components/analytics/VideoAnalyticsList';

interface ChannelAnalytics {
  id: string;
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  customUrl?: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  publishedAt?: string;
  country?: string;
  language?: string;
  lastSyncAt?: string;
  analytics: {
    totalVideos: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    avgViews: number;
    avgLikes: number;
    avgComments: number;
    engagementRate: number;
    recentVideosCount: number;
    highPerformingVideosCount: number;
    recentVideos: any[];
    topVideos: any[];
  };
}

interface VideoAnalytics {
  id: string;
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  duration?: string;
  categoryId?: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  privacyStatus?: string;
  uploadStatus?: string;
  analytics: {
    engagementRate: number;
    uploadedDaysAgo: number | null;
    performanceGrade: 'excellent' | 'high' | 'medium' | 'low';
    viewsPerDay: number;
    likesPerView: string;
    commentsPerView: string;
  };
  channel: {
    id: string;
    youtubeId: string;
    title: string;
    thumbnailUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
}

const AnalyticsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [channelsData, setChannelsData] = useState<ChannelAnalytics[]>([]);
  const [videosData, setVideosData] = useState<VideoAnalytics[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // 채널 분석 데이터 가져오기
  const fetchChannelAnalytics = async () => {
    try {
      console.log('📊 채널 분석 데이터 가져오기 시작');
      
      const response = await fetch('/api/analytics/channels');
      const result = await response.json();

      if (result.success) {
        setChannelsData(result.data.channels);
        setSummaryData(result.data.summary);
        console.log('✅ 채널 분석 데이터 로드 완료:', result.data.channels.length, '개 채널');
      } else {
        throw new Error(result.error || '채널 데이터를 가져오는데 실패했습니다');
      }
    } catch (error) {
      console.error('❌ 채널 분석 데이터 가져오기 실패:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다');
    }
  };

  // 비디오 분석 데이터 가져오기
  const fetchVideoAnalytics = async () => {
    try {
      console.log('📊 비디오 분석 데이터 가져오기 시작');
      
      const response = await fetch('/api/analytics/videos?limit=20&sortBy=publishedAt&order=desc');
      const result = await response.json();

      if (result.success) {
        setVideosData(result.data.videos);
        console.log('✅ 비디오 분석 데이터 로드 완료:', result.data.videos.length, '개 비디오');
      } else {
        throw new Error(result.error || '비디오 데이터를 가져오는데 실패했습니다');
      }
    } catch (error) {
      console.error('❌ 비디오 분석 데이터 가져오기 실패:', error);
      // 비디오 데이터는 필수가 아니므로 에러를 설정하지 않음
    }
  };

  // 데이터 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchChannelAnalytics(),
        fetchVideoAnalytics()
      ]);
    } catch (error) {
      console.error('❌ 데이터 새로고침 실패:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
      return;
    }

    if (session?.user) {
      const loadData = async () => {
        setLoading(true);
        setError(null);
        
        try {
          await Promise.all([
            fetchChannelAnalytics(),
            fetchVideoAnalytics()
          ]);
        } catch (error) {
          console.error('❌ 초기 데이터 로드 실패:', error);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [session, status, router]);

  // 로딩 상태
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">분석 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 상태
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="flex items-center space-x-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">분석 대시보드</h1>
              <p className="text-gray-600 mt-2">저장된 YouTube 채널 및 비디오 데이터 분석</p>
            </div>
            <div className="flex space-x-2">
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
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? '새로고침 중...' : '새로고침'}
            </Button>
          </div>
        </div>

        {/* 에러 알림 */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 데이터 없음 */}
        {!loading && channelsData.length === 0 && (
          <div className="text-center py-16">
            <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              분석할 데이터가 없습니다
            </h3>
            <p className="text-gray-500 mb-6">
              먼저 YouTube 검색을 통해 데이터를 수집하고 데이터베이스에 저장해주세요.
            </p>
            <Button 
              onClick={() => router.push('/dashboard')}
              variant="default"
            >
              YouTube 검색하러 가기
            </Button>
          </div>
        )}

        {/* 분석 데이터 표시 */}
        {!loading && channelsData.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">개요</TabsTrigger>
              <TabsTrigger value="channels">채널 분석</TabsTrigger>
              <TabsTrigger value="videos">비디오 분석</TabsTrigger>
            </TabsList>

            {/* 개요 탭 */}
            <TabsContent value="overview" className="space-y-6">
              {/* 요약 메트릭 */}
              {summaryData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="총 채널 수"
                    value={summaryData.totalChannels}
                    icon="subscribers"
                    subtitle="분석된 채널"
                  />
                  <MetricCard
                    title="총 비디오 수"
                    value={summaryData.totalVideos}
                    icon="videos"
                    subtitle="분석된 비디오"
                  />
                  <MetricCard
                    title="총 조회수"
                    value={summaryData.totalViews}
                    icon="views"
                    subtitle="누적 조회수"
                  />
                  <MetricCard
                    title="평균 참여율"
                    value={`${summaryData.avgEngagementRate}%`}
                    icon="engagement"
                    subtitle="전체 평균"
                  />
                </div>
              )}

              {/* 상위 채널들 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {channelsData.slice(0, 2).map((channel) => (
                  <ChannelOverview key={channel.id} channel={channel} />
                ))}
              </div>
            </TabsContent>

            {/* 채널 분석 탭 */}
            <TabsContent value="channels" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {channelsData.map((channel) => (
                  <ChannelOverview key={channel.id} channel={channel} />
                ))}
              </div>
            </TabsContent>

            {/* 비디오 분석 탭 */}
            <TabsContent value="videos" className="space-y-6">
              <VideoAnalyticsList
                videos={videosData}
                loading={refreshing}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage; 