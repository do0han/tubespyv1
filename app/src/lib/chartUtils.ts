// 차트 데이터 변환 유틸리티

interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

interface ChartDataPoint {
  [key: string]: any;
}

/**
 * 시계열 데이터를 차트용으로 변환
 */
export function prepareTimeSeriesData(
  data: any[], 
  valueKey: string, 
  dateKey: string
): TimeSeriesDataPoint[] {
  // 날짜별로 정렬
  const sortedData = [...data].sort((a, b) => {
    return new Date(a[dateKey]).getTime() - new Date(b[dateKey]).getTime();
  });
  
  // 차트용 데이터 포맷
  return sortedData.map(item => ({
    date: new Date(item[dateKey]).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    }),
    value: Number(item[valueKey]) || 0
  }));
}

/**
 * 성장률 계산
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * 기간별 데이터 집계
 */
export function aggregateDataByPeriod(
  data: any[],
  valueKey: string,
  dateKey: string,
  period: 'day' | 'week' | 'month' = 'day'
): TimeSeriesDataPoint[] {
  const aggregated: { [key: string]: number } = {};
  
  data.forEach(item => {
    const date = new Date(item[dateKey]);
    let periodKey: string;
    
    switch (period) {
      case 'day':
        periodKey = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        periodKey = date.toISOString().split('T')[0];
    }
    
    if (!aggregated[periodKey]) {
      aggregated[periodKey] = 0;
    }
    
    aggregated[periodKey] += Number(item[valueKey]) || 0;
  });
  
  return Object.entries(aggregated)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date: formatPeriodLabel(date, period),
      value
    }));
}

/**
 * 기간 라벨 포맷팅
 */
function formatPeriodLabel(dateString: string, period: 'day' | 'week' | 'month'): string {
  const date = new Date(dateString);
  
  switch (period) {
    case 'day':
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    case 'week':
      return `${date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 주`;
    case 'month':
      return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' });
    default:
      return dateString;
  }
}

/**
 * 숫자를 K, M, B 단위로 포맷
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * 퍼센티지를 색상으로 변환 (성과 지표용)
 */
export function getPerformanceColor(percentage: number): string {
  if (percentage >= 80) return '#22c55e'; // green-500
  if (percentage >= 60) return '#84cc16'; // lime-500  
  if (percentage >= 40) return '#eab308'; // yellow-500
  if (percentage >= 20) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

/**
 * 채널 데이터를 차트용으로 변환
 */
export function prepareChannelChartData(channels: any[]): ChartDataPoint[] {
  return channels.map(channel => ({
    name: channel.title.length > 15 ? channel.title.slice(0, 15) + '...' : channel.title,
    subscribers: channel.subscriberCount || 0,
    views: channel.viewCount || 0,
    videos: channel.videoCount || 0,
    engagement: channel.analytics?.engagementRate || 0
  }));
}

/**
 * 비디오 성과 데이터를 차트용으로 변환  
 */
export function prepareVideoPerformanceData(videos: any[]): ChartDataPoint[] {
  return videos.map(video => ({
    title: video.title.length > 20 ? video.title.slice(0, 20) + '...' : video.title,
    views: video.viewCount || 0,
    likes: video.likeCount || 0,
    comments: video.commentCount || 0,
    engagement: ((video.likeCount + video.commentCount) / Math.max(video.viewCount, 1) * 100) || 0,
    publishedAt: video.publishedAt
  }));
}

/**
 * 트렌드 데이터 계산
 */
export function calculateTrend(data: TimeSeriesDataPoint[]): {
  trend: 'up' | 'down' | 'stable';
  percentage: number;
} {
  if (data.length < 2) {
    return { trend: 'stable', percentage: 0 };
  }
  
  const latest = data[data.length - 1].value;
  const previous = data[data.length - 2].value;
  const percentage = calculateGrowthRate(latest, previous);
  
  let trend: 'up' | 'down' | 'stable';
  if (Math.abs(percentage) < 1) {
    trend = 'stable';
  } else if (percentage > 0) {
    trend = 'up';
  } else {
    trend = 'down';
  }
  
  return { trend, percentage: Math.abs(percentage) };
} 