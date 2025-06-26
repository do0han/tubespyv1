import { prisma } from './prisma';
import { youtube_v3 } from 'googleapis';
import { Session } from 'next-auth';

export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface ChannelSyncData {
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  customUrl?: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  publishedAt?: Date;
  country?: string;
  language?: string;
}

export interface VideoSyncData {
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt?: Date;
  duration?: string;
  categoryId?: string;
  tags?: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  privacyStatus?: string;
  uploadStatus?: string;
}

/**
 * 검색 결과의 채널 데이터를 데이터베이스에 동기화
 */
export async function syncSearchChannelData(
  userId: string,
  channelData: any
): Promise<SyncResult> {
  try {
    console.log(`🔄 채널 동기화 시작: ${channelData.title}`);

    const syncData: ChannelSyncData = {
      youtubeId: channelData.id,
      title: channelData.title || '',
      description: channelData.description || null,
      thumbnailUrl: channelData.thumbnails?.high?.url || channelData.thumbnails?.default?.url || null,
      customUrl: channelData.customUrl || null,
      subscriberCount: parseInt(channelData.subscriberCount?.toString() || '0'),
      viewCount: parseInt(channelData.viewCount?.toString() || '0'),
      videoCount: parseInt(channelData.videoCount?.toString() || '0'),
      publishedAt: channelData.publishedAt ? new Date(channelData.publishedAt) : undefined,
      country: channelData.country || null,
      language: channelData.language || 'ko'
    };

    const channel = await prisma.channel.upsert({
      where: { 
        youtubeId_userId: {
          youtubeId: syncData.youtubeId,
          userId: userId
        }
      },
      update: {
        title: syncData.title,
        description: syncData.description,
        thumbnailUrl: syncData.thumbnailUrl,
        customUrl: syncData.customUrl,
        subscriberCount: syncData.subscriberCount,
        viewCount: syncData.viewCount,
        videoCount: syncData.videoCount,
        publishedAt: syncData.publishedAt || undefined,
        country: syncData.country,
        language: syncData.language,
        lastSyncAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        youtubeId: syncData.youtubeId,
        title: syncData.title,
        description: syncData.description,
        thumbnailUrl: syncData.thumbnailUrl,
        customUrl: syncData.customUrl,
        subscriberCount: syncData.subscriberCount,
        viewCount: syncData.viewCount,
        videoCount: syncData.videoCount,
        publishedAt: syncData.publishedAt || undefined,
        country: syncData.country,
        language: syncData.language,
        lastSyncAt: new Date(),
        userId: userId
      }
    });

    console.log(`✅ 채널 동기화 완료: ${channel.title} (ID: ${channel.id})`);

    return {
      success: true,
      message: `채널 "${channel.title}" 동기화 완료`,
      data: channel
    };

  } catch (error) {
    console.error('❌ 채널 동기화 실패:', error);
    return {
      success: false,
      message: '채널 동기화 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 검색 결과의 비디오 데이터를 데이터베이스에 동기화
 */
export async function syncSearchVideoData(
  userId: string,
  videoData: any,
  channelId?: string
): Promise<SyncResult> {
  try {
    console.log(`🔄 비디오 동기화 시작: ${videoData.title || videoData.snippet?.title || '제목 없음'}`);

    // 채널이 먼저 동기화되어 있는지 확인
    let dbChannel;
    const channelYouTubeId = videoData.channelId || videoData.snippet?.channelId;
    const channelTitle = videoData.channelTitle || videoData.snippet?.channelTitle;
    
    if (!channelYouTubeId) {
      throw new Error('채널 ID가 없습니다');
    }

    if (channelId) {
      dbChannel = await prisma.channel.findUnique({
        where: { id: channelId }
      });
      if (!dbChannel) {
        throw new Error(`채널 ID ${channelId}를 찾을 수 없습니다`);
      }
    } else {
      // 채널 정보가 없으면 채널을 먼저 생성하거나 찾기
      dbChannel = await prisma.channel.upsert({
        where: { 
          youtubeId_userId: {
            youtubeId: channelYouTubeId,
            userId: userId
          }
        },
        update: {
          title: channelTitle || '알 수 없는 채널',
          subscriberCount: videoData.rawSubscriberCount || 0,
          videoCount: videoData.rawTotalVideos || 0,
          lastSyncAt: new Date()
        },
        create: {
          youtubeId: channelYouTubeId,
          title: channelTitle || '알 수 없는 채널',
          subscriberCount: videoData.rawSubscriberCount || 0,
          videoCount: videoData.rawTotalVideos || 0,
          userId: userId,
          lastSyncAt: new Date()
        }
      });
    }

    // 비디오 데이터 준비 (snippet이 있는 경우와 없는 경우 모두 처리)
    const videoId = videoData.id || videoData.id?.videoId;
    const title = videoData.title || videoData.snippet?.title || '';
    const description = videoData.description || videoData.snippet?.description || null;
    const thumbnailUrl = videoData.thumbnails?.high?.url || 
                        videoData.snippet?.thumbnails?.high?.url || 
                        videoData.snippet?.thumbnails?.default?.url || null;
    const publishedAt = videoData.publishedAt || videoData.snippet?.publishedAt;

    if (!videoId) {
      throw new Error('비디오 ID가 없습니다');
    }

    const syncData: VideoSyncData = {
      youtubeId: videoId,
      title: title,
      description: description,
      thumbnailUrl: thumbnailUrl,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      duration: videoData.duration || null,
      categoryId: videoData.categoryId || null,
      tags: videoData.tags || [],
      viewCount: parseInt(videoData.viewCount?.toString() || '0'),
      likeCount: parseInt(videoData.likeCount?.toString() || '0'),
      commentCount: parseInt(videoData.commentCount?.toString() || '0'),
      privacyStatus: videoData.privacyStatus || 'public',
      uploadStatus: videoData.uploadStatus || 'processed'
    };

    const video = await prisma.video.upsert({
      where: { 
        youtubeId_userId: {
          youtubeId: syncData.youtubeId,
          userId: userId
        }
      },
      update: {
        title: syncData.title,
        description: syncData.description,
        thumbnailUrl: syncData.thumbnailUrl,
        publishedAt: syncData.publishedAt,
        duration: syncData.duration,
        categoryId: syncData.categoryId,
        tags: JSON.stringify(syncData.tags),
        viewCount: syncData.viewCount,
        likeCount: syncData.likeCount,
        commentCount: syncData.commentCount,
        privacyStatus: syncData.privacyStatus,
        uploadStatus: syncData.uploadStatus,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
        // update에서도 channelId 설정
        channelId: dbChannel.id
      },
      create: {
        youtubeId: syncData.youtubeId,
        title: syncData.title,
        description: syncData.description,
        thumbnailUrl: syncData.thumbnailUrl,
        publishedAt: syncData.publishedAt,
        duration: syncData.duration,
        categoryId: syncData.categoryId,
        tags: JSON.stringify(syncData.tags),
        viewCount: syncData.viewCount,
        likeCount: syncData.likeCount,
        commentCount: syncData.commentCount,
        privacyStatus: syncData.privacyStatus,
        uploadStatus: syncData.uploadStatus,
        lastSyncAt: new Date(),
        channelId: dbChannel.id,
        userId: userId
      }
    });

    console.log(`✅ 비디오 동기화 완료: ${video.title} (ID: ${video.id})`);

    return {
      success: true,
      message: `비디오 "${video.title}" 동기화 완료`,
      data: video
    };

  } catch (error) {
    console.error('❌ 비디오 동기화 실패:', error);
    return {
      success: false,
      message: '비디오 동기화 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 검색 결과 일괄 동기화
 */
export async function syncSearchResults(
  userId: string,
  searchResults: any[],
  searchMode: 'video' | 'channel' = 'video'
): Promise<SyncResult> {
  try {
    console.log(`🔄 일괄 동기화 시작: ${searchResults.length}개 ${searchMode === 'video' ? '비디오' : '채널'}`);
    
    if (!searchResults || searchResults.length === 0) {
      console.log('⚠️ 동기화할 데이터가 없습니다');
      return {
        success: true,
        message: '동기화할 데이터가 없습니다',
        data: {
          results: [],
          errors: [],
          successCount: 0,
          failureCount: 0
        }
      };
    }

    const results: SyncResult[] = [];
    const errors: any[] = [];

    // 순차 처리로 변경 (동시성 문제 방지)
    for (let i = 0; i < searchResults.length; i++) {
      const item = searchResults[i];
      try {
        console.log(`🔄 동기화 진행: ${i + 1}/${searchResults.length}`);
        
        let result: SyncResult;
        if (searchMode === 'video') {
          result = await syncSearchVideoData(userId, item);
        } else {
          result = await syncSearchChannelData(userId, item);
        }

        results.push(result);
        
        if (!result.success) {
          errors.push({
            item: item,
            error: result.error || result.message,
            index: i
          });
        }

      } catch (error) {
        console.error(`❌ 동기화 오류 (${i + 1}/${searchResults.length}):`, error);
        const errorResult: SyncResult = {
          success: false,
          message: `동기화 실패: ${error instanceof Error ? error.message : String(error)}`,
          error: error instanceof Error ? error.message : String(error)
        };
        
        results.push(errorResult);
        errors.push({
          item: item,
          error: error instanceof Error ? error.message : String(error),
          index: i
        });
      }

      // 각 요청 사이에 잠시 대기 (DB 부하 방지)
      if (i < searchResults.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = errors.length;

    console.log(`✅ 일괄 동기화 완료: 성공 ${successCount}개, 실패 ${failureCount}개`);
    
    if (failureCount > 0) {
      console.log('❌ 실패한 항목들:', errors.map(e => e.error).join(', '));
    }

    return {
      success: successCount > 0, // 하나라도 성공하면 성공으로 처리
      message: `동기화 완료: 성공 ${successCount}개, 실패 ${failureCount}개`,
      data: {
        results,
        errors,
        successCount,
        failureCount
      }
    };

  } catch (error) {
    console.error('❌ 일괄 동기화 실패:', error);
    return {
      success: false,
      message: '일괄 동기화 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 사용자별 저장된 채널 목록 조회
 */
export async function getUserChannels(userId: string) {
  try {
    const channels = await prisma.channel.findMany({
      where: { userId },
      include: {
        _count: {
          select: { videos: true }
        }
      },
      orderBy: { lastSyncAt: 'desc' }
    });

    return {
      success: true,
      data: channels
    };
  } catch (error) {
    console.error('❌ 채널 목록 조회 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 사용자별 저장된 비디오 목록 조회
 */
export async function getUserVideos(userId: string, channelId?: string) {
  try {
    const whereClause: any = {
      channel: { userId }
    };

    if (channelId) {
      whereClause.channelId = channelId;
    }

    const videos = await prisma.video.findMany({
      where: whereClause,
      include: {
        channel: {
          select: {
            id: true,
            title: true,
            youtubeId: true
          }
        }
      },
      orderBy: { lastSyncAt: 'desc' }
    });

    return {
      success: true,
      data: videos
    };
  } catch (error) {
    console.error('❌ 비디오 목록 조회 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 