import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getMyChannels } from '@/lib/youtube';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다' }, 
        { status: 401 }
      );
    }

    const channels = await getMyChannels(session);
    
    return NextResponse.json({
      success: true,
      data: channels
    });
  } catch (error) {
    console.error('채널 정보 가져오기 실패:', error);
    return NextResponse.json(
      { error: '채널 정보를 가져올 수 없습니다' }, 
      { status: 500 }
    );
  }
} 