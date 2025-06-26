import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { syncSearchResults } from '@/lib/sync';

export async function POST(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { searchResults, searchMode = 'video' } = body;

    console.log(`🔄 동기화 API 호출: 사용자 ${session.user.id}, 모드: ${searchMode}`);
    console.log(`📊 데이터 개수: ${searchResults?.length || 0}개`);

    // 입력 데이터 검증
    if (!searchResults) {
      console.error('❌ 검색 결과가 없습니다');
      return NextResponse.json(
        { error: '검색 결과가 필요합니다' },
        { status: 400 }
      );
    }

    if (!Array.isArray(searchResults)) {
      console.error('❌ 잘못된 데이터 형식:', typeof searchResults);
      return NextResponse.json(
        { error: '검색 결과는 배열이어야 합니다' },
        { status: 400 }
      );
    }

    if (searchResults.length === 0) {
      console.log('⚠️ 동기화할 데이터가 없습니다');
      return NextResponse.json({
        success: true,
        message: '동기화할 데이터가 없습니다',
        data: {
          successCount: 0,
          failureCount: 0
        }
      });
    }

    console.log(`🔍 첫 번째 항목 샘플:`, JSON.stringify(searchResults[0], null, 2));

    // 동기화 실행
    const result = await syncSearchResults(
      session.user.id,
      searchResults,
      searchMode as 'video' | 'channel'
    );

    console.log(`✅ 동기화 API 완료:`, result.message);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ 동기화 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
} 