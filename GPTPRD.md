# 📋 TubeSpy - MVP Product Requirements Document (PRD)

## 1. 제품 개요

### 1.1 제품명

**TubeSpy** (MVP)

### 1.2 제품 설명

YouTube Spy는 유튜브 컨텐츠 크리에이터를 위한 AI 기반 분석 및 아이디어 추천 플랫폼입니다. 사용자는 유튜브 영상 데이터를 수집 및 분석하여, 다음 콘텐츠 전략을 빠르게 수립할 수 있습니다. 특히 '떡상 중인 영상'을 발견하고, 구독자 대비 성과가 뛰어난 채널 및 영상을 실시간으로 분석해 콘텐츠 성장 기회를 포착할 수 있도록 설계되었습니다.

### 1.3 타겟 사용자

* 유튜브 콘텐츠 크리에이터
* 콘텐츠 마케터
* 브랜드 매니저
* 유튜브 채널 운영자
* 영상 콘텐츠 기획자 및 광고주

---

## 2. 핵심 기능 (MVP)

| 개발 순서 | 기능         | 설명                                                       |
| ----- | ---------- | -------------------------------------------------------- |
| 1     | 그룹 로그인     | Supabase Google OAuth2 통해 사용자 시작                         |
| 2     | 유튜브 검색     | 키워드 기반 유튜브 영상 검색 + 메타데이터 Supabase에 저장                    |
| 3     | 영상 정보 및 표시 | Supabase를 통해 제목, 채널, 조회수, 기타 메타데이터 통합 표시                 |
| 4     | AI 아이디어 추천 | Supabase Edge Function을 통해 Gemini API 호출, 콘텐츠 아이디어 제안 반환 |
| 5     | 유저 영상 저장   | Supabase DB에서 검색 및 추천 영상을 저장, 삭제, 확인                     |

---

## 3. Supabase 기반 ERD

### users

* id (UUID, PK)
* email
* full\_name
* profile\_url
* provider (google 등)
* created\_at

### youtube\_videos

* id (UUID, PK)
* user\_id (UUID, FK)
* video\_id (YouTube Video ID)
* title
* description
* channel\_title
* published\_at
* view\_count
* like\_count
* comment\_count
* duration
* thumbnail\_url
* tags (JSON)
* created\_at

### analysis\_results

* id (UUID, PK)
* user\_id (UUID, FK)
* video\_id (UUID, FK)
* analysis\_type (ex: 'recommendation')
* analysis\_data (JSON)
* created\_at

---

## 4. Supabase Edge Function 예시 (Gemini API 호출)

```ts
// functions/gemini-recommend.ts
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const { videoTitle, keywords } = await req.json();

  const prompt = `YouTube video title: ${videoTitle}\nKeywords: ${keywords.join(", ")}\nSuggest 3 new video ideas.`;

  const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  const result = await geminiRes.json();
  return new Response(JSON.stringify({ suggestions: result }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

## 5. Supabase RLS 권한 정책 예시

### youtube\_videos

```sql
CREATE POLICY "Users can access their videos"
  ON youtube_videos
  FOR ALL
  USING (auth.uid() = user_id);
```

### analysis\_results

```sql
CREATE POLICY "Users can access their analysis"
  ON analysis_results
  FOR ALL
  USING (auth.uid() = user_id);
```

---

## 6. 추가 구성 요약

* 백엔드 서버 없음 (FastAPI 불필요)
* 모든 데이터는 Supabase PostgREST API or Edge Function으로 처리
* 클라이언트에서 직접 인증/DB/API 호출
* Gemini 호출은 Supabase 함수 또는 앱 내에서 실행 가능

---

## 8. UI/UX 구성 방향 (TubeLens 기반 벤치마킹)

### 8.1 전체 구조

* **좌측 패널**: \[검색 설정] 및 \[필터 설정] 섹션 구분

  * 검색 기준: 최신순 / 조회수순
  * 영상 수집 수, 기간, 국가 선택
  * 키워드 입력 및 검색 실행
  * 콘텐츠 영향력 지수(Great!, Good, Soso)
  * 소스 타입 (쇼츠 / 롱폼) 선택
  * 구독자 수, 조회수 필터

* **상단 패널**: 주요 기능 퀵 버튼

  * 🔵 보관 / 보관함
  * 🟢 MP4 다운로드 / MP3 다운로드 / URL 다운로드
  * 🟣 AI 추천 아이디어 / 제목 메이커 / 분석 및 대본생성

* **메인 테이블**:

  * 썸네일 / 채널명 / 제목 / 게시일 / 구독자 수 / 조회수
  * 채널 기여도 / 성과도 배율 / CI지표 / 영상 길이 / 좋아요 수 / 댓글 수 / 참여율 / 총 영상 수 / 자막 여부 등

### 8.2 특징

* 전체 테이블은 정렬/검색 가능
* 필터 후 자동 반영
* 다중 영상 선택 기능 → 보관/다운로드/분석 가능
* 필터링된 결과는 보관함 및 CSV로 저장 가능

### 8.3 사용성 강조 포인트

* 검색 → 필터 → 분석 → 저장의 흐름을 클릭 수 최소화로 구성
* 각 영상별 분석 결과 우측 클릭 시 확장 보기 제공 (예: 댓글 요약, 제목 추천 등)
* 모바일 최적화보다는 데스크탑/설치형 UX에 초점

## 7. 기능 확장 계획 (MVP 이후)

### 🔎 \[핵심 기능 1] 숨은 보석 찾기 (CI, 성과도 지표)

* 구독자는 적지만 조회수가 높은 영상 자동 탐색 (성과도: 조회수/구독자)
* 채널 기여도: 영상이 전체 채널 조회수에서 차지하는 비율 계산
* 좋아요+댓글 비율 = 참여율 지표 제공 (조회수 대비 반응성 판단)
* 벤치마킹 채널 자동 추천 (유사 포맷, 유사 주제 영상 필터링)

### 💬 \[핵심 기능 2] 자막/댓글 분석

* 인기 댓글 TOP 10 자동 추출 및 키워드 요약
* 자막 수집 → 핵심 주제 및 타겟 키워드 분석
* 시청자 반응을 반영한 콘텐츠 기획 지원

### 📥 \[핵심 기능 3] 튜브그랩 (Tube Grab)

* 영상 고화질 MP4 다운로드 및 MP3 추출 지원
* 유튜브/틱톡/인스타/Facebook/비메오 등 다양한 URL 지원
* 워터마크 없이 개별 다운로드 및 일괄 다운로드 모두 지원
* 학습/내부 참고 용도로만 사용 권장 (저작권 책임 사용자에게 있음)

### 📂 \[핵심 기능 4] 영상 보관함 & 비교 분석

* 영상 정보 저장 및 비교 보관함 제공
* 이전에 본 영상의 조회수/구독자 변화 추적 가능
* 보관된 정보 엑셀 파일로 저장 (CSV 다운로드)

### 📊 \[핵심 기능 5] 채널 상세 분석

* 채널의 평균 조회수, 최신 업로드일, 구독자/총 영상 수 등 제공
* 인기 영상 Top 3 자동 분석
* 마케터 대상 협업용 채널 탐색 도구로 활용 가능

---

**업데이트: 2025-06-25**


다음 할일 필터 기능 수정 , 썸네일 클릭시 영상 재생 ,자막 클릭시 자막 내용 표시 ,등 기능 추가 