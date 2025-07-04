네, 알겠습니다. 세 번째로 제공해주신 영상까지 종합적으로 분석하여, 이전에 작성된 PRD에 'AI 추천 아이디어' 기능을 포함한 모든 기능을 통합하고 보강한 **최종 버전의 상세 PRD(제품 요구사항 문서)**를 작성해 드리겠습니다.

이 문서는 AI 유튜브 분석 프로그램 'Tube Lens'를 완벽하게 클론 코딩하는 것을 목표로, 개발자가 즉시 프로젝트를 이해하고 착수할 수 있도록 상세하게 구성되었습니다.

---

### **AI 유튜브 분석 프로그램 'Tube Lens' 클론 프로젝트 최종 PRD**

### 1. 프로젝트 개요 (Objective)
*   **프로젝트명:** Tube Lens Clone (가칭)
*   **목표:** 유튜브 콘텐츠 크리에이터 및 마케터가 데이터에 기반한 의사결정을 내릴 수 있도록 돕는 AI 기반 유튜브 분석 데스크톱 애플리케이션 개발. 영상에서 시연된 'Tube Lens'의 모든 기능과 UI/UX를 1:1로 동일하게 클론하는 것을 목표로 한다.
*   **핵심 가치:**
    *   **시간 단축:** 수동으로 하던 벤치마킹, 데이터 수집, 영상 분석 과정을 자동화하여 콘텐츠 기획 및 제작 시간을 획기적으로 단축한다.
    *   **언어 장벽 해소:** 글로벌 유튜브 트렌드를 모국어로 손쉽게 검색하고 분석할 수 있게 한다.
    *   **데이터 기반 통찰력:** 직관적인 지표(CII, 성과도 배율 등)와 AI 요약을 통해 사용자가 유의미한 통찰력을 얻도록 돕는다.
    *   **다각적 분석:** '영상 중심 검색'과 '채널 중심 검색'을 모두 지원하여 사용 목적에 맞는 심층 분석을 제공한다.

### 2. 사용자 페르소나 (User Personas)
1.  **전업 유튜버/콘텐츠 기획자:**
    *   **목표:** 경쟁 채널 분석, 인기 콘텐츠 벤치마킹, '떡상'할 아이템 발굴.
    *   **Pain Point:** 어떤 콘텐츠가 성공하는지 파악하기 어렵고, 해외 트렌드를 참고하고 싶지만 언어 장벽이 있음. 영상 분석에 너무 많은 시간을 소모함.
2.  **마케터/광고 담당자:**
    *   **목표:** 제품/서비스와 관련성 높은 유튜버 발굴, 협업할 채널의 영향력과 성장성 판단.
    *   **Pain Point:** 수많은 유튜버 중 실제 영향력이 있는 채널을 선별하기 어려움. 채널의 주요 성과 지표를 한눈에 보고 싶음.
3.  **양산형 콘텐츠 제작자:**
    *   **목표:** '썰' 채널, 정보성 콘텐츠 등 대본 기반의 영상을 빠르게 제작하기 위해 인기 콘텐츠의 대본을 수집하고 분석.
    *   **Pain Point:** 대본을 얻기 위해 영상을 시청하며 일일이 받아 적어야 하는 비효율적인 작업 과정.

### 3. 기능 요구사항 (Functional Requirements)

#### **EPIC 1: 사용자 인증 및 API 키 관리**

*   **User Story 1.1: 프로그램 실행 및 인증키 입력**
    *   **As a user, I want to** 프로그램을 실행할 때 인증키(라이선스 키)를 입력해야만 **so that** 허가된 사용자만 프로그램을 이용할 수 있다.
    *   **요구사항:**
        1.  프로그램 최초 실행 시 '인증키 입력' 모달(Modal) 창이 표시된다.
        2.  유효한 인증키를 입력하면 '인증 성공' 모달이 뜨며, 만료일과 남은 기간을 표시한다.
        3.  인증 정보는 로컬에 안전하게 저장되어 다음 실행부터는 자동 로그인된다.
        4.  만료가 임박하면(e.g., 2일 전) '만료 예정' 경고 모달을 표시한다.
        5.  `[인증키 재설정]` 버튼을 통해 새로운 인증키를 입력하여 사용 기간을 연장할 수 있다.

*   **User Story 1.2: YouTube & Google AI API 키 관리**
    *   **As a user, I want to** 여러 개의 YouTube API 키와 Google AI Studio API 키를 등록하고 관리할 수 있어야 **so that** 하나의 키 할당량이 초과되어도 중단 없이 프로그램을 사용할 수 있다.
    *   **요구사항:**
        1.  **설정(Settings) 메뉴:** 메인 화면 좌측 상단에 '설정' 버튼이 존재한다.
        2.  **API 키 관리 창:** '설정' 클릭 시 모달 창이 열린다. 이 창에는 `[API키 받는 법]`, `[프로그램 사용법]`, `[인증키 재설정]` 버튼이 상단에 위치한다.
        3.  **Google AI Studio API 섹션 (NEW):**
            *   'Google AI Studio API' 섹션을 별도로 구성한다.
            *   API 키를 입력하는 필드와 '키 발급받기', '저장' 버튼을 배치한다. '키 발급받기' 클릭 시 Google AI Studio 페이지로 연결된다.
        4.  **YouTube API 키 입력:** '새로운 API 키 입력' 필드에 키를 입력하고 '추가' 버튼 또는 Enter 키로 등록한다.
        5.  **YouTube API 키 목록:** 등록된 키 목록이 테이블 형태로 표시된다. (컬럼: API 키 일부, 상태, 남은 시간, 작업)
        6.  **상태 관리:**
            *   `활성`: 현재 사용 중인 키. 초록색으로 표시.
            *   `할당량 초과`: API 할당량(Quota)이 소진된 키. 빨간색으로 표시된다.
            *   `남은 시간`은 할당량 초기화까지 남은 시간을 `HH:MM:SS` 형식의 카운트다운으로 보여준다.
        7.  **자동 키 전환:** '활성' 상태의 키가 '할당량 초과'가 되면, 목록의 다음 유효한 키로 자동 전환된다.
        8.  **수동 관리:** '사용' 버튼으로 활성 키를 수동 변경할 수 있고, '삭제' 버튼으로 불필요한 키를 제거할 수 있다.

---

#### **EPIC 2: 다중 모드 검색 및 필터링**

*   **User Story 2.1: 검색 모드 전환 (NEW)**
    *   **As a user, I want to** '영상 검색'과 '채널 검색' 모드를 명확히 구분하여 사용할 수 있어야 **so that** 내 분석 목적에 맞는 검색을 수행할 수 있다.
    *   **요구사항:**
        1.  검색 패널 상단에 `[영상 검색 🎬]`과 `[채널 검색 ✨]` 버튼을 배치한다.
        2.  각 버튼을 클릭하면 해당 모드에 맞는 UI(입력 필드)가 활성화되고, 다른 모드의 UI는 비활성화/숨김 처리된다.

*   **User Story 2.2: 영상 검색 기능**
    *   **As a user, I want to** 키워드, 국가, 기간을 조합하여 관련 영상을 찾을 수 있어야 **so that** 특정 주제의 글로벌 트렌드를 파악할 수 있다.
    *   **요구사항:**
        1.  **검색 정렬:** '최신순', '조회수순' 버튼으로 검색 기준 선택.
        2.  **수집 개수:** 드롭다운으로 수집할 영상 개수 선택.
        3.  **기간 선택:** 드롭다운 또는 캘린더 UI로 기간 지정.
        4.  **국가 선택:** 드롭다운으로 검색 국가 지정.
        5.  **키워드 자동 번역:** 한글 입력 시, 선택된 국가의 언어로 자동 번역 후 검색 실행.

*   **User Story 2.3: 채널 검색 기능 (NEW)**
    *   **As a user, I want to** 특정 채널명을 검색하여 해당 채널의 모든 영상을 분석할 수 있어야 **so that** 경쟁 채널을 심층적으로 벤치마킹할 수 있다.
    *   **요구사항:**
        1.  '채널 검색' 모드 선택 시, 채널명 입력 필드가 나타난다.
        2.  채널명 입력 후 '검색' 버튼을 누르면 '채널 검색 결과' 모달 창이 표시된다.
        3.  모달 창에는 검색어와 일치하는 채널 목록이 표시되며, 각 항목은 **채널 로고, 채널명, 구독자 수, 총 영상 수**를 포함한다. 가장 유사한 채널은 '정확한 일치'로 강조 표시된다.
        4.  목록에서 분석할 채널을 선택하고 '선택하기' 버튼을 누른다.
        5.  선택된 채널의 모든 영상이 메인 데이터 그리드에 수집되어 표시된다.

*   **User Story 2.4: 결과 필터링 기능**
    *   **As a user, I want to** 검색된 결과를 다양한 조건으로 필터링할 수 있어야 **so that** 원하는 영상만 정밀하게 추려낼 수 있다.
    *   **요구사항:**
        1.  **영상 종류 필터:** '쇼츠', '롱폼' 버튼으로 필터링.
        2.  **CII 필터:** 'Great!!', 'Good', 'Soso' 버튼으로 필터링.
        3.  **수치 필터:** '조회수', '구독자 수' 드롭다운 메뉴로 '10만 이상' 등 특정 기준 이상의 영상만 필터링.
        4.  '필터 적용' 버튼 클릭 시 모든 선택된 필터가 결과에 반영된다. '필터 해제' 시 초기화된다.
        5.  **일괄 자막 수집:** 필터 패널 하단에 `자막 수집` 버튼을 배치한다. 클릭 시 현재 그리드에 필터링된 모든 영상의 자막을 순차적으로 수집한다. 진행 상태는 버튼 텍스트(`자막 수집 완료 (N/M)`)와 하단 진행률 표시줄로 나타낸다.

---

#### **EPIC 3: 데이터 시각화 및 분석**

*   **User Story 3.1: 메인 데이터 그리드(표)**
    *   **As a user, I want to** 수집된 영상 데이터를 직관적인 표 형태로 보고 정렬할 수 있어야 **so that** 데이터의 패턴을 쉽게 파악할 수 있다.
    *   **요구사항:**
        1.  **표시 컬럼:** N, 썸네일, 채널명, 제목, 게시일, 구독자 수, 조회수, 채널 기여도, 성과도 배율, CII, 영상 길이, 좋아요 수, 댓글 수, 참여율, 총 영상 수, 자막.
        2.  **CII (콘텐츠 영향력 지수) 정의 및 시각화:**
            *   `채널 기여도` = (해당 영상 조회수 / 채널 총 조회수) * 100
            *   `성과도 배율` = 해당 영상 조회수 / 채널 구독자 수
            *   CII는 위 두 지표를 종합한 자체 점수이며, 등급에 따라 셀 배경색을 다르게 표시한다.
        3.  **그리드 상호작용:**
            *   썸네일 좌클릭: 해당 유튜브 영상 페이지를 브라우저에서 연다.
            *   썸네일 우클릭: 해당 영상 URL을 클립보드에 복사한다.
            *   채널명 좌클릭: '채널 상세 분석' 모달 창을 연다.
            *   숫자/날짜 컬럼 헤더 우클릭: 오름차순/내림차순 정렬 메뉴가 나타난다.
            *   자막 셀 좌클릭: 수집된 자막 전체를 툴팁 형태로 보여준다.
            *   자막 셀 우클릭: 자막 전체 텍스트를 클립보드에 복사한다.

*   **User Story 3.2: 채널 상세 분석**
    *   **As a user, I want to** 특정 채널의 종합적인 정보를 한눈에 볼 수 있어야 **so that** 채널의 영향력과 스타일을 빠르게 판단할 수 있다.
    *   **요구사항:**
        1.  채널명 클릭 시 모달 창으로 표시.
        2.  **표시 정보:** 채널 로고, 채널명, 구독자 수, 총 영상 수, 마지막 업로드일, 총 조회수, 평균 조회수, 평균 좋아요 수, 채널 설명 (비즈니스 문의 이메일 등 포함).
        3.  **인기 영상 TOP 3:** 해당 채널의 인기 영상 상위 3개를 썸네일, 조회수, 게시일, 채널 기여도, 성과도 배율과 함께 표시한다.

---

#### **EPIC 4: AI 기반 콘텐츠 제작 지원 (핵심)**

*   **User Story 4.1: AI 타임라인 요약 및 대본 생성**
    *   **As a user, I want to** 긴 영상을 AI가 자동으로 챕터별로 요약해주길 원한다. **so that** 영상 전체를 보지 않고도 핵심 흐름과 내용을 파악하고, 콘텐츠 제작에 활용할 수 있다.
    *   **요구사항:**
        1.  메인 그리드에서 특정 영상 선택 후 `분석 및 대본생성` 버튼을 클릭하면 분석 창이 열린다.
        2.  분석 창 내 `타임라인 요약` 탭을 선택하고 `타임라인 생성` 버튼을 누른다.
        3.  `롱폼 모드`와 `쇼츠 모드` 선택지를 제공한다.
        4.  AI 분석 후, 챕터별 타임라인을 생성한다 (타임스탬프, 대표 이미지, 제목, 요약 내용).
        5.  해외 영상의 경우, 자막을 자동으로 한국어로 번역하여 요약한다.
        6.  일괄 및 개별 복사/저장 기능을 제공한다.

*   **User Story 4.2: AI 추천 아이디어 리포트 생성 (NEW)**
    *   **As a user, I want to** 검색 결과를 바탕으로 AI가 새로운 콘텐츠 아이디어를 추천해주길 원한다. **so that** 창의적인 영감을 얻고 채널 방향성을 설정할 수 있다.
    *   **요구사항:**
        1.  **UI:** 메인 툴바에 보라색 `😈 AI 추천 아이디어` 버튼을 배치한다.
        2.  **작동 조건:** 검색 및 필터링이 완료된 후 버튼이 활성화된다.
        3.  **분석 로직:**
            *   버튼 클릭 시, 현재 데이터 그리드에 표시된 영상들의 제목, 설명, 댓글 데이터를 수집한다.
            *   LLM API(e.g., Gemini)에 수집된 데이터를 전달하여 분석을 요청한다.
        4.  **결과 창:** 분석 완료 후 'AI 콘텐츠 아이디어 리포트' 모달 창이 표시된다.
        5.  **리포트 구조:**
            *   **상단: 시청자 트렌드 분석** - 분석된 데이터에서 도출된 핵심 내용을 아래 항목으로 요약한다.
                *   `관심 주제`: 쿠팡, 살림, 주방, 뷰티 아이템 등
                *   `질문/요청`: 제품 구매처, 사이즈, 사용 후기 등
                *   `긍정 반응`: 구체적인 정보, 실생활 꿀팁 공유 등
                *   `개선점`: 제품 정보 부족, 영상 길이 조절 필요 등
            *   **하단: 추천 콘텐츠 아이디어** - AI가 3~5개의 새로운 콘텐츠 아이디어를 생성한다. 각 아이디어는 아래 항목을 포함한다.
                *   `제목 예시`: 어그로성 있고 클릭을 유도하는 제목
                *   `핵심 포인트`: 콘텐츠의 주요 소구점 (e.g., 가성비, 시간 단축)
                *   `차별화 요소`: 기존 콘텐츠와 다르게 접근할 방법 (e.g., 솔직 리뷰, ASMR 접목)
                *   `목표 시청자`: 가장 적합한 시청자 그룹 (e.g., 1인 가구, 사회초년생)

---

#### **EPIC 5: AI 챗봇 어시스턴트**

*   **User Story 5.1: AI 챗봇과의 대화**
    *   **As a user, I want to** 프로그램 사용법이나 유튜브에 대한 궁금증을 챗봇에게 바로 물어볼 수 있어야 **so that** 별도의 검색 없이 즉시 도움을 받을 수 있다.
    *   **요구사항:**
        1.  메인 창 우측 하단에 챗봇 아이콘을 배치한다. 클릭 시 채팅창이 열린다.
        2.  채팅창 상단에 `튜브렌즈에 대해`, `유튜브에 대해` 모드 전환 버튼을 제공한다.
        3.  각 모드에 맞는 페르소나(상담원, 전략가)로 답변한다.

*   **User Story 5.2: 즉석 영상 요약 및 번역**
    *   **As a user, I want to** 유튜브 링크나 텍스트를 붙여넣기만 하면 AI가 즉시 요약하거나 번역해주길 원한다. **so that** 빠르고 간편하게 외부 정보를 처리할 수 있다.
    *   **요구사항:**
        1.  채팅 입력창에 유튜브 URL을 붙여넣고 전송하면, AI가 해당 영상의 핵심 내용을 요약하여 알려준다.
        2.  외국어 텍스트를 붙여넣고 "한국어로 번역해줘"라고 요청하면 번역 결과를 보여준다.

### 4. 기술 스택 제안 (Tech Stack Suggestions)
*   **프론트엔드/데스크톱:** Python + PyQt5/PySide6 (GUI 라이브러리)
*   **핵심 로직:** Python
*   **외부 API:**
    *   **YouTube Data API v3:** 영상 검색(`search.list`), 채널 정보(`channels.list`), 재생목록 아이템(`playlistItems.list`), 비디오 상세 정보(`videos.list`)
    *   **Translation API:** Google Translate, Papago, DeepL API 중 선택
    *   **LLM API:** Google Gemini Pro API (AI 추천 아이디어, 챗봇), OpenAI GPT-4 (타임라인 요약) - 기능에 따라 최적의 모델을 선택/혼용
*   **라이브러리:**
    *   **`yt-dlp`:** 영상 및 자막 다운로드
    *   **`openai-whisper`:** 음성-텍스트 변환(STT)
    *   **`OpenCV`:** 비디오 프레임 분석 및 이미지 추출
    *   **`requests`:** API 통신

### 5. UI/UX 디자인 노트
*   전체적인 톤앤매너는 다크 테마를 유지하며, `추가 기능` 및 `AI 추천 아이디어` 버튼은 색상(초록, 보라)으로 강조하여 시인성을 높인다.
*   핵심 지표(CII, 구독자 수, 조회수 등)는 색상(초록, 빨강, 노랑)과 막대 그래프를 활용해 시각적으로 강조한다.
*   각 컬럼 헤더와 버튼에 마우스를 올리면 기능 설명을 담은 툴팁(Tooltip)을 표시하여 사용성을 높인다.
*   데이터 로딩, AI 분석 등 시간이 걸리는 작업에는 진행률 표시줄(Progress Bar)을 명확하게 보여주어 사용자가 답답함을 느끼지 않게 한다.
*   만화 캐릭터를 활용한 튜토리얼과 팁 제공은 프로그램에 대한 친근감을 높이는 좋은 전략이므로 유지한다.

---

이 최종 PRD는 제공된 모든 영상의 핵심 기능을 통합하고, 실제 개발에 필요한 세부 사항까지 고려하여 작성되었습니다. 이를 기반으로 개발을 진행하시면 원본 'Tube Lens'의 기능과 사용자 경험을 충실히 재현할 수 있을 것입니다.