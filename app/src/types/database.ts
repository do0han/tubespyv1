import type { User, Channel, Video, Account, Session } from '../generated/prisma'

// 기본 모델 타입들을 재export
export type { User, Channel, Video, Account, Session }

// 확장된 타입들
export type UserWithChannels = User & {
  channels: (Channel & {
    _count: {
      videos: number
    }
  })[]
}

export type ChannelWithVideos = Channel & {
  videos: Video[]
  _count: {
    videos: number
  }
}

export type VideoWithChannel = Video & {
  channel: Channel
}

export type ChannelStats = {
  totalVideos: number
  totalViews: number
  totalLikes: number
  totalComments: number
  averageViewsPerVideo: number
}

export type PerformanceTrend = {
  publishedAt: Date | null
  viewCount: number | null
  likeCount: number | null
  commentCount: number | null
  title: string
}

// YouTube API 응답 타입들
export type YouTubeChannelData = {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
    }
    customUrl?: string
    publishedAt: string
    country?: string
    defaultLanguage?: string
  }
  statistics: {
    subscriberCount: string
    viewCount: string
    videoCount: string
  }
}

export type YouTubeVideoData = {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
    }
    publishedAt: string
    categoryId: string
    tags?: string[]
  }
  contentDetails: {
    duration: string
  }
  statistics: {
    viewCount: string
    likeCount?: string
    commentCount?: string
  }
  status: {
    privacyStatus: string
    uploadStatus: string
  }
}

// API 요청/응답 타입들
export type ChannelSyncRequest = {
  channelId: string
  forceSync?: boolean
}

export type VideoSyncRequest = {
  channelId: string
  maxResults?: number
  forceSync?: boolean
}

export type DashboardData = {
  user: UserWithChannels
  selectedChannel?: ChannelWithVideos
  channelStats?: ChannelStats
  recentVideos?: Video[]
  performanceTrend?: PerformanceTrend[]
} 