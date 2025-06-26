'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Settings, TrendingUp, Filter, X } from 'lucide-react';

interface FilterState {
  sortOrder: 'latest' | 'viewCount';
  maxResults: number;
  period: string;
  country: string;
  contentType: 'all' | 'shorts' | 'long';
  influenceLevel: string[];
  viewCountFilter: string;
  subscriberFilter: string;
  searchMode?: 'video' | 'channel'; // 검색 모드 추가
}

interface SearchFilterPanelProps {
  onSearch: (query: string, filters: FilterState) => void;
  loading: boolean;
}

export default function SearchFilterPanel({ onSearch, loading }: SearchFilterPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'video' | 'channel'>('video'); // 검색 모드 상태 추가
  const [filters, setFilters] = useState<FilterState>({
    sortOrder: 'latest',
    maxResults: 100,
    period: '7days',
    country: 'KR',
    contentType: 'all',
    influenceLevel: [],
    viewCountFilter: 'none',
    subscriberFilter: 'none'
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // 검색 모드에 따라 다른 검색 실행
      const searchFilters = { ...filters, searchMode };
      onSearch(searchQuery, searchFilters);
    }
  };

  const toggleSearchMode = () => {
    setSearchMode(prev => prev === 'video' ? 'channel' : 'video');
  };

  const handleClear = () => {
    setSearchQuery('');
    setFilters({
      sortOrder: 'latest',
      maxResults: 100,
      period: '7days',
      country: 'KR',
      contentType: 'all',
      influenceLevel: [],
      viewCountFilter: 'none',
      subscriberFilter: 'none'
    });
  };

  const toggleInfluenceLevel = (level: string) => {
    setFilters(prev => ({
      ...prev,
      influenceLevel: prev.influenceLevel.includes(level)
        ? prev.influenceLevel.filter(l => l !== level)
        : [...prev.influenceLevel, level]
    }));
  };

  return (
    <div className="w-full space-y-4">
      {/* 상단 버튼들 */}
      <div className="flex gap-2">
        <Button variant="default" className="flex-1 bg-blue-500 hover:bg-blue-600 text-sm">
          <Settings className="mr-2 h-4 w-4" />
          설정
        </Button>
        <Button variant="default" className="flex-1 bg-green-500 hover:bg-green-600 text-sm">
          <TrendingUp className="mr-2 h-4 w-4" />
          실시간
        </Button>
      </div>

      {/* 검색 설정 */}
      <Card className="bg-gray-800 border-blue-400 border-2">
        <CardContent className="p-3 space-y-3">
          <div className="text-center text-blue-300 font-medium border-b border-blue-400 pb-1 text-sm">
            [검색 설정]
          </div>

          {/* 최신순/조회수순 */}
          <div>
            <div className="text-white text-sm mb-2">정렬</div>
            <div className="flex gap-2">
              <Button
                variant={filters.sortOrder === 'latest' ? 'default' : 'outline'}
                onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'latest' }))}
                className={filters.sortOrder === 'latest' ? 'bg-blue-500' : 'bg-gray-600 text-white border-gray-500'}
              >
                최신순
              </Button>
              <Button
                variant={filters.sortOrder === 'viewCount' ? 'default' : 'outline'}
                onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'viewCount' }))}
                className={filters.sortOrder === 'viewCount' ? 'bg-blue-500' : 'bg-gray-600 text-white border-gray-500'}
              >
                조회수순
              </Button>
            </div>
          </div>

          {/* 영상 수집 수 */}
          <div>
            <div className="text-white text-sm mb-2">영상 수집 수</div>
            <Select 
              value={filters.maxResults.toString()} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, maxResults: parseInt(value) }))}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50개</SelectItem>
                <SelectItem value="100">100개</SelectItem>
                <SelectItem value="200">200개</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 기간 & 국가 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-white text-sm mb-2">기간</div>
              <Select 
                value={filters.period} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">1일</SelectItem>
                  <SelectItem value="7days">7일</SelectItem>
                  <SelectItem value="30days">30일</SelectItem>
                  <SelectItem value="all">전체</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-white text-sm mb-2">국가</div>
              <Select 
                value={filters.country} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KR">한국</SelectItem>
                  <SelectItem value="US">미국</SelectItem>
                  <SelectItem value="JP">일본</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 검색 모드 토글 버튼 */}
          <Button 
            onClick={toggleSearchMode}
            className={`w-full ${
              searchMode === 'video' 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-green-500 hover:bg-green-600'
            } text-white transition-colors`}
          >
            <Search className="mr-2 h-4 w-4" />
            {searchMode === 'video' ? '영상 검색' : '채널 검색'}
          </Button>

          {/* 검색어 입력 */}
          <div>
            <div className="text-white text-sm mb-2 flex items-center gap-2">
              검색어 
              <span className={`text-xs px-2 py-1 rounded-full ${
                searchMode === 'video' 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'bg-green-500/20 text-green-300'
              }`}>
                {searchMode === 'video' ? '영상 모드' : '채널 모드'}
              </span>
              {loading && <span className="text-yellow-400 text-xs">검색 중...</span>}
            </div>
            <Input
              type="text"
              placeholder={searchMode === 'video' ? "영상 검색어 입력..." : "채널명 입력..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery.trim() && !loading) {
                  handleSearch();
                }
              }}
              disabled={loading}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 disabled:opacity-50"
            />
          </div>

          {/* Clear 버튼 */}
          <Button 
            onClick={handleClear}
            variant="outline"
            className="w-full bg-gray-600 text-white border-gray-500 hover:bg-gray-700"
          >
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </CardContent>
      </Card>

      {/* 필터 설정 */}
      <Card className="bg-gray-800 border-blue-400 border-2">
        <CardContent className="p-4 space-y-4">
          <div className="text-center text-blue-300 font-medium border-b border-blue-400 pb-2">
            [필터 설정]
          </div>

          {/* 콘텐츠 타입 */}
          <div>
            <div className="text-white text-sm mb-2">콘텐츠 타입</div>
            <div className="flex gap-2">
              <Button
                variant={filters.contentType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilters(prev => ({ ...prev, contentType: 'all' }))}
                className={filters.contentType === 'all' ? 'bg-blue-500' : 'bg-gray-600 text-white border-gray-500'}
              >
                전체
              </Button>
              <Button
                variant={filters.contentType === 'shorts' ? 'default' : 'outline'}
                onClick={() => setFilters(prev => ({ ...prev, contentType: 'shorts' }))}
                className={filters.contentType === 'shorts' ? 'bg-blue-500' : 'bg-gray-600 text-white border-gray-500'}
              >
                쇼츠
              </Button>
              <Button
                variant={filters.contentType === 'long' ? 'default' : 'outline'}
                onClick={() => setFilters(prev => ({ ...prev, contentType: 'long' }))}
                className={filters.contentType === 'long' ? 'bg-blue-500' : 'bg-gray-600 text-white border-gray-500'}
              >
                롱폼
              </Button>
            </div>
          </div>

          {/* 영향력 지수 */}
          <div>
            <div className="text-white text-sm mb-2">영향력 지수</div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={filters.influenceLevel.includes('great') ? 'default' : 'outline'}
                onClick={() => toggleInfluenceLevel('great')}
                className={filters.influenceLevel.includes('great') ? 'bg-blue-500' : 'bg-gray-600 text-white border-gray-500'}
              >
                Great!!
              </Button>
              <Button
                size="sm"
                variant={filters.influenceLevel.includes('good') ? 'default' : 'outline'}
                onClick={() => toggleInfluenceLevel('good')}
                className={filters.influenceLevel.includes('good') ? 'bg-blue-500' : 'bg-gray-600 text-white border-gray-500'}
              >
                Good
              </Button>
              <Button
                size="sm"
                variant={filters.influenceLevel.includes('soso') ? 'default' : 'outline'}
                onClick={() => toggleInfluenceLevel('soso')}
                className={filters.influenceLevel.includes('soso') ? 'bg-blue-500' : 'bg-gray-600 text-white border-gray-500'}
              >
                Soso
              </Button>
            </div>
          </div>

          {/* 필터 적용/해제 */}
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              <Filter className="mr-2 h-4 w-4" />
              필터 적용
            </Button>
            <Button 
              variant="outline"
              className="flex-1 bg-gray-600 text-white border-gray-500 hover:bg-gray-700"
            >
              필터 해제
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 