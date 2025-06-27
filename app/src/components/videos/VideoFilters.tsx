'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VideoFiltersProps {
  currentSort: string;
  currentOrder: string;
  currentCategory?: string;
  currentStatus?: string;
}

export function VideoFilters({ 
  currentSort, 
  currentOrder, 
  currentCategory, 
  currentStatus 
}: VideoFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === 'all' || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    // 페이지는 1로 리셋
    params.set('page', '1');
    
    router.push(`/dashboard/videos?${params.toString()}`);
  };

  const sortOptions = [
    { value: 'publishedAt', label: '게시일' },
    { value: 'viewCount', label: '조회수' },
    { value: 'likeCount', label: '좋아요' },
    { value: 'commentCount', label: '댓글수' },
    { value: 'title', label: '제목' }
  ];

  const orderOptions = [
    { value: 'desc', label: '내림차순' },
    { value: 'asc', label: '오름차순' }
  ];

  const statusOptions = [
    { value: 'all', label: '모든 상태' },
    { value: 'public', label: '공개' },
    { value: 'unlisted', label: '목록에 없음' },
    { value: 'private', label: '비공개' }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 정렬 기준 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            정렬 기준
          </label>
          <Select value={currentSort} onValueChange={(value) => updateFilter('sort', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 정렬 순서 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            정렬 순서
          </label>
          <Select value={currentOrder} onValueChange={(value) => updateFilter('order', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orderOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 공개 상태 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            공개 상태
          </label>
          <Select 
            value={currentStatus || 'all'} 
            onValueChange={(value) => updateFilter('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 필터 초기화 */}
        <div className="flex items-end">
          <button
            onClick={() => router.push('/dashboard/videos')}
            className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            필터 초기화
          </button>
        </div>
      </div>
    </div>
  );
} 