import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Youtube, BarChart3, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Youtube className="h-8 w-8 text-red-600" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">TubeSpy</h1>
            <Badge variant="secondary">MVP</Badge>
          </div>
          <Link href="/login">
            <Button variant="outline">로그인</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            YouTube 분석의{" "}
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              새로운 기준
            </span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            AI 기반 인사이트로 채널 성장을 가속화하고, 데이터 기반 의사결정으로 성공을 만들어보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-red-600 hover:bg-red-700">
                무료로 시작하기
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              데모 보기
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>실시간 분석</CardTitle>
              <CardDescription>
                채널과 영상의 성과를 실시간으로 추적하고 트렌드를 파악하세요.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>AI 예측 분석</CardTitle>
              <CardDescription>
                Gemini AI가 제공하는 콘텐츠 성과 예측과 최적화 제안을 받아보세요.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>경쟁사 분석</CardTitle>
              <CardDescription>
                경쟁 채널을 모니터링하고 시장 기회를 발견하세요.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Status */}
        <div className="text-center">
          <Card className="inline-block border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>개발 진행 중</strong> - MVP 버전 구축 중입니다
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-slate-900/50 backdrop-blur-md mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600 dark:text-slate-300">
          <p>&copy; 2025 TubeSpy. YouTube 분석의 미래를 만들어갑니다.</p>
        </div>
      </footer>
    </div>
  );
}
