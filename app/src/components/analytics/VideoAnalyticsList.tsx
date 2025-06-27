'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  ThumbsUp, 
  MessageCircle, 
  ExternalLink,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  MoreHorizontal
} from 'lucide-react';

interface VideoData {
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
    subscriberRatio: number;
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

interface VideoAnalyticsListProps {
  videos: VideoData[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

const VideoAnalyticsList: React.FC<VideoAnalyticsListProps> = ({
  videos,
  loading = false,
  onLoadMore,
  hasMore = false,
  className = ''
}) => {
  const [sortBy, setSortBy] = useState<string>('publishedAt');
  const [filterBy, setFilterBy] = useState<string>('all');

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return '알 수 없음';
    
    // PT4M13S 형식을 파싱
    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return duration;
    
    const hours = parseInt(matches[1] || '0');
    const minutes = parseInt(matches[2] || '0');
    const seconds = parseInt(matches[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '알 수 없음';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPerformanceBadge = (grade: string) => {
    const badgeProps = {
      excellent: { variant: 'default' as const, color: 'bg-green-500', text: '최고' },
      high: { variant: 'secondary' as const, color: 'bg-blue-500', text: '높음' },
      medium: { variant: 'outline' as const, color: 'bg-yellow-500', text: '보통' },
      low: { variant: 'outline' as const, color: 'bg-gray-500', text: '낮음' }
    };
    
    const props = badgeProps[grade as keyof typeof badgeProps] || badgeProps.low;
    return (
      <Badge variant={props.variant} className="text-xs">
        {props.text}
      </Badge>
    );
  };

  const getVideoUrl = (youtubeId: string) => {
    return `https://youtube.com/watch?v=${youtubeId}`;
  };

  const filteredVideos = videos.filter(video => {
    if (filterBy === 'all') return true;
    return video.analytics.performanceGrade === filterBy;
  });

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    switch (sortBy) {
      case 'viewCount':
        return b.viewCount - a.viewCount;
      case 'subscriberRatio':
        return b.analytics.subscriberRatio - a.analytics.subscriberRatio;
      case 'likeCount':
        return b.likeCount - a.likeCount;
      case 'commentCount':
        return b.commentCount - a.commentCount;
      case 'engagementRate':
        return b.analytics.engagementRate - a.analytics.engagementRate;
      case 'publishedAt':
      default:
        return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
    }
  });

  if (loading && videos.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">비디오 분석 데이터를 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <CardTitle>비디오 분석</CardTitle>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="성과 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 성과</SelectItem>
                <SelectItem value="excellent">최고 성과</SelectItem>
                <SelectItem value="high">높은 성과</SelectItem>
                <SelectItem value="medium">보통 성과</SelectItem>
                <SelectItem value="low">낮은 성과</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="정렬 기준" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publishedAt">업로드 날짜</SelectItem>
                <SelectItem value="viewCount">조회수</SelectItem>
                <SelectItem value="subscriberRatio">구독자 대비 조회수</SelectItem>
                <SelectItem value="likeCount">좋아요</SelectItem>
                <SelectItem value="commentCount">댓글</SelectItem>
                <SelectItem value="engagementRate">참여율</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {sortedVideos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">표시할 비디오가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedVideos.map((video) => (
              <div
                key={video.id}
                className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* 썸네일 */}
                <div className="flex-shrink-0">
                  <div 
                    className="relative group cursor-pointer" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const url = getVideoUrl(video.youtubeId);
                      console.log('🔍 분석 페이지 썸네일 클릭됨 - ID:', video.youtubeId);
                      console.log('🔗 생성된 URL:', url);
                      console.log('🌐 새 탭으로 열기 시도...');
                      
                                              try {
                          window.open(url, '_blank', 'noopener,noreferrer');
                          console.log('✅ 분석 페이지 썸네일 클릭: YouTube 영상 열기 시도함');
                        } catch (error) {
                          console.error('❌ 새 탭 열기 실패:', error);
                          alert('새 탭 열기에 실패했습니다.');
                        }
                    }}
                  >
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full md:w-40 h-24 object-cover rounded transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full md:w-40 h-24 bg-gray-200 rounded flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                        <span className="text-gray-500 text-xs">썸네일 없음</span>
                      </div>
                    )}
                    
                    {/* 재생 버튼 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black bg-opacity-70 rounded-full p-2">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* 비디오 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      className="text-lg font-medium text-gray-900 line-clamp-2 pr-2 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const url = getVideoUrl(video.youtubeId);
                        console.log('📝 분석 페이지 제목 클릭됨 - ID:', video.youtubeId);
                        console.log('🔗 생성된 URL:', url);
                        
                        try {
                          window.open(url, '_blank', 'noopener,noreferrer');
                          console.log('✅ 분석 페이지 제목 클릭: YouTube 영상 열기 시도함');
                        } catch (error) {
                          console.error('❌ 새 탭 열기 실패:', error);
                          alert('새 탭 열기에 실패했습니다.');
                        }
                      }}
                    >
                      {video.title}
                    </h3>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {getPerformanceBadge(video.analytics.performanceGrade)}
                      <a
                        href={getVideoUrl(video.youtubeId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  
                  {/* 채널 정보 */}
                  <div className="flex items-center space-x-2 mb-3">
                    {video.channel.thumbnailUrl ? (
                      <img
                        src={video.channel.thumbnailUrl}
                        alt={video.channel.title}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                    )}
                    <span className="text-sm text-gray-600">{video.channel.title}</span>
                  </div>
                  
                  {/* 통계 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Eye className="h-4 w-4" />
                      <span>{formatNumber(video.viewCount)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{formatNumber(video.likeCount)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <MessageCircle className="h-4 w-4" />
                      <span>{formatNumber(video.commentCount)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>{video.analytics.engagementRate.toFixed(2)}%</span>
                    </div>
                  </div>
                  
                  {/* 구독자 대비 조회수 비율 */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">구독자 대비 조회수 비율:</span>
                      <span className={`font-medium ${
                        video.analytics.subscriberRatio >= 5 ? 'text-green-600' :
                        video.analytics.subscriberRatio >= 2 ? 'text-blue-600' :
                        video.analytics.subscriberRatio >= 1 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {video.analytics.subscriberRatio.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                  
                  {/* 메타데이터 */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(video.publishedAt)}</span>
                    </div>
                    
                    {video.analytics.uploadedDaysAgo !== null && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{video.analytics.uploadedDaysAgo}일 전</span>
                      </div>
                    )}
                    
                    <div>
                      <span>일일 조회수: {formatNumber(video.analytics.viewsPerDay)}</span>
                    </div>
                  </div>
                  
                  {/* 태그 */}
                  {video.tags.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {video.tags.slice(0, 5).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                        {video.tags.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{video.tags.length - 5}개 더
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* 더 보기 버튼 */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  onClick={onLoadMore}
                  disabled={loading}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full mr-2"></div>
                      불러오는 중...
                    </>
                  ) : (
                    '더 보기'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoAnalyticsList; 