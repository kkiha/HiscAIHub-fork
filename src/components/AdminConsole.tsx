"use client";

/* 관리자 콘솔 — design-reference/prompthub-admin.html 이식. 9단계: 전 섹션 실 DB 연동. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminLogout } from "@/app/actions/auth";
import { CATEGORY_GUIDE } from "@/lib/categories";

const CATEGORY_DESC = new Map<string, string>(
  CATEGORY_GUIDE.map((category) => [category.value, category.desc]),
);

const ICON: Record<string, string> = {
  content: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>`,
  reports: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  usage: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>`,
  audit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`,
  bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`,
  sUsers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
  sPlus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
  sZap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`,
  sClock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
};

function Ic({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: ICON[name] }} />;
}

type Section = "content" | "reports" | "users" | "usage" | "audit" | "settings";

const PAGE: Record<Section, [string, string]> = {
  content: ["콘텐츠 관리", "등록된 프롬프트·에이전트를 검수하고 관리해요."],
  reports: ["신고 처리", "사용자가 신고한 콘텐츠를 확인하고 처리해요."],
  users: ["사용자·권한", "사용자 역할을 관리해요. 계정은 회사 SSO가 관리해요."],
  usage: ["사용량·비용", "Claude 호출량과 비용을 모니터링해요."],
  audit: ["감사 로그", "생성·실행 이력을 조회하고 내보내요."],
  settings: ["설정", "카테고리·필터·한도 등 서비스 정책을 설정해요."],
};

// ---------- 서버 응답 DTO ----------
type ContentRow = { id: string; type: "프롬프트" | "에이전트"; title: string; author: string; dept: string; metric: string; status: "pub" | "hidden" | "flag"; official: boolean };
type ReportRow = { id: string; type: "프롬프트" | "에이전트"; contentType: "prompt" | "agent"; contentId: string; title: string; reason: string; reporterCount: number; date: string };
type UserRow = { id: string; name: string; dept: string; email: string; posts: number; last: string; role: "admin" | "mod" | "user" };
type UsageData = {
  daily: { label: string; count: number; cost: number }[];
  featureBreakdown: { feature: string; label: string; count: number; cost: number }[];
  topUsers: { name: string; dept: string; count: number }[];
  totalCalls: number;
  totalCost: number;
  perUserLimit: number;
};
type AuditRow = { id: string; time: string; user: string; action: string; target: string; files: string; status: string };
type CategoryRow = { id: string; name: string };
const STATUS: Record<string, [string, string]> = { pub: ["공개", "pub"], hidden: ["숨김", "hidden"], flag: ["신고됨", "flag"] };
const ROLE: Record<string, [string, string]> = { admin: ["관리자", "role-admin"], mod: ["운영자", "role-mod"], user: ["일반", "role-user"] };

const NAV: { sec: Section; label: string; group: string; badge?: boolean }[] = [
  { sec: "content", label: "콘텐츠 관리", group: "운영" },
  { sec: "reports", label: "신고 처리", group: "운영", badge: true },
  { sec: "users", label: "사용자·권한", group: "관리" },
  { sec: "usage", label: "사용량·비용", group: "관리" },
  { sec: "audit", label: "감사 로그", group: "관리" },
  { sec: "settings", label: "설정", group: "관리" },
];

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json();
}

export default function AdminConsole() {
  // 대시보드·리더보드는 전 임직원 공개 화면(메인 대시보드 탭)으로 옮겨져 여기 없다(기획서 4.7).
  const [sec, setSec] = useState<Section>("content");
  const [toast, setToast] = useState("");

  const [content, setContent] = useState<ContentRow[] | null>(null);
  const [cFilter, setCFilter] = useState("");
  const [cType, setCType] = useState("");
  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [uFilter, setUFilter] = useState("");
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);
  const [auditAction, setAuditAction] = useState("");
  const [auditDays, setAuditDays] = useState("");
  const [cats, setCats] = useState<CategoryRow[] | null>(null);
  const [keywords, setKeywords] = useState<string[] | null>(null);
  const [regWarning, setRegWarning] = useState("");
  const [globalLimit, setGlobalLimit] = useState(5000);

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(() => setToast(""), 2200);
  }

  // 대기 신고 배지(사이드바)는 항상 최신으로 유지
  useEffect(() => {
    getJson<{ reports: ReportRow[] }>("/api/admin/reports").then((d) => setPendingCount(d.reports.length));
  }, []);

  useEffect(() => {
    if (sec === "content") {
      getJson<{ content: ContentRow[] }>("/api/admin/content").then((d) => setContent(d.content));
    } else if (sec === "reports") {
      getJson<{ reports: ReportRow[] }>("/api/admin/reports").then((d) => { setReports(d.reports); setPendingCount(d.reports.length); });
    } else if (sec === "users") {
      getJson<{ users: UserRow[] }>("/api/admin/users").then((d) => setUsers(d.users));
    } else if (sec === "usage") {
      getJson<UsageData>("/api/admin/usage").then(setUsage);
    } else if (sec === "audit") {
      loadAudit();
    } else if (sec === "settings") {
      getJson<{ categories: CategoryRow[] }>("/api/admin/categories").then((d) => setCats(d.categories));
      getJson<{ sensitiveKeywords: string[]; registrationWarning: string; globalDailyCallLimit: number }>("/api/admin/settings").then((d) => {
        setKeywords(d.sensitiveKeywords);
        setRegWarning(d.registrationWarning);
        setGlobalLimit(d.globalDailyCallLimit);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sec]);

  function loadAudit() {
    const qs = new URLSearchParams();
    if (auditAction) qs.set("action", auditAction);
    if (auditDays) qs.set("days", auditDays);
    getJson<{ logs: AuditRow[] }>(`/api/admin/audit?${qs.toString()}`).then((d) => setAudit(d.logs));
  }
  useEffect(() => {
    if (sec === "audit") loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditAction, auditDays]);

  const groups = Array.from(new Set(NAV.map((n) => n.group)));

  return (
    <div className="admin">
      {/* 사이드바 */}
      <aside className="sidebar">
        <div className="side-logo">
          <div className="logo-sq"><Ic name="bulb" /></div>
          <div className="side-logo-txt">AI 활용 허브<br /><span className="sub">관리자 콘솔</span></div>
        </div>
        <nav className="side-nav">
          {groups.map((g) => (
            <div key={g}>
              <div className="side-sec">{g}</div>
              {NAV.filter((n) => n.group === g).map((n) => (
                <button key={n.sec} className={`side-item ${sec === n.sec ? "on" : ""}`} onClick={() => setSec(n.sec)}>
                  <Ic name={n.sec} /> {n.label}
                  {n.badge && pendingCount > 0 ? <span className="side-badge">{pendingCount}</span> : null}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <Link href="/"><Ic name="back" /> 서비스로 돌아가기</Link>
          <form action={adminLogout}>
            <button type="submit"><Ic name="x" /> 로그아웃</button>
          </form>
          <div className="admin-user"><div className="admin-ava">관</div><div><div className="nm">관리자</div><div className="rl">임시 계정 · admin</div></div></div>
        </div>
      </aside>

      {/* 메인 */}
      <div className="main">
        <div className="admin-topbar">
          <div><h1>{PAGE[sec][0]}</h1><div className="sub">{PAGE[sec][1]}</div></div>
          <div className="top-right">
            {sec === "audit" ? (
              <a
                className="pill-btn"
                href={`/api/admin/audit?format=csv${auditAction ? `&action=${auditAction}` : ""}${auditDays ? `&days=${auditDays}` : ""}`}
              >
                <Ic name="download" /> 로그 내보내기
              </a>
            ) : null}
          </div>
        </div>

        <div className="admin-content">
          {sec === "content" && content && (
            <ContentSection
              rows={content.filter((c) => (!cFilter || (c.title + c.author).toLowerCase().includes(cFilter)) && (!cType || c.type === cType))}
              onSearch={(v) => setCFilter(v.toLowerCase())}
              onType={setCType}
              onToggleHide={async (row) => {
                const res = await fetch("/api/admin/content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: row.type === "프롬프트" ? "prompt" : "agent", id: row.id, action: "toggle-hide" }) });
                const data = await res.json();
                setContent((cs) => cs!.map((c) => (c.id === row.id ? { ...c, status: data.status } : c)));
                showToast(data.status === "hidden" ? "숨김 처리했어요" : "다시 공개했어요");
              }}
              onOfficial={async (row) => {
                const res = await fetch("/api/admin/content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: row.type === "프롬프트" ? "prompt" : "agent", id: row.id, action: "toggle-official" }) });
                const data = await res.json();
                setContent((cs) => cs!.map((c) => (c.id === row.id ? { ...c, official: data.official } : c)));
                showToast(data.official ? "공식 콘텐츠로 지정했어요" : "공식 지정을 해제했어요");
              }}
              onDelete={async (row) => {
                if (!confirm("이 콘텐츠를 삭제할까요? 되돌릴 수 없어요.")) return;
                await fetch("/api/admin/content", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: row.type === "프롬프트" ? "prompt" : "agent", id: row.id }) });
                setContent((cs) => cs!.filter((c) => c.id !== row.id));
                showToast("삭제했어요");
              }}
            />
          )}
          {sec === "reports" && reports && (
            <ReportsSection
              reports={reports}
              onResolve={async (r, action) => {
                if (action === "delete" && !confirm("신고된 콘텐츠를 삭제할까요?")) return;
                await fetch(`/api/admin/reports/${r.id}/resolve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
                setReports((rs) => rs!.filter((x) => x.id !== r.id));
                setPendingCount((c) => Math.max(0, c - 1));
                showToast({ keep: "유지 처리했어요", hide: "숨김 처리했어요", delete: "삭제 처리했어요" }[action]);
              }}
            />
          )}
          {sec === "users" && users && (
            <UsersSection
              rows={users.filter((u) => !uFilter || (u.name + u.dept).toLowerCase().includes(uFilter))}
              onSearch={(v) => setUFilter(v.toLowerCase())}
              onRole={async (u, role) => {
                const res = await fetch(`/api/admin/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
                const data = await res.json();
                setUsers((us) => us!.map((x) => (x.id === u.id ? { ...x, role } : x)));
                showToast(`${data.name}님을 ${ROLE[role][0]}(으)로 변경했어요`);
              }}
            />
          )}
          {sec === "usage" && usage && (
            <UsageSection
              data={usage}
              onSave={async (limit) => {
                await fetch("/api/admin/usage", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ limit }) });
                showToast("한도를 저장했어요");
              }}
            />
          )}
          {sec === "audit" && audit && (
            <AuditSection rows={audit} action={auditAction} days={auditDays} onAction={setAuditAction} onDays={setAuditDays} />
          )}
          {sec === "settings" && cats && keywords && (
            <SettingsSection
              cats={cats}
              keywords={keywords}
              regWarning={regWarning}
              globalLimit={globalLimit}
              onAddCat={async () => {
                const v = prompt("추가할 카테고리 이름");
                if (!v || !v.trim()) return;
                const res = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: v.trim() }) });
                const data = await res.json();
                setCats(data.categories);
              }}
              onRmCat={async (id) => {
                await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
                setCats((c) => c!.filter((x) => x.id !== id));
              }}
              onAddKw={() => { const v = prompt("추가할 민감정보 키워드"); if (v && v.trim()) setKeywords((k) => [...k!, v.trim()]); }}
              onRmKw={(i) => setKeywords((k) => k!.filter((_, idx) => idx !== i))}
              onRegWarningChange={setRegWarning}
              onGlobalLimitChange={setGlobalLimit}
              onSave={async () => {
                await fetch("/api/admin/settings", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sensitiveKeywords: keywords, registrationWarning: regWarning, globalDailyCallLimit: globalLimit }),
                });
                showToast("설정을 저장했어요");
              }}
            />
          )}
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--text-1)", color: "#fff", fontSize: 12.5, padding: "10px 16px", borderRadius: 20, opacity: toast ? 1 : 0, transition: "opacity .2s", pointerEvents: "none", zIndex: 100 }}>
        {toast}
      </div>
    </div>
  );
}

function ContentSection({ rows, onSearch, onType, onToggleHide, onOfficial, onDelete }: { rows: ContentRow[]; onSearch: (v: string) => void; onType: (v: string) => void; onToggleHide: (row: ContentRow) => void; onOfficial: (row: ContentRow) => void; onDelete: (row: ContentRow) => void }) {
  return (
    <>
      <div className="toolbar">
        <div className="search"><Ic name="search" /><input placeholder="제목·작성자 검색" onChange={(e) => onSearch(e.target.value)} /></div>
        <select className="sel" onChange={(e) => onType(e.target.value)}><option value="">유형 전체</option><option value="프롬프트">프롬프트</option><option value="에이전트">에이전트</option></select>
      </div>
      <table className="tbl"><thead><tr><th>제목</th><th>유형</th><th>작성자</th><th>지표</th><th>상태</th><th style={{ textAlign: "right" }}>관리</th></tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={6}><div className="empty-state">해당하는 콘텐츠가 없어요.</div></td></tr>
          ) : rows.map((c) => (
            <tr key={c.id}>
              <td><div className="cell-title">{c.title} {c.official ? <span className="badge official">공식</span> : null}</div></td>
              <td><span className={`type-tag ${c.type === "프롬프트" ? "p" : "a"}`}>{c.type}</span></td>
              <td>{c.author}<div className="cell-sub">{c.dept}</div></td>
              <td style={{ color: "var(--text-2)" }}>{c.metric}</td>
              <td><span className={`badge ${STATUS[c.status][1]}`}>{STATUS[c.status][0]}</span></td>
              <td><div className="row-actions">
                <button className="txt-btn" onClick={() => onOfficial(c)}>{c.official ? "공식 해제" : "공식 지정"}</button>
                <button className="txt-btn" onClick={() => onToggleHide(c)}>{c.status === "hidden" ? "공개" : "숨김"}</button>
                <button className="ico-btn del" onClick={() => onDelete(c)} title="삭제"><Ic name="trash" /></button>
              </div></td>
            </tr>
          ))}
        </tbody></table>
    </>
  );
}

function ReportsSection({ reports, onResolve }: { reports: ReportRow[]; onResolve: (r: ReportRow, action: "keep" | "hide" | "delete") => void }) {
  return (
    <>
      <h2 className="sec-sub">처리 대기 <span style={{ color: "var(--org)" }}>{reports.length}</span>건</h2>
      {reports.length === 0 ? (
        <div className="empty-state">처리할 신고가 없어요. 깔끔하네요.</div>
      ) : reports.map((r) => (
        <div className="report" key={r.id}>
          <div className="report-top"><span className={`type-tag ${r.type === "프롬프트" ? "p" : "a"}`}>{r.type}</span><div className="rt-title">{r.title}</div></div>
          <div className="report-reason">{r.reason}</div>
          <div className="report-foot">
            <span className="report-meta">신고 {r.reporterCount}건 · {r.date}</span>
            <div className="report-acts">
              <button className="txt-btn ok" onClick={() => onResolve(r, "keep")}>유지</button>
              <button className="txt-btn" onClick={() => onResolve(r, "hide")}>숨김</button>
              <button className="txt-btn del" onClick={() => onResolve(r, "delete")}>삭제</button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function UsersSection({ rows, onSearch, onRole }: { rows: UserRow[]; onSearch: (v: string) => void; onRole: (u: UserRow, role: "admin" | "mod" | "user") => void }) {
  return (
    <>
      <div className="toolbar">
        <div className="search"><Ic name="search" /><input placeholder="이름·부서 검색" onChange={(e) => onSearch(e.target.value)} /></div>
      </div>
      <table className="tbl"><thead><tr><th>이름</th><th>부서</th><th>이메일</th><th>작성</th><th>최근 활동</th><th>역할</th></tr></thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <td><div className="cell-title">{u.name}</div></td>
              <td>{u.dept}</td>
              <td style={{ color: "var(--text-2)" }}>{u.email}</td>
              <td>{u.posts}건</td>
              <td style={{ color: "var(--text-3)" }}>{u.last}</td>
              <td><select className="sel" style={{ padding: "4px 8px" }} value={u.role} onChange={(e) => onRole(u, e.target.value as "admin" | "mod" | "user")}>
                <option value="admin">관리자</option><option value="mod">운영자</option><option value="user">일반</option>
              </select></td>
            </tr>
          ))}
        </tbody></table>
    </>
  );
}

function UsageSection({ data, onSave }: { data: UsageData; onSave: (limit: number) => void }) {
  const [limitInput, setLimitInput] = useState(String(data.perUserLimit));
  const max = Math.max(1, ...data.daily.map((d) => d.count));
  const dotColors = ["var(--org)", "#3F6C99", "var(--org-muted)"];
  return (
    <>
      <div className="cols" style={{ marginBottom: 16 }}>
        <div className="panel" style={{ gridColumn: "span 2" }}>
          <div className="panel-head"><h3>일별 Claude 호출 (최근 7일)</h3><span style={{ fontSize: 12, color: "var(--text-3)" }}>합계 {data.totalCalls.toLocaleString()}회 · 예상 ${data.totalCost.toFixed(2)}</span></div>
          <div className="chart">
            {data.daily.map((d, i) => {
              const h = Math.round((d.count / max) * 130) + 8;
              const soft = d.count > max * 0.85 ? "" : " soft";
              return <div className="bar-col" key={i}><div className={`bar${soft}`} style={{ height: h }} title={`${d.count}회`} /><div className="bar-lbl">{d.label}</div></div>;
            })}
          </div>
        </div>
      </div>
      <div className="cols">
        <div className="panel">
          <div className="panel-head"><h3>기능별 사용량</h3></div>
          {data.featureBreakdown.length === 0 ? (
            <div className="empty-state">아직 사용 기록이 없어요.</div>
          ) : data.featureBreakdown.map((f, i) => (
            <div className="brk" key={f.feature}><span className="dot" style={{ background: dotColors[i % 3] }} /><span className="bn">{f.label}</span><span className="bv">{f.count}회 · ${f.cost.toFixed(2)}</span></div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-head"><h3>사용량 상위 사용자</h3></div>
          {data.topUsers.length === 0 ? (
            <div className="empty-state">아직 사용 기록이 없어요.</div>
          ) : data.topUsers.map((u, i) => (
            <div className="lrow" key={i}><span className="rank">{i + 1}</span><div className="grow"><div className="t">{u.name} · {u.dept}</div></div><span className="val">{u.count}회</span></div>
          ))}
        </div>
      </div>
      <div className="set-block" style={{ marginTop: 16 }}>
        <h3>사용자별 호출 한도</h3>
        <div className="desc">한 사용자가 하루에 보낼 수 있는 Claude 호출 수를 제한해요. 비용 급증을 막는 안전장치예요.</div>
        <div className="set-row">
          <input className="set-input" value={limitInput} onChange={(e) => setLimitInput(e.target.value)} />
          <span className="unit">회 / 일</span>
          <button className="pill-btn primary" style={{ marginLeft: 8 }} onClick={() => onSave(Number(limitInput) || data.perUserLimit)}>저장</button>
        </div>
      </div>
    </>
  );
}

function AuditSection({ rows, action, days, onAction, onDays }: { rows: AuditRow[]; action: string; days: string; onAction: (v: string) => void; onDays: (v: string) => void }) {
  return (
    <>
      <div className="toolbar">
        <select className="sel" value={action} onChange={(e) => onAction(e.target.value)}>
          <option value="">작업 전체</option>
          <option value="prompt_generate">프롬프트 만들기</option>
          <option value="agent_generate">에이전트 만들기</option>
          <option value="agent_run">에이전트 실행</option>
        </select>
        <select className="sel" value={days} onChange={(e) => onDays(e.target.value)}>
          <option value="">전체</option>
          <option value="7">최근 7일</option>
          <option value="30">최근 30일</option>
        </select>
      </div>
      <table className="tbl"><thead><tr><th>시간</th><th>사용자</th><th>작업</th><th>대상</th><th>파일</th><th>상태</th></tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={6}><div className="empty-state">기록이 없어요.</div></td></tr>
          ) : rows.map((r) => (
            <tr key={r.id}>
              <td style={{ color: "var(--text-2)" }}>{r.time}</td>
              <td><div className="cell-title">{r.user}</div></td>
              <td>{r.action}</td><td>{r.target}</td>
              <td style={{ color: "var(--text-3)" }}>{r.files}</td>
              <td><span className={`badge ${r.status === "성공" ? "pub" : "flag"}`}>{r.status}</span></td>
            </tr>
          ))}
        </tbody></table>
    </>
  );
}

function SettingsSection({
  cats, keywords, regWarning, globalLimit,
  onAddCat, onRmCat, onAddKw, onRmKw, onRegWarningChange, onGlobalLimitChange, onSave,
}: {
  cats: CategoryRow[]; keywords: string[]; regWarning: string; globalLimit: number;
  onAddCat: () => void; onRmCat: (id: string) => void; onAddKw: () => void; onRmKw: (i: number) => void;
  onRegWarningChange: (v: string) => void; onGlobalLimitChange: (v: number) => void; onSave: () => void;
}) {
  return (
    <>
      <div className="set-block">
        <h3>카테고리 관리</h3>
        <div className="desc">
          프롬프트·에이전트 등록 시 선택할 수 있는 카테고리예요.
          <br />새 카테고리는 기존 5종과 산출물 기준으로 겹치지 않을 때만 추가해 주세요.
        </div>
        <div className="chips">
          {cats.map((c) => {
            const desc = CATEGORY_DESC.get(c.name);
            return (
              <span className="chip" key={c.id}>
                <span style={{ display: "inline-flex", flexDirection: "column", gap: 1 }}>
                  <span>{c.name}</span>
                  {desc && <span style={{ color: "var(--text-3)", fontSize: 10 }}>{desc}</span>}
                </span>
                <button className="cx" onClick={() => onRmCat(c.id)}><Ic name="x" /></button>
              </span>
            );
          })}
          <button className="chip-add" onClick={onAddCat}>+ 추가</button>
        </div>
      </div>
      <div className="set-block">
        <h3>민감정보 필터 키워드</h3>
        <div className="desc">등록·실행 시 이 키워드가 포함되면 자동으로 경고하거나 검수 대상으로 표시해요. 금융권 민감정보 보호를 위한 장치예요.</div>
        <div className="chips">
          {keywords.map((k, i) => <span className="chip danger" key={i}>{k}<button className="cx" onClick={() => onRmKw(i)}><Ic name="x" /></button></span>)}
          <button className="chip-add" onClick={onAddKw}>+ 추가</button>
        </div>
      </div>
      <div className="set-block">
        <h3>등록 시 경고 문구</h3>
        <div className="desc">사용자가 프롬프트·에이전트를 등록할 때 상단에 보여줄 안내 문구예요.</div>
        <textarea className="set-input" rows={2} value={regWarning} onChange={(e) => onRegWarningChange(e.target.value)} />
      </div>
      <div className="set-block">
        <h3>전역 호출 한도</h3>
        <div className="desc">서비스 전체가 하루에 보낼 수 있는 Claude 호출 상한이에요.</div>
        <div className="set-row"><input className="set-input" value={globalLimit} onChange={(e) => onGlobalLimitChange(Number(e.target.value) || 0)} /><span className="unit">회 / 일</span></div>
      </div>
      <div className="save-bar"><button className="pill-btn primary" onClick={onSave}><Ic name="check" /> 설정 저장</button></div>
    </>
  );
}
