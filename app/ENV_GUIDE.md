# 환경변수 안전 관리 가이드

## 🚨 환경변수를 잃어버리지 않는 방법

### 1. 작업 전 백업하기
```bash
./backup-env.sh
```

### 2. 실수로 삭제했을 때 복구하기
```bash
./restore-env.sh
```

### 3. 새 환경변수 파일 만들기
```bash
cp .env.template .env.local
# 그 다음 Google OAuth 정보 수동 입력
nano .env.local
```

## 📋 필수 환경변수 체크리스트

- `NEXTAUTH_SECRET`: 임의의 긴 문자열
- `NEXTAUTH_URL`: http://localhost:3000
- `GOOGLE_CLIENT_ID`: Google Cloud Console에서 가져온 클라이언트 ID
- `GOOGLE_CLIENT_SECRET`: Google Cloud Console에서 가져온 클라이언트 시크릿
- `GOOGLE_API_KEY`: YouTube Data API v3 키
- `DATABASE_URL`: "file:./prisma/dev.db"

## 🔒 Google OAuth 정보 찾는 방법

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **API 및 서비스 > 사용자 인증 정보**
4. **OAuth 2.0 클라이언트 ID** 클릭
5. 클라이언트 ID와 클라이언트 보안 비밀번호 복사

## ⚡ 빠른 명령어

```bash
# 백업 만들기
./backup-env.sh

# 복구하기
./restore-env.sh

# 서버 시작하기 (올바른 폴더에서)
cd /Users/DoohanIT/tubespy/app && npm run dev
``` 