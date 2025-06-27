'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import CleanupSettings from '@/components/CleanupSettings';
import BackupRestore from '@/components/BackupRestore';
import DataManagementDashboard from '@/components/DataManagementDashboard';
import { 
  Trash2, 
  AlertTriangle, 
  RefreshCcw, 
  Database,
  Youtube,
  CheckSquare,
  Square,
  Eye,
  ThumbsUp,
  MessageCircle,
  Users,
  Settings,
  Archive,
  BarChart3
} from 'lucide-react';

interface ChannelData {
  id: string;
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  createdAt: string;
  lastSyncAt?: string;
  _count: {
    videos: number;
  };
}

interface VideoData {
  id: string;
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt?: string;
  createdAt: string;
  channel: {
    title: string;
  };
}

export default function DataManagementPage() {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 채널 데이터 로드
      const channelsResponse = await fetch('/api/analytics/channels');
      if (!channelsResponse.ok) {
        throw new Error('채널 데이터를 불러올 수 없습니다');
      }
      const channelsData = await channelsResponse.json();
      console.log('Channels API response:', channelsData);
      setChannels(channelsData.data?.channels || []);

      // 비디오 데이터 로드
      const videosResponse = await fetch('/api/analytics/videos?limit=100');
      if (!videosResponse.ok) {
        throw new Error('비디오 데이터를 불러올 수 없습니다');
      }
      const videosData = await videosResponse.json();
      console.log('Videos API response:', videosData);
      setVideos(videosData.data?.videos || []);

    } catch (error) {
      console.error('데이터 로드 오류:', error);
      setError(error instanceof Error ? error.message : '데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (type: 'channel' | 'video', id: string) => {
    if (!confirm(`이 ${type === 'channel' ? '채널' : '비디오'}을 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/data-management/delete?type=${type}&id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '삭제에 실패했습니다');
      }

      const result = await response.json();
      alert(result.message);
      
      // 데이터 새로고침
      await loadData();
      
      // 선택 상태 초기화
      if (type === 'channel') {
        setSelectedChannels(prev => prev.filter(cId => cId !== id));
      } else {
        setSelectedVideos(prev => prev.filter(vId => vId !== id));
      }

    } catch (error) {
      console.error('삭제 오류:', error);
      alert(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async (type: 'channels' | 'videos') => {
    const selectedIds = type === 'channels' ? selectedChannels : selectedVideos;
    
    if (selectedIds.length === 0) {
      alert('삭제할 항목을 선택해주세요');
      return;
    }

    if (!confirm(`선택한 ${selectedIds.length}개의 ${type === 'channels' ? '채널' : '비디오'}을 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/data-management/delete?type=bulk&itemType=${type}&ids=${selectedIds.join(',')}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '일괄 삭제에 실패했습니다');
      }

      const result = await response.json();
      alert(result.message);
      
      // 데이터 새로고침
      await loadData();
      
      // 선택 상태 초기화
      if (type === 'channels') {
        setSelectedChannels([]);
      } else {
        setSelectedVideos([]);
      }

    } catch (error) {
      console.error('일괄 삭제 오류:', error);
      alert(error instanceof Error ? error.message : '일괄 삭제 중 오류가 발생했습니다');
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAllChannels = (checked: boolean) => {
    if (checked) {
      setSelectedChannels(channels.map(c => c.id));
    } else {
      setSelectedChannels([]);
    }
  };

  const handleSelectAllVideos = (checked: boolean) => {
    if (checked) {
      setSelectedVideos(videos.map(v => v.id));
    } else {
      setSelectedVideos([]);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCcw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">데이터 관리</h1>
            <p className="text-gray-600 mt-2">저장된 YouTube 데이터를 관리하고 정리하세요</p>
          </div>
          
          <Button
            onClick={loadData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-1000">
            <TabsTrigger value="dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              대시보드
            </TabsTrigger>
            <TabsTrigger value="channels">
              <Database className="h-4 w-4 mr-2" />
              채널 관리 ({channels.length})
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Youtube className="h-4 w-4 mr-2" />
              비디오 관리 ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="cleanup">
              <Settings className="h-4 w-4 mr-2" />
              자동 정리 설정
            </TabsTrigger>
            <TabsTrigger value="backup">
              <Archive className="h-4 w-4 mr-2" />
              백업/복원
            </TabsTrigger>
          </TabsList>

          {/* 대시보드 탭 */}
          <TabsContent value="dashboard" className="space-y-6">
            <DataManagementDashboard />
          </TabsContent>

          {/* 채널 관리 탭 */}
          <TabsContent value="channels" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    저장된 채널 ({channels.length}개)
                  </CardTitle>
                  <div className="flex items-center space-x-4">
                    {selectedChannels.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {selectedChannels.length}개 선택됨
                        </Badge>
                        <Button
                          onClick={() => handleBulkDelete('channels')}
                          disabled={deleting}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          선택 항목 삭제
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedChannels.length === channels.length && channels.length > 0}
                        onCheckedChange={handleSelectAllChannels}
                      />
                      <span className="text-sm text-gray-600">전체 선택</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {channels.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">저장된 채널이 없습니다</p>
                    <Button
                      onClick={() => router.push('/dashboard')}
                      className="mt-4"
                      variant="outline"
                    >
                      YouTube 검색하러 가기
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {channels.map((channel) => (
                      <Card key={channel.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedChannels.includes(channel.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedChannels(prev => [...prev, channel.id]);
                                  } else {
                                    setSelectedChannels(prev => prev.filter(id => id !== channel.id));
                                  }
                                }}
                              />
                              {channel.thumbnailUrl && (
                                <img
                                  src={channel.thumbnailUrl}
                                  alt={channel.title}
                                  className="w-10 h-10 rounded-full"
                                />
                              )}
                            </div>
                            <Button
                              onClick={() => handleDeleteItem('channel', channel.id)}
                              disabled={deleting}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                            {channel.title}
                          </h3>
                          
                          <div className="space-y-1 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              구독자 {channel.subscriberCount?.toLocaleString() || 0}
                            </div>
                            <div className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              조회수 {channel.viewCount?.toLocaleString() || 0}
                            </div>
                            <div className="flex items-center">
                              <Youtube className="h-3 w-3 mr-1" />
                              비디오 {channel._count?.videos || 0}개
                            </div>
                            <div>
                              저장일: {new Date(channel.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 비디오 관리 탭 */}
          <TabsContent value="videos" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Youtube className="h-5 w-5 mr-2" />
                    저장된 비디오 ({videos.length}개)
                  </CardTitle>
                  <div className="flex items-center space-x-4">
                    {selectedVideos.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {selectedVideos.length}개 선택됨
                        </Badge>
                        <Button
                          onClick={() => handleBulkDelete('videos')}
                          disabled={deleting}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          선택 항목 삭제
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedVideos.length === videos.length && videos.length > 0}
                        onCheckedChange={handleSelectAllVideos}
                      />
                      <span className="text-sm text-gray-600">전체 선택</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {videos.length === 0 ? (
                  <div className="text-center py-8">
                    <Youtube className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">저장된 비디오가 없습니다</p>
                    <Button
                      onClick={() => router.push('/dashboard')}
                      className="mt-4"
                      variant="outline"
                    >
                      YouTube 검색하러 가기
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {videos.map((video) => (
                      <Card key={video.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={selectedVideos.includes(video.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedVideos(prev => [...prev, video.id]);
                                  } else {
                                    setSelectedVideos(prev => prev.filter(id => id !== video.id));
                                  }
                                }}
                              />
                              {video.thumbnailUrl && (
                                <img
                                  src={video.thumbnailUrl}
                                  alt={video.title}
                                  className="w-16 h-12 rounded object-cover"
                                />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm line-clamp-2 mb-2">
                                {video.title}
                              </h3>
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                                <span>채널: {video.channel?.title}</span>
                                <div className="flex items-center">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {video.viewCount?.toLocaleString() || 0}
                                </div>
                                <div className="flex items-center">
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                  {video.likeCount?.toLocaleString() || 0}
                                </div>
                                <div className="flex items-center">
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  {video.commentCount?.toLocaleString() || 0}
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-400">
                                저장일: {new Date(video.createdAt).toLocaleDateString()}
                                {video.publishedAt && (
                                  <span className="ml-2">
                                    • 게시일: {new Date(video.publishedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              onClick={() => handleDeleteItem('video', video.id)}
                              disabled={deleting}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 자동 정리 설정 탭 */}
          <TabsContent value="cleanup" className="space-y-6">
            <CleanupSettings />
          </TabsContent>

          {/* 백업/복원 탭 */}
          <TabsContent value="backup" className="space-y-6">
            <BackupRestore />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 