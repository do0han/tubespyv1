import { google } from 'googleapis';
import { Session } from 'next-auth';

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  publishedAt: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

export async function getYouTubeClient(session: Session) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: session.accessToken
  });

  return google.youtube({
    version: 'v3',
    auth: oauth2Client
  });
}

export async function getMyChannels(session: Session): Promise<YouTubeChannel[]> {
  try {
    const youtube = await getYouTubeClient(session);
    const response = await youtube.channels.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      mine: true
    });

    return response.data.items?.map(channel => ({
      id: channel.id!,
      title: channel.snippet?.title!,
      description: channel.snippet?.description!,
      thumbnails: channel.snippet?.thumbnails!,
      publishedAt: channel.snippet?.publishedAt!,
      subscriberCount: channel.statistics?.subscriberCount!,
      videoCount: channel.statistics?.videoCount!,
      viewCount: channel.statistics?.viewCount!,
    })) || [];
  } catch (error) {
    console.error('YouTube API에서 채널 정보 가져오기 실패:', error);
    throw error;
  }
}

export async function getChannelById(channelId: string): Promise<YouTubeChannel | null> {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });

    const response = await youtube.channels.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [channelId]
    });

    const channel = response.data.items?.[0];
    if (!channel) return null;

    return {
      id: channel.id!,
      title: channel.snippet?.title!,
      description: channel.snippet?.description!,
      thumbnails: channel.snippet?.thumbnails!,
      publishedAt: channel.snippet?.publishedAt!,
      subscriberCount: channel.statistics?.subscriberCount!,
      videoCount: channel.statistics?.videoCount!,
      viewCount: channel.statistics?.viewCount!,
    };
  } catch (error) {
    console.error('YouTube API에서 채널 정보 가져오기 실패:', error);
    throw error;
  }
}

export async function getChannelVideos(
  session: Session, 
  channelId: string, 
  maxResults: number = 50
): Promise<YouTubeVideo[]> {
  try {
    const youtube = await getYouTubeClient(session);
    
    // 업로드 플레이리스트 ID 가져오기
    const channelResponse = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId]
    });
    
    const uploadsPlaylistId = channelResponse.data.items?.[0].contentDetails?.relatedPlaylists?.uploads;
    
    if (!uploadsPlaylistId) {
      throw new Error('업로드 플레이리스트를 찾을 수 없습니다');
    }

    // 플레이리스트에서 비디오 목록 가져오기
    const videosResponse = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults
    });
    
    // 비디오 ID 수집
    const videoIds = videosResponse.data.items?.map(item => item.contentDetails?.videoId).filter(Boolean) || [];
    
    if (videoIds.length === 0) return [];

    // 비디오 통계 가져오기
    const videoStatsResponse = await youtube.videos.list({
      part: ['statistics', 'contentDetails'],
      id: videoIds as string[]
    });
    
    // 데이터 결합
    return videosResponse.data.items?.map(video => {
      const stats = videoStatsResponse.data.items?.find(
        stat => stat.id === video.contentDetails?.videoId
      );
      
      return {
        id: video.contentDetails?.videoId!,
        title: video.snippet?.title!,
        description: video.snippet?.description!,
        thumbnails: video.snippet?.thumbnails!,
        publishedAt: video.snippet?.publishedAt!,
        duration: stats?.contentDetails?.duration!,
        viewCount: stats?.statistics?.viewCount || '0',
        likeCount: stats?.statistics?.likeCount || '0',
        commentCount: stats?.statistics?.commentCount || '0',
      };
    }).filter(Boolean) || [];
  } catch (error) {
    console.error('YouTube API에서 비디오 정보 가져오기 실패:', error);
    throw error;
  }
}

export async function getVideosByIds(videoIds: string[]): Promise<YouTubeVideo[]> {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });

    const response = await youtube.videos.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      id: videoIds
    });

    return response.data.items?.map(video => ({
      id: video.id!,
      title: video.snippet?.title!,
      description: video.snippet?.description!,
      thumbnails: video.snippet?.thumbnails!,
      publishedAt: video.snippet?.publishedAt!,
      duration: video.contentDetails?.duration!,
      viewCount: video.statistics?.viewCount || '0',
      likeCount: video.statistics?.likeCount || '0',
      commentCount: video.statistics?.commentCount || '0',
    })) || [];
  } catch (error) {
    console.error('YouTube API에서 비디오 정보 가져오기 실패:', error);
    throw error;
  }
}

export async function searchChannels(query: string, maxResults: number = 10): Promise<YouTubeChannel[]> {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });

    const searchResponse = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['channel'],
      maxResults
    });

    const channelIds = searchResponse.data.items?.map(item => item.id?.channelId).filter(Boolean) || [];
    
    if (channelIds.length === 0) return [];

    const channelsResponse = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      id: channelIds as string[]
    });

    return channelsResponse.data.items?.map(channel => ({
      id: channel.id!,
      title: channel.snippet?.title!,
      description: channel.snippet?.description!,
      thumbnails: channel.snippet?.thumbnails!,
      publishedAt: channel.snippet?.publishedAt!,
      subscriberCount: channel.statistics?.subscriberCount!,
      videoCount: channel.statistics?.videoCount!,
      viewCount: channel.statistics?.viewCount!,
    })) || [];
  } catch (error) {
    console.error('YouTube API에서 채널 검색 실패:', error);
    throw error;
  }
}

// 유틸리티 함수들
export function formatNumber(num: string | number): string {
  const n = typeof num === 'string' ? parseInt(num) : num;
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M';
  } else if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'K';
  }
  return n.toString();
}

export function formatDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function parseChannelUrl(url: string): string | null {
  // https://www.youtube.com/@channelname
  // https://www.youtube.com/channel/UCxxxxxx
  // https://www.youtube.com/user/username
  
  const patterns = [
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  // 직접 채널 ID나 핸들명이 입력된 경우
  if (url.startsWith('UC') && url.length === 24) return url;
  if (url.startsWith('@')) return url.substring(1);
  
  return null;
} 