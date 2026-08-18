# AI 공유 허브 규칙
- 디자인은 design-reference 의 세 HTML이 정답. 임의 변경 금지.
- 포인트 컬러 오렌지 #D96A28, 미니멀. 과한 색/그림자 금지.
- LLM·외부 API는 반드시 백엔드 경유. API 키를 프런트에 두지 말 것.
- 임직원 인증은 @hanwha.com Azure AD SSO만. 자체 비밀번호 저장 금지.
- 관리자 인증은 임시로 admin/admin (env: ADMIN_ID, ADMIN_PW). 임직원 인증과 분리.
- 저장(Save)은 비공개: 집계·알림 없음.
- DB 접속·비밀·키는 전부 .env. 코드에 하드코딩 금지.
- 큰 변경 전 계획을 먼저 제시하고 승인받을 것.
- 명령: npm run dev / npm run build / npx prisma migrate dev / npm run db:seed