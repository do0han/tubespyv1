#!/bin/bash
# 환경변수 백업 스크립트

BACKUP_NAME=".env.local.backup.$(date +%Y%m%d_%H%M%S)"

if [ -f ".env.local" ]; then
    cp .env.local "$BACKUP_NAME"
    echo "✅ 환경변수 백업 완료: $BACKUP_NAME"
else
    echo "❌ .env.local 파일이 없습니다."
fi

echo "📁 기존 백업 파일들:"
ls -la .env.local.backup.* 2>/dev/null || echo "   없음"
