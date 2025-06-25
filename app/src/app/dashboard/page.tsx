import { requireAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, BarChart3, TrendingUp, Users, Eye } from 'lucide-react';
import { DashboardHeader } from './components/dashboard-header';

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader session={session} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            안녕하세요, {session.user.name}님! 👋
          </h2>
          <p className="text-gray-600">
            YouTube 채널 분석을 시작해보세요. 아래에서 채널을 추가하거나 기존 데이터를 확인할 수 있습니다.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">분석된 채널</CardTitle>
              <Youtube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                아직 분석된 채널이 없습니다
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 조회수</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                분석 시작 후 확인 가능
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">구독자 수</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                채널 추가 후 확인 가능
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">성장률</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                데이터 수집 후 계산
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-600" />
                채널 분석 시작하기
              </CardTitle>
              <CardDescription>
                YouTube 채널 URL을 입력하여 분석을 시작하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="YouTube 채널 URL 또는 채널 ID"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <Button className="bg-red-600 hover:bg-red-700">
                  분석 시작
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                예: https://www.youtube.com/@channelname 또는 UC1234567890
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                최근 분석 결과
              </CardTitle>
              <CardDescription>
                최근에 분석한 채널들의 성과를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>아직 분석된 채널이 없습니다</p>
                <p className="text-sm">채널을 추가하여 분석을 시작해보세요</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            TubeSpy로 할 수 있는 일들
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-100 p-2 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-red-600" />
                </div>
                <h4 className="font-medium">성과 분석</h4>
              </div>
              <p className="text-sm text-gray-600">
                채널과 동영상의 조회수, 구독자, 참여도를 분석합니다
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="font-medium">트렌드 추적</h4>
              </div>
              <p className="text-sm text-gray-600">
                인기 키워드와 트렌드를 파악하여 콘텐츠 전략을 세웁니다
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <h4 className="font-medium">경쟁자 분석</h4>
              </div>
              <p className="text-sm text-gray-600">
                경쟁 채널의 성과를 비교하고 인사이트를 얻습니다
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 