'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database,
  Youtube,
  Users,
  Eye,
  ThumbsUp,
  MessageCircle,
  Clock,
  TrendingUp,
  HardDrive,
  Activity,
  RefreshCw,
  Trash2,
  Settings,
  BarChart3,
  PieChart,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface DashboardStats {
  totalChannels: number;
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalSubscribers: number;
  storageUsed: number;
  lastSyncDate?: string;
  recentActivity: ActivityItem[];
  topChannels: TopChannelItem[];
  topVideos: TopVideoItem[];
  monthlyGrowth: {
    channels: number;
    videos: number;
    views: number;
  };
}

interface ActivityItem {
  id: string;
  type: 'sync' | 'delete' | 'backup' | 'restore' | 'cleanup';
  description: string;
  timestamp: string;
  details?: string;
}

interface TopChannelItem {
  id: string;
  title: string;
  subscriberCount: number;
  videoCount: number;
  thumbnailUrl?: string;
}

interface TopVideoItem {
  id: string;
  title: string;
  viewCount: number;
  likeCount: number;
  channelTitle: string;
  thumbnailUrl?: string;
}

export default function DataManagementDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 채널 데이터 로드
      const channelsResponse = await fetch('/api/analytics/channels');
      if (!channelsResponse.ok) {
        throw new Error('채널 데이터를 불러올 수 없습니다');
      }
      const channelsData = await channelsResponse.json();
      const channels = channelsData.data?.channels || [];

      // 비디오 데이터 로드
      const videosResponse = await fetch('/api/analytics/videos?limit=1000');
      if (!videosResponse.ok) {
        throw new Error('비디오 데이터를 불러올 수 없습니다');
      }
      const videosData = await videosResponse.json();
      const videos = videosData.data?.videos || [];

      // 통계 계산
      const totalViews = videos.reduce((sum: number, video: any) => sum + (video.viewCount || 0), 0);
      const totalLikes = videos.reduce((sum: number, video: any) => sum + (video.likeCount || 0), 0);
      const totalComments = videos.reduce((sum: number, video: any) => sum + (video.commentCount || 0), 0);
      const totalSubscribers = channels.reduce((sum: number, channel: any) => sum + (channel.subscriberCount || 0), 0);

      // 상위 채널 (구독자 순)
      const topChannels = channels
        .sort((a: any, b: any) => (b.subscriberCount || 0) - (a.subscriberCount || 0))
        .slice(0, 5)
        .map((channel: any) => ({
          id: channel.id,
          title: channel.title,
          subscriberCount: channel.subscriberCount || 0,
          videoCount: channel._count?.videos || 0,
          thumbnailUrl: channel.thumbnailUrl
        }));

      // 상위 비디오 (조회수 순)
      const topVideos = videos
        .sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5)
        .map((video: any) => ({
          id: video.id,
          title: video.title,
          viewCount: video.viewCount || 0,
          likeCount: video.likeCount || 0,
          channelTitle: video.channel?.title || '알 수 없음',
          thumbnailUrl: video.thumbnailUrl
        }));

      // 최근 활동 (임시 데이터 - 실제 구현시 별도 테이블 필요)
      const recentActivity: ActivityItem[] = [
        {
          id: '1',
          type: 'sync',
          description: '새로운 채널 데이터 동기화 완료',
          timestamp: new Date().toISOString(),
          details: `${channels.length}개 채널, ${videos.length}개 비디오`
        },
        {
          id: '2',
          type: 'backup',
          description: '데이터 백업 생성',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: '전체 데이터베이스'
        }
      ];

      // 월간 성장률 (임시 계산 - 실제로는 히스토리 데이터 필요)
      const monthlyGrowth = {
        channels: Math.floor(Math.random() * 20) + 5,
        videos: Math.floor(Math.random() * 50) + 10,
        views: Math.floor(Math.random() * 100000) + 50000
      };

      const dashboardStats: DashboardStats = {
        totalChannels: channels.length,
        totalVideos: videos.length,
        totalViews,
        totalLikes,
        totalComments,
        totalSubscribers,
        storageUsed: Math.floor((channels.length * 2 + videos.length * 5) / 1024),
        lastSyncDate: channels[0]?.lastSyncAt || channels[0]?.createdAt,
        recentActivity,
        topChannels,
        topVideos,
        monthlyGrowth
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error);
      setError(error instanceof Error ? error.message : '데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sync': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'backup': return <Download className="h-4 w-4 text-green-500" />;
      case 'restore': return <Upload className="h-4 w-4 text-orange-500" />;
      case 'cleanup': return <Settings className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-600">대시보드 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-700">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 새로고침 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-blue-500" />
            데이터 관리 대시보드
          </h2>
          <p className="text-gray-600 mt-1">저장된 YouTube 데이터의 현황과 통계를 확인하세요</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <Database className="h-4 w-4 mr-2" />
              총 채널
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalChannels}</div>
            <p className="text-xs text-blue-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              이번 달 +{stats.monthlyGrowth.channels}개
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center">
              <Youtube className="h-4 w-4 mr-2" />
              총 비디오
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{stats.totalVideos}</div>
            <p className="text-xs text-red-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              이번 달 +{stats.monthlyGrowth.videos}개
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              총 조회수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatNumber(stats.totalViews)}</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              이번 달 +{formatNumber(stats.monthlyGrowth.views)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              총 구독자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{formatNumber(stats.totalSubscribers)}</div>
            <p className="text-xs text-purple-600 mt-1">
              추적 중인 채널들의 구독자 합계
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 세부 통계 및 시스템 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 상세 메트릭 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <PieChart className="h-5 w-5 mr-2" />
              상세 통계
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <ThumbsUp className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm">총 좋아요</span>
              </div>
              <span className="font-semibold">{formatNumber(stats.totalLikes)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">총 댓글</span>
              </div>
              <span className="font-semibold">{formatNumber(stats.totalComments)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <HardDrive className="h-4 w-4 mr-2 text-purple-500" />
                <span className="text-sm">저장공간 사용량</span>
              </div>
              <span className="font-semibold">{stats.storageUsed} MB</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-orange-500" />
                <span className="text-sm">마지막 동기화</span>
              </div>
              <span className="text-xs text-gray-600">
                {stats.lastSyncDate ? new Date(stats.lastSyncDate).toLocaleString() : '없음'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 상위 채널 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Database className="h-5 w-5 mr-2" />
              상위 채널 (구독자순)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topChannels.map((channel, index) => (
                <div key={channel.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                    {index + 1}
                  </div>
                  {channel.thumbnailUrl && (
                    <img
                      src={channel.thumbnailUrl}
                      alt={channel.title}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{channel.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatNumber(channel.subscriberCount)} 구독자 • {channel.videoCount} 비디오
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 상위 비디오 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Youtube className="h-5 w-5 mr-2" />
              상위 비디오 (조회수순)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topVideos.map((video, index) => (
                <div key={video.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-700">
                    {index + 1}
                  </div>
                  {video.thumbnailUrl && (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-8 h-6 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatNumber(video.viewCount)} 조회수 • {video.channelTitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 활동 및 빠른 액션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Activity className="h-5 w-5 mr-2" />
              최근 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.description}</p>
                    {activity.details && (
                      <p className="text-xs text-gray-600">{activity.details}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 빠른 액션 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="h-5 w-5 mr-2" />
              빠른 액션
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2"
              >
                <RefreshCw className="h-6 w-6 text-blue-500" />
                <span className="text-sm">데이터 동기화</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2"
              >
                <Download className="h-6 w-6 text-green-500" />
                <span className="text-sm">백업 생성</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2"
              >
                <Trash2 className="h-6 w-6 text-red-500" />
                <span className="text-sm">데이터 정리</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2"
              >
                <Settings className="h-6 w-6 text-purple-500" />
                <span className="text-sm">설정 관리</span>
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">시스템 상태</span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600">데이터베이스 상태</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    정상
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600">마지막 백업</span>
                  <span className="text-xs text-gray-600">1시간 전</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600">다음 정리 예정</span>
                  <span className="text-xs text-gray-600">3일 후</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 