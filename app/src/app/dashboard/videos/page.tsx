import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { VideoList } from '@/components/videos/VideoList';
import { VideoFilters } from '@/components/videos/VideoFilters';
import { Pagination } from '@/components/ui/pagination';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ErrorState, EmptyState } from '@/components/ui/error-state';

interface SearchParams {
  sort?: string;
  order?: string;
  page?: string;
  category?: string;
  status?: string;
}

interface VideosPageProps {
  searchParams: SearchParams;
}

export default async function VideosPage({ searchParams }: VideosPageProps) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      redirect('/login');
    }

    const { sort = 'publishedAt', order = 'desc', page = '1', category, status } = searchParams;
    const pageSize = 12;
    const pageNumber = parseInt(page);

    // 사용자의 채널 정보 가져오기
    const channels = await prisma.channel.findMany({
      where: {
        userId: session.user.id
      }
    });

    if (channels.length === 0) {
      return (
        <ErrorBoundary>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Video Analytics</h1>
            <EmptyState
              title="연결된 채널이 없습니다"
              message="비디오 분석을 시작하려면 먼저 YouTube 채널을 연결해주세요."
              actionLabel="채널 연결하기"
              onAction={() => window.location.href = '/dashboard/channels'}
            />
          </div>
        </ErrorBoundary>
      );
    }

  // 비디오 목록 가져오기 (필터링 조건 포함)
  const whereClause: any = {
    channelId: { in: channels.map(c => c.id) }
  };

  if (category) {
    whereClause.categoryId = category;
  }

  if (status) {
    whereClause.privacyStatus = status;
  }

  const videos = await prisma.video.findMany({
    where: whereClause,
    orderBy: {
      [sort]: order as 'asc' | 'desc'
    },
    skip: (pageNumber - 1) * pageSize,
    take: pageSize,
    include: {
      channel: {
        select: {
          title: true,
          thumbnailUrl: true
        }
      }
    }
  });

  const totalVideos = await prisma.video.count({
    where: whereClause
  });

  const totalPages = Math.ceil(totalVideos / pageSize);

  // 전체 통계 계산
  const stats = await prisma.video.aggregate({
    where: whereClause,
    _sum: {
      viewCount: true,
      likeCount: true,
      commentCount: true
    },
    _avg: {
      viewCount: true,
      likeCount: true,
      commentCount: true
    }
  });

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Video Analytics</h1>
          <div className="text-sm text-gray-500">
            총 {totalVideos}개 비디오
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-500">총 조회수</div>
            <div className="text-2xl font-bold">
              {(stats._sum.viewCount || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-500">평균 조회수</div>
            <div className="text-2xl font-bold">
              {Math.round(stats._avg.viewCount || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-500">총 좋아요</div>
            <div className="text-2xl font-bold">
              {(stats._sum.likeCount || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-sm text-gray-500">총 댓글</div>
            <div className="text-2xl font-bold">
              {(stats._sum.commentCount || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* 필터 및 정렬 */}
        <VideoFilters 
          currentSort={sort} 
          currentOrder={order} 
          currentCategory={category}
          currentStatus={status}
        />

        {/* 비디오 목록 */}
        {videos.length === 0 ? (
          <EmptyState
            title="비디오가 없습니다"
            message="현재 필터 조건에 맞는 비디오가 없습니다."
            actionLabel="필터 초기화"
            onAction={() => window.location.href = '/dashboard/videos'}
          />
        ) : (
          <VideoList videos={videos} />
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <Pagination 
            currentPage={pageNumber} 
            totalPages={totalPages} 
            baseUrl="/dashboard/videos"
          />
        )}
      </div>
    </ErrorBoundary>
  );
  } catch (error) {
    console.error('비디오 페이지 로딩 오류:', error);
    return (
      <ErrorBoundary>
        <div className="p-6">
          <ErrorState
            title="페이지 로딩 오류"
            message="비디오 목록을 불러오는 중 오류가 발생했습니다."
            onRetry={() => window.location.reload()}
            onGoHome={() => window.location.href = '/dashboard'}
            showGoHome={true}
          />
        </div>
      </ErrorBoundary>
    );
  }
} 