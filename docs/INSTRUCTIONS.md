# HiscAIHub-fork 고도화 작업 지시서 (v2)

> 대상: 코딩 에이전트 (Claude Code / Codex 등)
> 리포지토리: `https://github.com/kkiha/HiscAIHub-fork`
> 동반 문서: `AI공유허브_고도화_기획서_v2.md` (배경 참조용. 구현 기준은 본 문서를 따른다)

---

## 0. 작업 원칙

**반드시 지킬 것**

1. **단계별로 작업하고, 각 단계 완료 후 멈춘다.** 여러 Phase를 한 번에 진행하지 않는다.
2. 각 Phase마다 별도 커밋을 만든다. 커밋 메시지에 Phase 번호를 포함한다.
3. 기존 디자인 시안(포인트 컬러 `#D96A28`, 미니멀 톤)을 임의로 변경하지 않는다.
4. 코드 주석은 기존 스타일에 맞춰 한국어로 작성한다.
5. 스키마 변경 시 마이그레이션을 생성하고, 기존 시드 스크립트가 깨지지 않는지 확인한다.

**작업 전 확인**

- 작업 브랜치를 생성한다. (`feature/metrics-overhaul` 권장)
- `prisma/seed-usage-mock.ts` 등 시드 스크립트의 동작을 먼저 파악한다.
- 각 Phase 시작 전 `npm run build`가 통과하는지 확인한다.

---

## 1. 이번 작업의 범위

### 포함

- 활성 사용자 정의 수정
- 좋아요 기능 제거
- 업무 카테고리 필수화
- 지표 집계 확장 (카테고리별 / 부서 확산 / 월별 추이)
- 대시보드 전 임직원 공개 전환
- 시드 데이터 정비

### 제외 (이번에 하지 않음)

- **프롬프트 기능 제거 및 에이전트 단일 체계 전환**
  - 기획 확정 대기 중이므로 이번 범위에서 제외한다
  - **프롬프트 관련 모델·라우트·컴포넌트를 삭제하지 않는다**
  - 다만 이후 제거가 쉽도록 코드를 구조화한다 (아래 2장 참조)

---

## 2. 핵심 구조 원칙 — 콘텐츠 집계의 단일 진입점

프롬프트 제거가 보류되었으므로, 모든 지표는 **프롬프트와 에이전트를 합산**해야 한다.
동시에, 이후 프롬프트를 제거할 때 수정 범위가 최소가 되도록 아래 원칙을 따른다.

**원칙**

- 프롬프트/에이전트를 합치는 로직은 **집계 함수 내부의 한 지점에만** 둔다
- 화면·API 레이어는 "콘텐츠"라는 단일 개념만 다룬다. `prompts`와 `agents`를 각각 받아 화면에서 더하지 않는다
- 합산 지점에는 아래 주석을 남긴다

```ts
// 프롬프트 제거 시 이 블록에서 Prompt 관련 조회만 삭제하면 된다.
```

**적용 예시**

```ts
// src/lib/admin.ts
// 프롬프트 제거 시 이 블록에서 Prompt 관련 조회만 삭제하면 된다.
const RUN_ACTIONS = ["prompt_run", "agent_run"] as const;

async function collectContents(range) {
  const [prompts, agents] = await Promise.all([
    db.prompt.findMany({ where: { createdAt: range }, include: { author: true } }),
    db.agent.findMany({ where: { createdAt: range }, include: { author: true } }),
  ]);
  return [
    ...prompts.map((p) => ({ id: p.id, title: p.title, category: p.category, author: p.author, createdAt: p.createdAt })),
    ...agents.map((a) => ({ id: a.id, title: a.name, category: a.category, author: a.author, createdAt: a.createdAt })),
  ];
}
```

이후 모든 집계는 `collectContents()`의 결과만 사용한다.

---

## 3. 현재 코드베이스 상태 (조사 완료 — 재조사 불필요)

아래는 이미 확인된 사실이다. 작업 시 전제로 삼는다.

### 데이터 모델 (`prisma/schema.prisma`)

| 모델 | 비고 |
| --- | --- |
| `User` | `dept`, `lastActiveAt` 보유. `lastActiveAt`은 단일 컬럼 덮어쓰기 방식이라 접속 이력은 남지 않음 |
| `Prompt` | `likeCount`, `copyCount`, `runCount`, `category`, `authorId` |
| `Agent` | `likeCount`, `runCount`, `category`, `authorId`, `exampleTasks`. **`copyCount` 없음** |
| `Like` / `Save` | Prompt/Agent nullable dual-FK 패턴 |
| `AuditLog` | `userId`, `action`, `targetType`, `targetId`, `targetLabel`, `createdAt` |
| `UsageLog` | Claude API 호출 로그. `feature`는 `prompt_generate` / `agent_generate`만 존재 |
| `Category` | `name`, `order` |

### 이벤트 수집 현황

| 행동 | 현재 상태 |
| --- | --- |
| 에이전트 실행 | `POST /api/agents/[id]/run` → `runCount` 증가 + **AuditLog에 사용자 귀속 기록**. 정상 동작 |
| 프롬프트 실행 | 위와 동일 (`prompt_run`) |
| 프롬프트 복사 | `POST /api/prompts/[id]/copy` → `copyCount`만 증가. AuditLog 미기록 |
| 에이전트 복사 | **API 호출 없음.** `AgentBoard.tsx`의 `copyInstructions()`가 클립보드 복사만 수행 |
| 조회 | 수집 없음. `viewCount` 필드 없음 |
| 방문 | `getCurrentUser()`가 매 요청 `lastActiveAt` 갱신 |

### 집계 로직 (`src/lib/admin.ts`)

- `getDashboardStats()` — 활성 사용자를 **`UsageLog` 기준**으로 산출. AI 자동 생성 기능 사용자만 포함되는 문제가 있음 (Phase 1에서 수정)
- `collectPeriodTotals(gte, lt)` — `AuditLog`(run) + `Prompt` + `Agent` + `Like`를 조합해 부서별·개인별 집계. **이번 지표 체계의 기반이 되는 함수**
- `SCORE_WEIGHTS` — `runs` / `registrations` / `likes` 가중치
- `getLeaderboardStats(days)` — 기간 파라미터를 받아 집계

### 미사용 상태로 정의만 되어 있는 것

- `AuditAction.prompt_copy` — enum에 존재하고 `admin.ts`에 라벨도 있으나 어디서도 기록하지 않음
- `AuditAction.prompt_create` / `agent_create` 등 — 마찬가지로 미기록

---

## 4. 절대 하지 말 것

아래는 기획 단계에서 **의도적으로 제외**한 항목이다. "있으면 좋을 것 같다"는 판단으로 추가하지 않는다.

| 항목 | 사유 |
| --- | --- |
| 조회(view) 이벤트 수집 추가 | 관심과 활용을 구분하기 위해 의도적으로 제외 |
| 복사(copy) 집계 추가·복원 | 실행이 상위 행동. 중복 집계 방지 |
| `AuditAction.prompt_copy` 기록 구현 | 위와 동일 |
| **프롬프트 관련 코드 삭제** | **기획 확정 대기 중. 이번 범위 밖** |
| Git / GitHub 연동 등록 | 외부 실행분이 집계되지 않아 지표 체계와 충돌 |
| 시간 절감(time saved) 지표 | 신뢰도 미확보 |
| 개인 실명 랭킹 공개 노출 | 부서 단위 집계 원칙 |
| 방문(접속) 이력 테이블 신설 | 이번 범위 밖 |
| 디자인 시스템·컬러 변경 | 확정 시안 유지 |

---

## Phase 1 — 활성 사용자 정의 수정

가장 작지만 지표 정확도에 미치는 영향이 큰 변경이다. 먼저 처리한다.

### 목표

활성 사용자를 **"기간 내 1회 이상 실행(run)한 고유 사용자"** 로 재정의한다.

### 변경 내용

- `src/lib/admin.ts`의 `getDashboardStats()`에서 활성 사용자 산출 기준을 `UsageLog` → `AuditLog` (action ∈ `RUN_ACTIONS`)로 변경
  - `RUN_ACTIONS`에는 `prompt_run`, `agent_run`이 모두 포함되어야 한다
- 현재 7일로 하드코딩된 집계 구간을 파라미터로 받도록 변경 (`getDashboardStats(days: number)`)
- 대시보드 API 라우트(`/api/admin/dashboard`)가 기간 파라미터를 받아 전달하도록 수정
- 기본값은 30일

### 완료 기준

- 콘텐츠를 실행만 하고 AI 생성 기능은 쓰지 않은 사용자가 활성 사용자에 포함된다
- 기간 파라미터 7 / 30 / 90 각각에 대해 서로 다른 값이 산출된다
- 화면에 표시되는 활성 사용자 수치 옆에 기준 기간이 함께 노출된다

---

## Phase 2 — 좋아요 기능 제거

### 목표

좋아요 관련 기능과 지표를 전면 제거한다. 저장·댓글·신고는 유지한다.

### 변경 내용

**스키마**

- `Like` 모델 삭제
- `Prompt.likeCount` / `Agent.likeCount` 삭제
- `NotificationType`에서 `like` 제거 (`comment`만 남김)
- `User.likes` 관계 제거
- 마이그레이션 생성

**API**

- `/api/prompts/[id]/like`, `/api/agents/[id]/like` 라우트 삭제
- `/api/activity`에서 좋아요 관련 응답 제거
- 좋아요 알림 생성 로직 제거

**집계**

- `admin.ts`의 `collectPeriodTotals()`에서 `likes` 수집 제거
- `SCORE_WEIGHTS`를 `runs` / `registrations` 2항목으로 재조정 (권장: runs 60, registrations 40)
- `scoreOf()`, `DeptLeaderboardRow`, `PersonLeaderboardRow`에서 `likes` 필드 제거
- 개인 배지에서 `likes` 항목 제거

**UI**

- `PromptBoard.tsx`, `AgentBoard.tsx` 및 카드/상세 컴포넌트에서 좋아요 버튼·카운트 제거
- 관리자 콘텐츠 관리 화면의 좋아요 컬럼 제거

> 프롬프트 쪽 좋아요도 함께 제거한다. 프롬프트 기능 자체는 유지하되, 좋아요만 없앤다.

### 완료 기준

- `grep -ri "like" src/ prisma/` 결과에 좋아요 기능 잔재가 없다
- 빌드 및 시드 스크립트가 정상 동작한다
- 리더보드 점수가 실행·등록만으로 산출된다

---

## Phase 3 — 업무 카테고리 체계 확정

### 목표

콘텐츠 등록 시 업무 카테고리를 필수 선택으로 만들고, 카테고리를 6종으로 고정한다.

### 카테고리 (고정)

| name | order |
| --- | --- |
| 작성·요약 | 1 |
| 조사·리서치 | 2 |
| 분석 | 3 |
| 번역·검토 | 4 |
| 기획·아이디어 | 5 |
| 자동화·개발 | 6 |

### 변경 내용

- 시드에서 위 6종을 기본 카테고리로 생성
- 등록 API에서 `category` 미지정 시 400 반환
  - `POST /api/agents`, `POST /api/prompts` **양쪽 모두** 적용
  - 현재는 `"리서치"`를 기본값으로 대입하고 있으므로 이 동작을 제거한다
- 등록 폼에서 카테고리를 필수 선택 항목으로 변경. 기본 선택값 없이 미선택 상태로 시작
- AI 자동 생성 결과에도 카테고리가 포함되도록 하되, 사용자가 최종 확인·수정할 수 있게 한다

### 기존 데이터 처리

- 기존 콘텐츠의 카테고리 값이 6종에 없는 경우, 마이그레이션 또는 시드에서 가장 가까운 카테고리로 매핑한다
- 매핑 규칙은 재량이나, 매핑 결과를 로그로 남긴다

### 완료 기준

- 카테고리 없이 콘텐츠를 등록할 수 없다
- 기존 관리자 카테고리 관리 기능이 계속 동작한다
- DB의 모든 콘텐츠가 6종 중 하나에 속한다

---

## Phase 4 — 지표 집계 확장

### 목표

기획서 4장의 대시보드 블록에 필요한 집계 함수를 구현한다.

> 모든 함수는 2장의 **콘텐츠 집계 단일 진입점** 원칙을 따른다. 프롬프트와 에이전트를 합산하되, 합치는 지점을 한 곳으로 모은다.

### 4-1. 부서별 인원수 기준 데이터

- `Setting` 모델(key-value)을 활용해 부서별 인원수를 저장한다
  - 예: key = `dept_headcount`, value = `{ "영업1팀": 24, "기획팀": 12, ... }`
- 관리자 설정 화면에서 입력·수정 가능하게 한다
- 인원 대비 비율 계산 시 이 값을 분모로 사용한다
- **인원수가 등록되지 않은 부서는 비율을 표시하지 않고 절대값만 노출한다** (0으로 처리하지 않는다)

### 4-2. 소규모 부서 처리

- 인원수 10명 미만 부서는 부서별 목록에서 개별 표시하지 않는다
- 해당 부서의 수치는 전체 합계에는 포함하되, 목록에서는 `기타`로 묶거나 제외한다 (구현 방식은 재량)

### 4-3. 업무 카테고리별 집계

```
getCategoryStats(days: number)
  → 카테고리별 { 등록 수, 가져가기 수, 고유 사용자 수 }
```

- 등록 수: 프롬프트 + 에이전트 합산
- 가져가기 수: `AuditLog`(action ∈ `RUN_ACTIONS`)를 `targetId`로 콘텐츠에 조인해 `category`별 집계
  - `targetType`이 `"prompt"` / `"agent"`로 구분되어 있으므로 이를 이용한다

### 4-4. 확산 지표

```
getDiffusionStats(days: number)
  → 콘텐츠별 { 등록 부서, 실행 부서 수, 타 부서 실행 수 }
  → 부서별 { 자기 부서 콘텐츠를 활용한 타 부서 수, 타 부서 콘텐츠 가져가기 수 }
```

- `AuditLog.user.dept`(실행자 부서)와 콘텐츠 작성자의 `dept`(등록자 부서)를 비교해 산출한다
- 두 값이 다르면 "타 부서 가져가기"로 집계한다

### 4-5. 월별 추이

```
getMonthlyTrend(months: number)
  → 월별 { 신규 등록 수, 가져가기 수, 활성 사용자 수 }
```

### 완료 기준

- 각 함수가 기간 파라미터를 받아 동작한다
- 부서 필터 적용 시 해당 부서 기준으로 재집계된다
- 시드 데이터로 각 함수의 반환값을 확인할 수 있다
- 프롬프트/에이전트 합산 지점이 한 곳에 모여 있고 주석이 달려 있다

---

## Phase 5 — 대시보드 공개 전환

### 목표

대시보드를 관리자 콘솔에서 분리해 전 임직원이 볼 수 있게 한다.

### 변경 내용

- 대시보드 페이지를 `/admin/dashboard` → `/dashboard` (또는 메인 하위 탭)로 이동
- 해당 라우트의 관리자 권한 체크를 로그인 체크로 완화
- 개인 실명 랭킹(`individuals`, `powerUser`)은 **공개 화면에서 제외**한다. 부서 단위 집계만 노출
- 관리자 콘솔에는 개인 단위 데이터를 유지해도 무방하다
- 팀별 AI 구독 현황은 **별도 탭**으로 분리하고, `Setting`에 저장된 기준월을 화면에 표기한다

### 화면 구성 순서

```
현황 → 추이 → 업무유형 → 부서 확산 → 인기 콘텐츠
```

- 공통 필터: 기간(7 / 30 / 90일), 부서(전체 / 특정 부서)
- 인기 콘텐츠 블록에서는 프롬프트/에이전트를 구분 표시하되, 하나의 목록으로 합쳐 순위를 매긴다

### 참고

- `admin-dashboard-mockups/` 디렉터리의 기존 목업을 참고하되, 위 순서와 블록 구성을 우선한다

### 완료 기준

- 일반 사용자 계정으로 로그인해 대시보드를 볼 수 있다
- 공개 화면에 개인 이름이 노출되지 않는다
- 기간·부서 필터가 모든 블록에 반영된다

---

## Phase 6 — 시드 데이터 정비

### 목표

대시보드 검증이 가능한 수준의 목업 데이터를 생성한다.

### 요구사항

- 최소 8개 부서, 부서별 5~30명 규모로 인원 편차를 둔다 (소규모 부서 처리 검증용)
- 6개 카테고리에 콘텐츠가 고르게 분포하되, 일부 카테고리는 의도적으로 적게 둔다
- `AuditLog`의 실행 기록(`prompt_run`, `agent_run`)을 최근 90일에 걸쳐 분산 생성한다
- **타 부서 실행 케이스를 반드시 포함한다** (확산 지표 검증용)
- 부서별 인원수를 `Setting`에 함께 시드한다
- 인원수를 등록하지 않은 부서를 **1개 이상 남긴다** (비율 미표시 동작 검증용)

---

## 5. 검증 체크리스트

각 Phase 완료 후 아래를 확인한다.

**공통**

- [ ] `npm run build` 통과
- [ ] `npx prisma migrate dev` 정상 적용
- [ ] 시드 스크립트 정상 실행
- [ ] 로그인 → 메인 → 상세 → 실행 플로우 동작
- [ ] **프롬프트 기능이 정상 동작한다** (등록·조회·실행·복사)

**지표 정확성**

- [ ] 활성 사용자 = 기간 내 실행자 수와 일치하는가
- [ ] 기간 필터를 7 → 30 → 90으로 바꾸면 모든 수치가 함께 변하는가
- [ ] 부서 필터 적용 시 해당 부서 데이터만 남는가
- [ ] 인원수 미등록 부서에서 비율이 0%가 아닌 미표시로 나오는가
- [ ] 타 부서 가져가기 수가 실제 시드 데이터와 일치하는가
- [ ] 카테고리별 집계에 프롬프트와 에이전트가 모두 반영되는가

**제외 항목 확인**

- [ ] 조회수 관련 필드·UI가 추가되지 않았는가
- [ ] 복사 집계가 추가되지 않았는가
- [ ] 프롬프트 관련 코드가 삭제되지 않았는가
- [ ] 개인 실명이 공개 대시보드에 노출되지 않는가

---

## 6. 작업 순서 요약

```
Phase 1 (활성 사용자 정의)      — 소규모, 독립적
   ↓
Phase 2 (좋아요 제거)           — 중간, 집계 로직 연쇄
   ↓
Phase 3 (카테고리 필수화)       — 소규모
   ↓
Phase 4 (지표 집계 확장)        — 중간, 신규 함수
   ↓
Phase 5 (대시보드 공개 전환)    — 중간, UI 중심
   ↓
Phase 6 (시드 정비)             — 검증용
```

---

## 부록 · 향후 작업 예정 (착수하지 말 것)

기획 확정 시 별도 지시로 진행한다. 참고용으로만 기재한다.

**프롬프트 제거 및 에이전트 단일 체계 전환**

- `Prompt` 모델 삭제
- `Comment` / `Save` / `Report` / `Notification`의 dual-FK를 단일 FK(`agentId` 필수)로 단순화
  - `@@unique` 제약과 인덱스도 함께 정리 필요
- `AuditAction`에서 `prompt_*` 제거, `UsageLog.feature`에서 `prompt_generate` 제거
- `/api/prompts/**`, `/api/generate/prompt` 삭제
- `src/lib/prompts.ts` 삭제, `src/components/prompt/` 삭제
- 2장 원칙에 따라 작성된 집계 함수에서 Prompt 조회 블록만 제거

> 위 작업을 대비해, 이번 Phase들에서는 프롬프트 관련 로직을 **한 곳에 모아두는 것**을 우선한다.
