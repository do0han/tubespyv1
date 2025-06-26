'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Trash2, 
  Clock, 
  RefreshCcw, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface DataRetentionSettings {
  enabled: boolean;
  retentionDays: number;
  applyToChannels: boolean;
  applyToVideos: boolean;
  lastCleanupAt?: string;
}

export default function CleanupSettings() {
  const [settings, setSettings] = useState<DataRetentionSettings>({
    enabled: false,
    retentionDays: 30,
    applyToChannels: false,
    applyToVideos: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data-management/cleanup');
      
      if (!response.ok) {
        throw new Error('설정을 불러올 수 없습니다');
      }

      const data = await response.json();
      setSettings(data.settings);

    } catch (error) {
      console.error('설정 로드 오류:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : '설정을 불러올 수 없습니다' 
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/data-management/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '설정 저장에 실패했습니다');
      }

      const data = await response.json();
      setSettings(data.settings);
      setMessage({ type: 'success', text: '설정이 저장되었습니다' });

    } catch (error) {
      console.error('설정 저장 오류:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : '설정 저장 중 오류가 발생했습니다' 
      });
    } finally {
      setSaving(false);
    }
  };

  const runManualCleanup = async () => {
    if (!settings.applyToChannels && !settings.applyToVideos) {
      setMessage({ type: 'error', text: '정리 대상을 선택해주세요' });
      return;
    }

    if (!confirm(`${settings.retentionDays}일 이전의 데이터를 정리하시겠습니까?`)) {
      return;
    }

    try {
      setCleaning(true);
      setMessage(null);

      const params = new URLSearchParams({
        retentionDays: settings.retentionDays.toString(),
        applyToChannels: settings.applyToChannels.toString(),
        applyToVideos: settings.applyToVideos.toString(),
      });

      const response = await fetch(`/api/data-management/cleanup?${params}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '정리 실행에 실패했습니다');
      }

      const data = await response.json();
      setMessage({ type: 'success', text: data.message });
      
      // 설정 새로고침 (lastCleanupAt 업데이트)
      await loadSettings();

    } catch (error) {
      console.error('정리 실행 오류:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : '정리 실행 중 오류가 발생했습니다' 
      });
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCcw className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">설정을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={`${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          {message.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            자동 정리 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 자동 정리 활성화 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={settings.enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, enabled: !!checked }))
              }
            />
            <Label className="text-sm font-medium">자동 정리 활성화</Label>
            {settings.enabled && (
              <Badge variant="secondary" className="text-xs">
                활성화됨
              </Badge>
            )}
          </div>

          {/* 보존 기간 설정 */}
          <div className="space-y-2">
            <Label htmlFor="retentionDays" className="text-sm font-medium">
              데이터 보존 기간 (일)
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="retentionDays"
                type="number"
                min="1"
                max="365"
                value={settings.retentionDays}
                onChange={(e) => 
                  setSettings(prev => ({ 
                    ...prev, 
                    retentionDays: Math.max(1, Math.min(365, parseInt(e.target.value) || 1))
                  }))
                }
                className="w-20"
              />
              <span className="text-sm text-gray-600">일 이전 데이터 자동 삭제</span>
            </div>
            <p className="text-xs text-gray-500">
              {settings.retentionDays}일 이전에 저장된 데이터가 자동으로 삭제됩니다 (1-365일)
            </p>
          </div>

          {/* 적용 대상 선택 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">정리 적용 대상</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={settings.applyToVideos}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, applyToVideos: !!checked }))
                  }
                />
                <Label className="text-sm">비디오 데이터</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={settings.applyToChannels}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, applyToChannels: !!checked }))
                  }
                />
                <Label className="text-sm">채널 데이터 (비디오가 없는 채널만)</Label>
              </div>
            </div>
            
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700 text-xs">
                채널 삭제는 해당 채널에 연결된 비디오가 모두 삭제된 후에만 적용됩니다.
              </AlertDescription>
            </Alert>
          </div>

          {/* 마지막 정리 시간 */}
          {settings.lastCleanupAt && (
            <div className="text-sm text-gray-600">
              <Clock className="h-4 w-4 inline mr-1" />
              마지막 정리: {new Date(settings.lastCleanupAt).toLocaleString()}
            </div>
          )}

          {/* 버튼 그룹 */}
          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={saveSettings} 
              disabled={saving}
              className="flex-1"
            >
              {saving && <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />}
              설정 저장
            </Button>
            
            <Button 
              onClick={runManualCleanup} 
              disabled={cleaning || (!settings.applyToChannels && !settings.applyToVideos)}
              variant="outline"
              className="flex-1"
            >
              {cleaning && <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />}
              <Trash2 className="h-4 w-4 mr-2" />
              지금 정리 실행
            </Button>
          </div>

          {/* 정리 미리보기 */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium mb-2">정리 조건 미리보기</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• 기준 날짜: {new Date(Date.now() - settings.retentionDays * 24 * 60 * 60 * 1000).toLocaleDateString()} 이전</p>
                <p>• 비디오 삭제: {settings.applyToVideos ? '활성화' : '비활성화'}</p>
                <p>• 채널 삭제: {settings.applyToChannels ? '활성화 (비디오가 없는 채널만)' : '비활성화'}</p>
                <p>• 자동 실행: {settings.enabled ? '활성화됨' : '비활성화됨'}</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
} 