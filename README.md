# AI 공유 허브 (Hisc AI Hub)

한화 임직원이 업무에 활용하는 **프롬프트와 AI 에이전트를 공유·실행**하고, 그 활용 현황을 **전 임직원이 볼 수 있게** 하는 사내 플랫폼이다.

현재 단계는 **PoC(개념 검증용 시제품)** 이며, 실제 운영 시스템이 아니다.

- 기획 문서: [`docs/platform_proposal.md`](docs/platform_proposal.md)
- 개발 작업 지시서: [`docs/INSTRUCTIONS.md`](docs/INSTRUCTIONS.md)

---

## 이 프로젝트가 답하려는 3가지 질문

| # | 질문 | 관점 |
| - | --- | --- |
| 1 | 얼마나 쓰이는가 | 활성화 |
| 2 | 어떤 업무에 쓰이는가 | 업무유형 |
| 3 | 어디까지 퍼지는가 | 부서 확산 |

> 기능을 더하는 것이 아니라, **활동이 기록되는 구조**로 전환하는 것이 이번 고도화의 핵심이다.

---

## 활용 현황 대시보드

전 임직원이 로그인 후 `/dashboard`에서 확인한다. 다섯 블록으로 구성된다.

| 블록 | 표시 내용 |
| --- | --- |
| **01 현황** | 전체 등록 콘텐츠 수 · 활성 사용자 수 · 참여 부서 수 · 전체 가져가기 수 (증감률 병기) |
| **02 추이** | 최근 6개월 월별 등록·가져가기·활성 사용자 |
| **03 업무유형** | 업무 카테고리별 가져가기 분포 |
| **04 부서 확산** | 부서별 활용 현황, 타 부서 활용, 부서 간 확산 콘텐츠 |
| **05 인기 콘텐츠** | 가져가기 상위 콘텐츠 |

공통 필터: 기간(7 / 30 / 90일) · 부서
별도 탭: AI 구독 현황 (월 1회 수동 갱신)

---

## 지표 정의

상세 내용은 [기획 문서](docs/platform_proposal.md) 3장 참고.

| 항목 | 정의 |
| --- | --- |
| **가져가기** | Claude로 실행. 복사·조회는 집계하지 않음 |
| **활성 사용자** | 선택한 기간 내 1회 이상 가져간 사용자. 대표값은 30일 기준 |
| **등록** | 신규 프롬프트·에이전트 등록 |
| **부서 비교** | 절대 건수와 인원 대비 비율을 함께 표시 |
| **소규모 부서** | 인원 10명 미만은 개별 표시하지 않고 `기타`로 합산 |
| **개인 정보** | 공개 화면에 개인 실명을 노출하지 않음 |

**업무 카테고리 (등록 시 필수 선택)**

작성·요약 / 조사·리서치 / 분석 / 번역·검토 / 기획·아이디어 / 자동화·개발

---

## 브랜치 안내

| 브랜치 | 용도 | DB |
| --- | --- | --- |
| `main` | 고도화 이전 상태 | PostgreSQL |
| `feature/metrics-overhaul` | **지표 체계 고도화 (기준 브랜치)** | PostgreSQL |
| `local-sqlite-demo` | 로컬 화면 확인 전용 | SQLite |

`local-sqlite-demo`는 Docker 없이 화면을 보기 위한 임시 브랜치다. 스키마가 다르므로 병합 대상이 아니다.

---

## 실행 방법

### 1. 설치 없이 화면만 보기

`safe-demo/login.html`을 Chrome으로 연다. Node·Docker·인터넷 연결이 필요 없다.

> ⚠️ `safe-demo`는 아직 고도화 이전 화면이다. 좋아요·구 카테고리가 남아 있으며, 신규 대시보드는 포함되어 있지 않다.

### 2. 앱 실행 (PostgreSQL)

```bash
docker compose up -d
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

### 3. 앱 실행 (SQLite · Docker 없는 환경)

```bash
git checkout local-sqlite-demo
cp .env.local.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

접속: `http://localhost:3000/login`

| 구분 | 계정 |
| --- | --- |
| 임직원 | `202502035@hanwha.com` / `.env`의 `EMPLOYEE_DEV_PASSWORD` |
| 관리자 | `.env`의 `ADMIN_ID` / `ADMIN_PW` |

`ANTHROPIC_API_KEY`가 없어도 실행된다. AI 자동 생성 기능만 비활성화된다.

---

## 사내망 환경 참고

회사 PC에서 설치가 막히는 경우가 있다.

**PowerShell에서 `npm` 실행 불가**

```powershell
npm.cmd install    # .ps1 대신 .cmd 사용
```

**`SELF_SIGNED_CERT_IN_CHAIN` 오류**

사내 보안 장비가 HTTPS를 재서명하기 때문이다. Windows 인증서를 npm에 등록한다.

```powershell
$out = "$HOME\corp-ca.pem"
Get-ChildItem Cert:\LocalMachine\Root | ForEach-Object {
  "-----BEGIN CERTIFICATE-----"
  [Convert]::ToBase64String($_.RawData, 'InsertLineBreaks')
  "-----END CERTIFICATE-----"
} | Set-Content -Encoding ascii $out

npm.cmd config set cafile $out
$env:NODE_EXTRA_CA_CERTS = $out
```

---

## 저장소 구조

```text
HiscAIHub-fork/
├─ docs/                       # 기획 문서 · 작업 지시서
├─ src/                        # Next.js 애플리케이션
│  ├─ app/dashboard/           # 전 임직원 공개 대시보드
│  ├─ app/admin/               # 관리자 콘솔
│  └─ lib/admin.ts             # 지표 집계 로직
├─ prisma/                     # DB 스키마 · 마이그레이션 · 시드
├─ safe-demo/                  # 설치 없이 실행하는 정적 데모
├─ design-reference/           # 디자인 기준 원본 HTML
├─ admin-dashboard-mockups/    # 관리자 화면 검토 자료
├─ AGENTS.md                   # 작업 규칙
└─ CLAUDE.md                   # 작업 규칙
```

---

## 이번 PoC로 판단할 수 없는 사항

- Azure AD SSO 실제 인증 및 권한 관리
- 동시 사용자 수에 따른 성능·안정성
- 실제 데이터 저장·백업·복구
- LLM 응답 품질 및 처리 시간
- 실제 사용량·비용·부서별 통계 (현재는 모두 시연용 목업 데이터)
- 개인정보 및 사내 정보 운영 보안 심사

---

## 프로젝트 기본 원칙

- 디자인 기준은 `design-reference/`의 세 HTML이며, 포인트 색상은 오렌지 `#D96A28`이다.
- LLM과 외부 API는 반드시 백엔드를 거친다.
- 임직원 인증과 관리자 인증은 분리한다.
- 저장(Save)은 비공개이며 집계·알림 대상이 아니다.
- 대시보드는 부서 단위로 집계하며, 순위 경쟁이 아닌 활용 현황 파악을 목적으로 한다.
- DB 접속 정보, 비밀정보, API 키는 코드에 하드코딩하지 않는다.

---

## 향후 검토 항목

| 항목 | 도입 조건 |
| --- | --- |
| 프롬프트 제거 · 에이전트 단일 체계 | 기획 확정 후 |
| 가져가기에 복사 포함 | 실행 지표 안정화 후 |
| Git 연동 등록 | 실행 현황 파악 방식 정리 후 |
| 시간 절감 지표 | 객관식 수집 데이터 축적 후 |
| 부서 × 업무유형 Heatmap | 운영 데이터 확보 후 |
