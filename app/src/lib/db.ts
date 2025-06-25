import { prisma } from './prisma'

// User 관련 함수들
export const userService = {
  // 사용자 생성 또는 조회
  async findOrCreateUser(email: string, name?: string, image?: string, googleId?: string) {
    return await prisma.user.upsert({
      where: { email },
      update: {
        name: name || undefined,
        image: image || undefined,
        googleId: googleId || undefined,
      },
      create: {
        email,
        name,
        image,
        googleId,
      },
    })
  },

  // 사용자 조회 (채널 포함)
  async getUserWithChannels(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        channels: {
          include: {
            _count: {
              select: { videos: true }
            }
          }
        }
      }
    })
  }
}

// Channel 관련 함수들
export const channelService = {
  // 채널 생성 또는 업데이트
  async upsertChannel(userId: string, channelData: {
    youtubeId: string
    title: string
    description?: string
    thumbnailUrl?: string
    customUrl?: string
    subscriberCount?: number
    viewCount?: number
    videoCount?: number
    publishedAt?: Date
    country?: string
    language?: string
  }) {
    return await prisma.channel.upsert({
      where: { youtubeId: channelData.youtubeId },
      update: {
        ...channelData,
        lastSyncAt: new Date(),
      },
      create: {
        ...channelData,
        userId,
        lastSyncAt: new Date(),
      },
    })
  },

  // 사용자의 채널 목록 조회
  async getUserChannels(userId: string) {
    return await prisma.channel.findMany({
      where: { userId },
      include: {
        _count: {
          select: { videos: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  // 채널 상세 정보 조회 (최근 비디오 포함)
  async getChannelWithVideos(channelId: string, limit = 10) {
    return await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        videos: {
          orderBy: { publishedAt: 'desc' },
          take: limit
        },
        _count: {
          select: { videos: true }
        }
      }
    })
  }
}

// Video 관련 함수들
export const videoService = {
  // 비디오 생성 또는 업데이트
  async upsertVideo(channelId: string, videoData: {
    youtubeId: string
    title: string
    description?: string
    thumbnailUrl?: string
    publishedAt?: Date
    duration?: string
    categoryId?: string
    tags?: string[]
    viewCount?: number
    likeCount?: number
    commentCount?: number
    privacyStatus?: string
    uploadStatus?: string
  }) {
    return await prisma.video.upsert({
      where: { youtubeId: videoData.youtubeId },
      update: {
        ...videoData,
        lastSyncAt: new Date(),
      },
      create: {
        ...videoData,
        channelId,
        lastSyncAt: new Date(),
      },
    })
  },

  // 채널의 비디오 목록 조회
  async getChannelVideos(channelId: string, limit = 50, offset = 0) {
    return await prisma.video.findMany({
      where: { channelId },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        channel: {
          select: {
            title: true,
            thumbnailUrl: true
          }
        }
      }
    })
  },

  // 비디오 상세 정보 조회
  async getVideoById(videoId: string) {
    return await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        channel: true
      }
    })
  },

  // 최고 성과 비디오들 조회
  async getTopPerformingVideos(channelId: string, limit = 10) {
    return await prisma.video.findMany({
      where: { channelId },
      orderBy: { viewCount: 'desc' },
      take: limit
    })
  }
}

// 통계 관련 함수들
export const statsService = {
  // 채널 통계 요약
  async getChannelStats(channelId: string) {
    const [totalVideos, totalViews, totalLikes, totalComments] = await Promise.all([
      prisma.video.count({ where: { channelId } }),
      prisma.video.aggregate({
        where: { channelId },
        _sum: { viewCount: true }
      }),
      prisma.video.aggregate({
        where: { channelId },
        _sum: { likeCount: true }
      }),
      prisma.video.aggregate({
        where: { channelId },
        _sum: { commentCount: true }
      })
    ])

    return {
      totalVideos,
      totalViews: totalViews._sum.viewCount || 0,
      totalLikes: totalLikes._sum.likeCount || 0,
      totalComments: totalComments._sum.commentCount || 0,
      averageViewsPerVideo: totalVideos > 0 ? Math.round((totalViews._sum.viewCount || 0) / totalVideos) : 0
    }
  },

  // 최근 성과 트렌드 (지난 30일)
  async getRecentPerformanceTrend(channelId: string, days = 30) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    return await prisma.video.findMany({
      where: {
        channelId,
        publishedAt: {
          gte: since
        }
      },
      select: {
        publishedAt: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        title: true
      },
      orderBy: { publishedAt: 'desc' }
    })
  }
} 