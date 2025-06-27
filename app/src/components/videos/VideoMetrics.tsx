'use client';

interface VideoMetricsProps {
  video: {
    viewCount: number | null;
    likeCount: number | null;
    commentCount: number | null;
  };
  channelAverage: {
    viewCount: number | null | undefined;
    likeCount: number | null | undefined;
    commentCount: number | null | undefined;
  } | null;
  similarPeriodAverage?: {
    viewCount: number | null | undefined;
    likeCount: number | null | undefined;
    commentCount: number | null | undefined;
  } | null;
  channelVideoCount: number;
  similarPeriodCount: number;
}

export function VideoMetrics({ 
  video, 
  channelAverage, 
  similarPeriodAverage, 
  channelVideoCount,
  similarPeriodCount 
}: VideoMetricsProps) {
  const formatNumber = (num: number | null | undefined) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const calculatePerformance = (current: number | null, average: number | null | undefined) => {
    if (!current || !average) return null;
    
    const ratio = current / average;
    if (ratio >= 1.5) return { status: 'excellent', percentage: ((ratio - 1) * 100).toFixed(0) };
    if (ratio >= 1.2) return { status: 'good', percentage: ((ratio - 1) * 100).toFixed(0) };
    if (ratio >= 0.8) return { status: 'average', percentage: ((1 - ratio) * 100).toFixed(0) };
    return { status: 'below', percentage: ((1 - ratio) * 100).toFixed(0) };
  };

  const getPerformanceColor = (status: string | null) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'average': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'below': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPerformanceIcon = (status: string | null) => {
    switch (status) {
      case 'excellent': return '🚀';
      case 'good': return '✅';
      case 'average': return '📊';
      case 'below': return '📉';
      default: return '❓';
    }
  };

  const viewPerformance = calculatePerformance(video.viewCount, channelAverage?.viewCount);
  const likePerformance = calculatePerformance(video.likeCount, channelAverage?.likeCount);
  const commentPerformance = calculatePerformance(video.commentCount, channelAverage?.commentCount);

  const periodViewPerformance = calculatePerformance(video.viewCount, similarPeriodAverage?.viewCount);
  const periodLikePerformance = calculatePerformance(video.likeCount, similarPeriodAverage?.likeCount);
  const periodCommentPerformance = calculatePerformance(video.commentCount, similarPeriodAverage?.commentCount);

  return (
    <div className="space-y-6">
      {/* 기본 통계 */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-lg font-bold mb-4">성능 지표</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 조회수 */}
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatNumber(video.viewCount)}
            </div>
            <div className="text-sm text-gray-600 mb-2">조회수</div>
            {viewPerformance && (
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded border text-xs ${getPerformanceColor(viewPerformance.status)}`}>
                <span>{getPerformanceIcon(viewPerformance.status)}</span>
                <span>
                  {viewPerformance.status === 'below' ? '-' : '+'}
                  {viewPerformance.percentage}%
                </span>
              </div>
            )}
          </div>

          {/* 좋아요 */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatNumber(video.likeCount)}
            </div>
            <div className="text-sm text-gray-600 mb-2">좋아요</div>
            {likePerformance && (
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded border text-xs ${getPerformanceColor(likePerformance.status)}`}>
                <span>{getPerformanceIcon(likePerformance.status)}</span>
                <span>
                  {likePerformance.status === 'below' ? '-' : '+'}
                  {likePerformance.percentage}%
                </span>
              </div>
            )}
          </div>

          {/* 댓글 */}
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {formatNumber(video.commentCount)}
            </div>
            <div className="text-sm text-gray-600 mb-2">댓글</div>
            {commentPerformance && (
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded border text-xs ${getPerformanceColor(commentPerformance.status)}`}>
                <span>{getPerformanceIcon(commentPerformance.status)}</span>
                <span>
                  {commentPerformance.status === 'below' ? '-' : '+'}
                  {commentPerformance.percentage}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 채널 평균과의 비교 */}
      {channelAverage && channelVideoCount > 0 && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-bold mb-4">
            채널 평균과 비교 
            <span className="text-sm font-normal text-gray-500">
              ({channelVideoCount}개 비디오 기준)
            </span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">조회수 평균</span>
              <span className="font-medium">{formatNumber(channelAverage.viewCount)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">좋아요 평균</span>
              <span className="font-medium">{formatNumber(channelAverage.likeCount)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">댓글 평균</span>
              <span className="font-medium">{formatNumber(channelAverage.commentCount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 동일 기간 비교 */}
      {similarPeriodAverage && similarPeriodCount > 0 && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-bold mb-4">
            동일 기간 비교 
            <span className="text-sm font-normal text-gray-500">
              (±30일, {similarPeriodCount}개 비디오 기준)
            </span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-900 mb-1">
                {formatNumber(similarPeriodAverage.viewCount)}
              </div>
              <div className="text-sm text-gray-600 mb-2">평균 조회수</div>
              {periodViewPerformance && (
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded border text-xs ${getPerformanceColor(periodViewPerformance.status)}`}>
                  <span>{getPerformanceIcon(periodViewPerformance.status)}</span>
                  <span>
                    {periodViewPerformance.status === 'below' ? '-' : '+'}
                    {periodViewPerformance.percentage}%
                  </span>
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="text-lg font-medium text-gray-900 mb-1">
                {formatNumber(similarPeriodAverage.likeCount)}
              </div>
              <div className="text-sm text-gray-600 mb-2">평균 좋아요</div>
              {periodLikePerformance && (
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded border text-xs ${getPerformanceColor(periodLikePerformance.status)}`}>
                  <span>{getPerformanceIcon(periodLikePerformance.status)}</span>
                  <span>
                    {periodLikePerformance.status === 'below' ? '-' : '+'}
                    {periodLikePerformance.percentage}%
                  </span>
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="text-lg font-medium text-gray-900 mb-1">
                {formatNumber(similarPeriodAverage.commentCount)}
              </div>
              <div className="text-sm text-gray-600 mb-2">평균 댓글</div>
              {periodCommentPerformance && (
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded border text-xs ${getPerformanceColor(periodCommentPerformance.status)}`}>
                  <span>{getPerformanceIcon(periodCommentPerformance.status)}</span>
                  <span>
                    {periodCommentPerformance.status === 'below' ? '-' : '+'}
                    {periodCommentPerformance.percentage}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 