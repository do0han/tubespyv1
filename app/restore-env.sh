#!/bin/bash
# 환경변수 복구 스크립트

echo "📁 사용 가능한 백업 파일들:"
backup_files=($(ls -t .env.local.backup.* 2>/dev/null))

if [ ${#backup_files[@]} -eq 0 ]; then
    echo "❌ 백업 파일이 없습니다."
    echo "🔧 템플릿에서 새로 생성하시겠습니까? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        cp .env.template .env.local
        echo "✅ 템플릿에서 .env.local 생성완료"
        echo "🔑 이제 Google OAuth 정보를 수동으로 입력하세요:"
        echo "   nano .env.local"
    fi
    exit 0
fi

for i in "${!backup_files[@]}"; do
    echo "  $((i+1)). ${backup_files[$i]}"
done

echo "복구할 백업 번호를 선택하세요 (1-${#backup_files[@]}):"
read -r choice

if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#backup_files[@]}" ]; then
    selected_file="${backup_files[$((choice-1))]}"
    cp "$selected_file" .env.local
    echo "✅ 환경변수 복구 완료: $selected_file -> .env.local"
else
    echo "❌ 잘못된 선택입니다."
fi
