import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { VideoList } from '@/components/videos/VideoList';
import { VideoFilters } from '@/components/videos/VideoFilters';
import { Pagination } from '@/components/ui/pagination';

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
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Video Analytics</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">채널을 먼저 연결해주세요.</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            채널 연결하기
          </button>
        </div>
      </div>
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
      <VideoList videos={videos} />

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={pageNumber} 
          totalPages={totalPages} 
          baseUrl="/dashboard/videos"
        />
      )}
    </div>
  );
} 