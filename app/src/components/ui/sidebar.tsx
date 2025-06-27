'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Database, 
  Search, 
  Settings, 
  Home,
  TrendingUp,
  Activity,
  X,
  Video
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navigation = [
  {
    name: '대시보드',
    href: '/dashboard',
    icon: Home,
    description: '검색 및 분석 도구'
  },
  {
    name: '분석',
    href: '/analytics',
    icon: BarChart3,
    description: '채널 및 영상 통계'
  },
  {
    name: '비디오 분석',
    href: '/dashboard/videos',
    icon: Video,
    description: '개별 영상 성과 분석'
  },
  {
    name: '데이터 관리',
    href: '/data-management',
    icon: Database,
    description: '데이터 백업 및 정리'
  }
];

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
    // 모바일에서 네비게이션 후 사이드바 닫기
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black/50" 
          onClick={onClose}
        />
      )}
      
      {/* 사이드바 */}
      <div
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-white border-r transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* 모바일 헤더 */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold">TubeSpy</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="mt-4 lg:mt-8 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.name}
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start h-12 px-4',
                  isActive 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <Icon className="mr-3 h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className={cn(
                    'text-xs',
                    isActive ? 'text-blue-100' : 'text-gray-500'
                  )}>
                    {item.description}
                  </span>
                </div>
              </Button>
            );
          })}
        </nav>

        {/* 하단 정보 */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Activity className="h-4 w-4" />
              <span>YouTube Analytics Platform</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              채널과 영상 성과를 분석하고 최적화하세요
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 