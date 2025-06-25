'use client';

import { signIn, getSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    getSession().then((session) => {
      if (session) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: true 
      });
    } catch (error) {
      console.error('로그인 중 오류가 발생했습니다:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-600 p-3 rounded-full">
              <Youtube className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TubeSpy</h1>
          <p className="text-gray-600">YouTube 채널 분석의 새로운 시작</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">로그인</CardTitle>
            <CardDescription>
              Google 계정으로 로그인하여 YouTube 채널을 분석해보세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium" 
              onClick={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  로그인 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Google로 시작하기
                </div>
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              <p>로그인하면 다음 기능을 이용할 수 있습니다:</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• YouTube 채널 성과 분석</li>
                <li>• 동영상 트렌드 추적</li>
                <li>• 경쟁자 분석</li>
                <li>• 키워드 연구</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            로그인하면{' '}
            <a href="#" className="text-red-600 hover:underline">
              서비스 약관
            </a>
            과{' '}
            <a href="#" className="text-red-600 hover:underline">
              개인정보 처리방침
            </a>
            에 동의한 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
} 