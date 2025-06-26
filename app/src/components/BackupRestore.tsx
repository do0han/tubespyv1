'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Upload, 
  File, 
  AlertTriangle,
  CheckCircle,
  RefreshCcw,
  Database,
  Archive,
  FileDown,
  FileUp
} from 'lucide-react';

interface BackupStats {
  restoredChannels?: number;
  restoredVideos?: number;
  skippedChannels?: number;
  skippedVideos?: number;
  totalChannels?: number;
  totalVideos?: number;
}

export default function BackupRestore() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupFormat, setBackupFormat] = useState<'json' | 'csv'>('json');
  const [includeChannels, setIncludeChannels] = useState(true);
  const [includeVideos, setIncludeVideos] = useState(true);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    if (!includeChannels && !includeVideos) {
      setMessage({ type: 'error', text: '적어도 하나의 데이터 유형을 선택해야 합니다' });
      return;
    }

    setIsBackingUp(true);
    setMessage(null);

    try {
      const response = await fetch('/api/data-management/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: backupFormat,
          includeChannels,
          includeVideos
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '백업 생성에 실패했습니다');
      }

      // 파일 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `tubespy-backup-${new Date().toISOString().split('T')[0]}.${backupFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: `${backupFormat.toUpperCase()} 백업 파일이 생성되었습니다` });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : '백업 생성 중 오류가 발생했습니다' 
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.json') && !file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'JSON 또는 CSV 파일만 지원됩니다' });
      return;
    }

    handleRestore(file);
  };

  const handleRestore = async (file: File) => {
    setIsRestoring(true);
    setMessage(null);
    setBackupStats(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('overwriteExisting', overwriteExisting.toString());

      const response = await fetch('/api/data-management/restore', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '복원에 실패했습니다');
      }

      setBackupStats(result.stats);
      setMessage({ type: 'success', text: result.message });

      // 성공적으로 복원되면 페이지 새로고침하여 데이터 업데이트
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : '복원 중 오류가 발생했습니다' 
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* 메시지 표시 */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
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

      {/* 백업 통계 */}
      {backupStats && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              복원 완료 통계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{backupStats.restoredChannels}</div>
                <div className="text-sm text-green-700">복원된 채널</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{backupStats.restoredVideos}</div>
                <div className="text-sm text-green-700">복원된 비디오</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{backupStats.skippedChannels}</div>
                <div className="text-sm text-gray-600">건너뛴 채널</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{backupStats.skippedVideos}</div>
                <div className="text-sm text-gray-600">건너뛴 비디오</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* 백업 생성 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              데이터 백업
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>백업할 데이터 선택</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="channels"
                    checked={includeChannels}
                    onCheckedChange={(checked) => setIncludeChannels(checked as boolean)}
                  />
                  <Label htmlFor="channels" className="text-sm font-normal">
                    채널 데이터
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="videos"
                    checked={includeVideos}
                    onCheckedChange={(checked) => setIncludeVideos(checked as boolean)}
                  />
                  <Label htmlFor="videos" className="text-sm font-normal">
                    비디오 데이터
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>파일 형식</Label>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant={backupFormat === 'json' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBackupFormat('json')}
                >
                  JSON
                </Button>
                <Button 
                  type="button"
                  variant={backupFormat === 'csv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBackupFormat('csv')}
                >
                  CSV
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleBackup}
              disabled={isBackingUp || (!includeChannels && !includeVideos)}
              className="w-full"
            >
              {isBackingUp ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  백업 생성 중...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  백업 다운로드
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 데이터 복원 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              데이터 복원
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>복원 옵션</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="overwrite"
                  checked={overwriteExisting}
                  onCheckedChange={(checked) => setOverwriteExisting(checked as boolean)}
                />
                <Label htmlFor="overwrite" className="text-sm font-normal">
                  기존 데이터 덮어쓰기
                </Label>
              </div>
              <p className="text-xs text-gray-500">
                체크하지 않으면 중복된 데이터는 건너뜁니다
              </p>
            </div>

            {/* 파일 드롭 영역 */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                백업 파일을 드래그하여 놓거나 클릭하여 선택하세요
              </p>
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRestoring}
              >
                <File className="h-4 w-4 mr-2" />
                파일 선택
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>

            {isRestoring && (
              <div className="flex items-center justify-center py-4">
                <RefreshCcw className="h-5 w-5 mr-2 animate-spin" />
                <span>데이터 복원 중...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 