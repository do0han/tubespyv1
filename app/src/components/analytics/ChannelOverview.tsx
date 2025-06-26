'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { 
  Calendar, 
  Globe, 
  ExternalLink,
  Clock
} from 'lucide-react';

interface ChannelData {
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
    engagementRate: number;
    recentVideosCount: number;
    highPerformingVideosCount: number;
  };
}

interface ChannelOverviewProps {
  channel: ChannelData;
  className?: string;
}

const ChannelOverview: React.FC<ChannelOverviewProps> = ({
  channel,
  className = ''
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '알 수 없음';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const getChannelUrl = () => {
    if (channel.customUrl) {
      return `https://youtube.com/${channel.customUrl}`;
    }
    return `https://youtube.com/channel/${channel.youtubeId}`;
  };

  const getLanguageText = (lang?: string) => {
    const languages: Record<string, string> = {
      'ko': '한국어',
      'en': '영어',
      'ja': '일본어',
      'zh': '중국어',
      'es': '스페인어',
      'fr': '프랑스어',
      'de': '독일어'
    };
    return languages[lang || ''] || lang || '알 수 없음';
  };

  const getCountryText = (country?: string) => {
    const countries: Record<string, string> = {
      'KR': '대한민국',
      'US': '미국',
      'JP': '일본',
      'CN': '중국',
      'GB': '영국',
      'DE': '독일',
      'FR': '프랑스'
    };
    return countries[country || ''] || country || '알 수 없음';
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>채널 개요</span>
          <a
            href={getChannelUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 채널 기본 정보 */}
        <div className="flex items-start space-x-4">
          <div className="relative">
            {channel.thumbnailUrl ? (
              <img
                src={channel.thumbnailUrl}
                alt={channel.title}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-lg font-semibold">
                  {channel.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 truncate">
              {channel.title}
            </h3>
            {channel.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {channel.description}
              </p>
            )}
            
            {/* 통계 배지들 */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">
                구독자 {formatNumber(channel.subscriberCount)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                총 조회수 {formatNumber(channel.viewCount)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                동영상 {formatNumber(channel.videoCount)}개
              </Badge>
              <Badge 
                variant={channel.analytics.engagementRate > 3 ? "default" : "outline"} 
                className="text-xs"
              >
                참여율 {channel.analytics.engagementRate.toFixed(2)}%
              </Badge>
            </div>
          </div>
        </div>

        {/* 채널 메타데이터 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>개설일: {formatDate(channel.publishedAt)}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Globe className="h-4 w-4 mr-2" />
              <span>국가: {getCountryText(channel.country)}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Globe className="h-4 w-4 mr-2" />
              <span>언어: {getLanguageText(channel.language)}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>마지막 동기화: {formatDate(channel.lastSyncAt)}</span>
            </div>
          </div>
        </div>

        {/* 성과 요약 */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-3">성과 요약</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {channel.analytics.totalVideos}
              </div>
              <div className="text-xs text-gray-500">분석된 동영상</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {channel.analytics.recentVideosCount}
              </div>
              <div className="text-xs text-gray-500">최근 30일 업로드</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {channel.analytics.highPerformingVideosCount}
              </div>
              <div className="text-xs text-gray-500">고성과 동영상</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelOverview; 