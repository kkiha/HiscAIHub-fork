"use client";

import { useState } from "react";
import {
  BulbIcon,
  DocIcon,
  BotIcon,
  SearchIcon,
  SparklesIcon,
  PlusIcon,
  GridIcon,
  TrophyIcon,
  BookmarkIcon,
} from "@/components/icons";
import { logout } from "@/app/actions/auth";
import PromptBoard from "@/components/prompt/PromptBoard";
import ActivityFeed from "@/components/prompt/ActivityFeed";
import AgentBoard from "@/components/agent/AgentBoard";
import type { PromptDTO } from "@/lib/prompts";
import type { AgentDTO } from "@/lib/agents";

type Mode = "prompt" | "agent";

export type ShellUser = { name: string; dept: string; email: string };

type Tab = { id: string; label: string; icon: React.ReactNode };

// 데모 TABS 구조 이식 (전체/인기/저장/내 것)
const TABS: Record<Mode, Tab[]> = {
  prompt: [
    { id: "home", label: "전체", icon: <GridIcon size={15} /> },
    { id: "popular", label: "인기", icon: <TrophyIcon size={15} /> },
    { id: "saved", label: "저장", icon: <BookmarkIcon size={15} /> },
    { id: "mine", label: "내 프롬프트", icon: <DocIcon size={15} /> },
  ],
  agent: [
    { id: "a-home", label: "전체", icon: <GridIcon size={15} /> },
    { id: "a-popular", label: "인기", icon: <TrophyIcon size={15} /> },
    { id: "a-saved", label: "저장", icon: <BookmarkIcon size={15} /> },
    { id: "a-mine", label: "내 에이전트", icon: <BotIcon size={15} /> },
  ],
};

const HEADERS: Record<string, { h: string; p: string }> = {
  home: { h: "전체 프롬프트", p: "임직원이 공유한 프롬프트를 둘러보세요." },
  popular: { h: "인기 프롬프트", p: "이번 주 가장 주목받은 프롬프트 3가지예요." },
  saved: { h: "저장한 프롬프트", p: "저장 버튼을 누른 프롬프트만 모여요. 저장 내역은 나만 볼 수 있어요." },
  mine: { h: "내 프롬프트", p: "내가 작성한 프롬프트예요. 수정하거나 삭제할 수 있어요." },
  "a-home": { h: "에이전트", p: "임직원이 만들어 공유한 에이전트를 둘러보세요. 클릭하면 바로 실행할 수 있어요." },
  "a-popular": { h: "인기 에이전트", p: "이번 주 가장 많이 쓰인 에이전트예요." },
  "a-saved": { h: "저장한 에이전트", p: "저장 버튼을 누른 에이전트만 모여요. 저장 내역은 나만 볼 수 있어요." },
  "a-mine": { h: "내 에이전트", p: "내가 만든 에이전트예요. 수정하거나 삭제할 수 있어요." },
  activity: { h: "활동", p: "내 콘텐츠에 달린 댓글 알림을 모아봤어요." },
};

export default function AppShell({
  user,
  initialPrompts,
  initialAgents,
}: {
  user: ShellUser;
  initialPrompts: PromptDTO[];
  initialAgents: AgentDTO[];
}) {
  const [mode, setMode] = useState<Mode>("prompt");
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [promptRegisterOpen, setPromptRegisterOpen] = useState(false);
  const [agentRegisterOpen, setAgentRegisterOpen] = useState(false);
  const [promptCreateOpen, setPromptCreateOpen] = useState(false);
  const [agentCreateOpen, setAgentCreateOpen] = useState(false);
  const [openPromptId, setOpenPromptId] = useState<string | null>(null);
  const [openAgentId, setOpenAgentId] = useState<string | null>(null);

  const displayName = user.name || "임직원";
  const initial = displayName.charAt(0) || "H";

  function switchMode(next: Mode) {
    setMode(next);
    setTab(next === "agent" ? "a-home" : "home");
  }

  const isAgent = mode === "agent";
  const isActivity = tab === "activity";
  const header = HEADERS[tab];

  return (
    <>
      {/* 상단바 */}
      <div className="topbar">
        <div className="logo">
          <div className="logo-sq">
            <BulbIcon size={13} stroke="#fff" />
          </div>
          AI 공유 허브 <span className="logo-sub">· 한화투자증권</span>
        </div>
        <div className="mode-switch">
          <button
            className={`mode-btn ${!isAgent ? "on" : ""}`}
            onClick={() => switchMode("prompt")}
          >
            <DocIcon size={15} /> 프롬프트
          </button>
          <button
            className={`mode-btn ${isAgent ? "on" : ""}`}
            onClick={() => switchMode("agent")}
          >
            <BotIcon size={15} /> 에이전트
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="user-pill" onClick={() => setTab("activity")}>
            <span className="dot">{initial}</span> {displayName} · {user.dept}
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="tnav"
              style={{ fontSize: 12, color: "var(--text-3)" }}
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>

      {/* 서브바 */}
      <div className="subbar">
        <div className="subtabs">
          {TABS[mode].map((t) => (
            <button
              key={t.id}
              className={`tnav ${t.id === tab ? "on" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="subbar-right">
          <div className="search-wrap">
            <SearchIcon size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAgent ? "에이전트 검색..." : "프롬프트 검색..."}
            />
          </div>
          <div className="subbar-actions">
            <button
              className="make-btn"
              onClick={() => (isAgent ? setAgentCreateOpen(true) : setPromptCreateOpen(true))}
            >
              <SparklesIcon size={15} /> {isAgent ? "에이전트 만들기" : "프롬프트 만들기"}
            </button>
            <button
              className="reg-btn"
              onClick={() => (isAgent ? setAgentRegisterOpen(true) : setPromptRegisterOpen(true))}
            >
              <PlusIcon size={15} /> {isAgent ? "에이전트 등록" : "프롬프트 등록"}
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="content">
        <div className="view-header">
          <h2>{header.h}</h2>
          <p>{header.p}</p>
        </div>

        {isActivity ? (
          <ActivityFeed
            onOpenPrompt={(id) => {
              setMode("prompt");
              setTab("home");
              setOpenPromptId(id);
            }}
            onOpenAgent={(id) => {
              setMode("agent");
              setTab("a-home");
              setOpenAgentId(id);
            }}
          />
        ) : !isAgent ? (
          <PromptBoard
            initialPrompts={initialPrompts}
            tab={tab}
            search={search}
            registerOpen={promptRegisterOpen}
            setRegisterOpen={setPromptRegisterOpen}
            createOpen={promptCreateOpen}
            setCreateOpen={setPromptCreateOpen}
            openPromptId={openPromptId}
            onConsumeOpenPromptId={() => setOpenPromptId(null)}
          />
        ) : (
          <AgentBoard
            initialAgents={initialAgents}
            tab={tab}
            search={search}
            registerOpen={agentRegisterOpen}
            setRegisterOpen={setAgentRegisterOpen}
            createOpen={agentCreateOpen}
            setCreateOpen={setAgentCreateOpen}
            openAgentId={openAgentId}
            onConsumeOpenAgentId={() => setOpenAgentId(null)}
          />
        )}
      </div>
    </>
  );
}
