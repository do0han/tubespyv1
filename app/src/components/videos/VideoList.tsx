'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
  duration: string | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  privacyStatus: string | null;
  channel: {
    title: string;
    thumbnailUrl: string | null;
  };
}

interface VideoListProps {
  videos: Video[];
}

export function VideoList({ videos }: VideoListProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">비디오가 없습니다.</p>
      </div>
    );
  }

  const formatDuration = (duration: string | null) => {
    if (!duration) return '';
    
    // ISO 8601 duration format (PT4M13S) to readable format
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const formatNumber = (num: number | null) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/dashboard/videos/${video.id}`}
          className="group bg-white rounded-lg shadow border hover:shadow-md transition-shadow"
        >
          {/* 썸네일 */}
          <div className="relative aspect-video">
            {video.thumbnailUrl ? (
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                className="object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-t-lg flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            
            {/* 재생시간 */}
            {video.duration && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </div>
            )}
            
            {/* 프라이버시 상태 */}
            {video.privacyStatus !== 'public' && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                {video.privacyStatus}
              </div>
            )}
          </div>

          {/* 비디오 정보 */}
          <div className="p-4">
            <h3 className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-2">
              {video.title}
            </h3>
            
            <div className="text-sm text-gray-500 mb-3">
              {video.channel.title}
            </div>

            {/* 통계 */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>👁 {formatNumber(video.viewCount)}</span>
                <span>👍 {formatNumber(video.likeCount)}</span>
                <span>💬 {formatNumber(video.commentCount)}</span>
              </div>
              
              {video.publishedAt && (
                <span className="text-xs">
                  {formatDistanceToNow(new Date(video.publishedAt), {
                    addSuffix: true,
                    locale: ko
                  })}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 