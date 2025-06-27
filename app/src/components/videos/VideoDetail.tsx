'use client';

import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface VideoDetailProps {
  video: {
    id: string;
    youtubeId: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    publishedAt: Date | null;
    duration: string | null;
    categoryId: string | null;
    tags: string | null;
    viewCount: number | null;
    likeCount: number | null;
    commentCount: number | null;
    privacyStatus: string | null;
    uploadStatus: string | null;
    channel: {
      id: string;
      title: string;
      thumbnailUrl: string | null;
      subscriberCount: number | null;
    };
  };
}

export function VideoDetail({ video }: VideoDetailProps) {
  const formatDuration = (duration: string | null) => {
    if (!duration) return '';
    
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

  const parseTags = (tagsString: string | null) => {
    if (!tagsString) return [];
    try {
      return JSON.parse(tagsString);
    } catch {
      return [];
    }
  };

  const tags = parseTags(video.tags);

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 썸네일 및 기본 정보 */}
        <div>
          <div className="relative aspect-video mb-4">
            {video.thumbnailUrl ? (
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                className="object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            
            {/* 재생시간 */}
            {video.duration && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </div>
            )}
          </div>

          {/* 채널 정보 */}
          <div className="flex items-center space-x-3 mb-4">
            {video.channel.thumbnailUrl ? (
              <Image
                src={video.channel.thumbnailUrl}
                alt={video.channel.title}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            )}
            <div>
              <div className="font-medium">{video.channel.title}</div>
              <div className="text-sm text-gray-500">
                구독자 {(video.channel.subscriberCount || 0).toLocaleString()}명
              </div>
            </div>
          </div>
        </div>

        {/* 상세 정보 */}
        <div>
          <h1 className="text-xl font-bold mb-4">{video.title}</h1>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">게시일</span>
              <span>
                {video.publishedAt 
                  ? formatDistanceToNow(new Date(video.publishedAt), {
                      addSuffix: true,
                      locale: ko
                    })
                  : '알 수 없음'
                }
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">공개 상태</span>
              <span className={`px-2 py-1 rounded text-xs ${
                video.privacyStatus === 'public' 
                  ? 'bg-green-100 text-green-800'
                  : video.privacyStatus === 'unlisted'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {video.privacyStatus === 'public' ? '공개' : 
                 video.privacyStatus === 'unlisted' ? '목록에 없음' : '비공개'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">업로드 상태</span>
              <span className="text-sm">{video.uploadStatus || '알 수 없음'}</span>
            </div>

            {video.categoryId && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">카테고리 ID</span>
                <span className="text-sm">{video.categoryId}</span>
              </div>
            )}
          </div>

          {/* 태그 */}
          {tags.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-600 mb-2">태그</h3>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 설명 */}
          {video.description && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-600 mb-2">설명</h3>
              <div className="text-sm text-gray-700 max-h-40 overflow-y-auto">
                {video.description.split('\n').map((line, index) => (
                  <p key={index} className="mb-1">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 