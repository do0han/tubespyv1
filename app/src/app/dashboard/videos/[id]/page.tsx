import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { VideoDetail } from '@/components/videos/VideoDetail';
import { VideoMetrics } from '@/components/videos/VideoMetrics';
import { VideoPerformanceChart } from '@/components/videos/VideoPerformanceChart';
import Link from 'next/link';

interface VideoPageProps {
  params: {
    id: string;
  };
}

export default async function VideoPage({ params }: VideoPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  // 비디오 정보 가져오기
  const video = await prisma.video.findFirst({
    where: {
      id: params.id,
      userId: session.user.id
    },
    include: {
      channel: {
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          subscriberCount: true
        }
      }
    }
  });

  if (!video) {
    notFound();
  }

  // 채널의 다른 비디오들과 비교를 위한 평균 데이터
  const channelStats = await prisma.video.aggregate({
    where: {
      channelId: video.channelId,
      id: { not: video.id } // 현재 비디오 제외
    },
    _avg: {
      viewCount: true,
      likeCount: true,
      commentCount: true
    },
    _count: {
      id: true
    }
  });

  // 같은 기간 비디오들과의 비교 (게시일 기준 ±30일)
  const publishDate = video.publishedAt;
  let similarPeriodStats = null;

  if (publishDate) {
    const startDate = new Date(publishDate);
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date(publishDate);
    endDate.setDate(endDate.getDate() + 30);

    similarPeriodStats = await prisma.video.aggregate({
      where: {
        channelId: video.channelId,
        id: { not: video.id },
        publishedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _avg: {
        viewCount: true,
        likeCount: true,
        commentCount: true
      },
      _count: {
        id: true
      }
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard/videos"
            className="text-blue-600 hover:text-blue-800"
          >
            ← 비디오 목록
          </Link>
          <h1 className="text-2xl font-bold">비디오 상세분석</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <a
            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            YouTube에서 보기
          </a>
        </div>
      </div>

      {/* 비디오 기본 정보 */}
      <VideoDetail video={video} />

      {/* 성능 메트릭 */}
      <VideoMetrics 
        video={video} 
        channelAverage={channelStats._avg}
        similarPeriodAverage={similarPeriodStats?._avg}
        channelVideoCount={channelStats._count.id}
        similarPeriodCount={similarPeriodStats?._count.id || 0}
      />

      {/* 성능 차트 */}
      <VideoPerformanceChart video={video} channelAverage={channelStats._avg} />
    </div>
  );
} 