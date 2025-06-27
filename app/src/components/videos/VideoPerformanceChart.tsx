'use client';

import MultiBarChart from '@/components/charts/MultiBarChart';
import BarChart from '@/components/charts/BarChart';

interface VideoPerformanceChartProps {
  video: {
    title: string;
    viewCount: number | null;
    likeCount: number | null;
    commentCount: number | null;
  };
  channelAverage: {
    viewCount: number | null | undefined;
    likeCount: number | null | undefined;
    commentCount: number | null | undefined;
  } | null;
}

export function VideoPerformanceChart({ video, channelAverage }: VideoPerformanceChartProps) {
  if (!channelAverage) {
    return (
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-bold mb-4">성능 비교 차트</h3>
        <div className="text-center py-8 text-gray-500">
          비교할 데이터가 충분하지 않습니다.
        </div>
      </div>
    );
  }

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return 0;
    return num;
  };

  // 차트 데이터 준비
  const performanceData = [
    {
      name: '조회수',
      '현재 비디오': formatNumber(video.viewCount),
      '채널 평균': formatNumber(channelAverage.viewCount),
    },
    {
      name: '좋아요',
      '현재 비디오': formatNumber(video.likeCount),
      '채널 평균': formatNumber(channelAverage.likeCount),
    },
    {
      name: '댓글수',
      '현재 비디오': formatNumber(video.commentCount),
      '채널 평균': formatNumber(channelAverage.commentCount),
    },
  ];

  // 비율 데이터 (더 명확한 비교를 위해)
  const ratioData = [
    {
      name: '조회수 비율',
      value: channelAverage.viewCount 
        ? Math.round((formatNumber(video.viewCount) / formatNumber(channelAverage.viewCount)) * 100)
        : 0,
    },
    {
      name: '좋아요 비율',
      value: channelAverage.likeCount 
        ? Math.round((formatNumber(video.likeCount) / formatNumber(channelAverage.likeCount)) * 100)
        : 0,
    },
    {
      name: '댓글 비율',
      value: channelAverage.commentCount 
        ? Math.round((formatNumber(video.commentCount) / formatNumber(channelAverage.commentCount)) * 100)
        : 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 절대값 비교 */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-bold mb-4">성능 비교 (절대값)</h3>
        <div className="h-80">
          <MultiBarChart
            data={performanceData}
            dataKeys={['현재 비디오', '채널 평균']}
            colors={['#3B82F6', '#EF4444']}
            height={300}
            layout="horizontal"
          />
        </div>
      </div>

      {/* 비율 비교 */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-bold mb-4">
          성능 비율 (채널 평균 대비 %)
          <span className="text-sm font-normal text-gray-500 ml-2">
            100% = 채널 평균과 동일
          </span>
        </h3>
        <div className="h-80">
          <BarChart
            data={ratioData}
            dataKey="value"
            color="#10B981"
            height={300}
            xAxisKey="name"
            layout="horizontal"
          />
        </div>
        
        {/* 비율 설명 */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          {ratioData.map((item, index) => (
            <div key={index} className="text-center">
              <div className={`text-lg font-bold ${
                item.value >= 150 ? 'text-green-600' :
                item.value >= 120 ? 'text-blue-600' :
                item.value >= 80 ? 'text-gray-600' : 'text-red-600'
              }`}>
                {item.value}%
              </div>
              <div className="text-gray-600">{item.name}</div>
              <div className={`text-xs ${
                item.value >= 150 ? 'text-green-600' :
                item.value >= 120 ? 'text-blue-600' :
                item.value >= 80 ? 'text-gray-600' : 'text-red-600'
              }`}>
                {item.value >= 150 ? '우수' :
                 item.value >= 120 ? '양호' :
                 item.value >= 80 ? '평균' : '개선필요'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 