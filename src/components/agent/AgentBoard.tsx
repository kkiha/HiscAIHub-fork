"use client";

import { useEffect, useState } from "react";
import type { AgentDTO } from "@/lib/agents";
import "@/styles/agent-board.css";
import AgentDetailModal from "./AgentDetailModal";
import AgentFormModal, { type AgentDraft } from "./AgentFormModal";
import AgentCreateModal from "./AgentCreateModal";
import { launchClaude } from "@/lib/launch-claude";
import {
  BotIcon,
  ZapIcon,
  CommentIcon,
  BookmarkIcon,
  BookmarkFillIcon,
  EditIcon,
  TrashIcon,
} from "@/components/icons";

export default function AgentBoard({
  initialAgents,
  tab,
  search,
  registerOpen,
  setRegisterOpen,
  createOpen,
  setCreateOpen,
  openAgentId,
  onConsumeOpenAgentId,
}: {
  initialAgents: AgentDTO[];
  tab: string;
  search: string;
  registerOpen: boolean;
  setRegisterOpen: (open: boolean) => void;
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  openAgentId?: string | null;
  onConsumeOpenAgentId?: () => void;
}) {
  const [agents, setAgents] = useState(initialAgents);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AgentDTO | null>(null);
  const [draft, setDraft] = useState<AgentDraft | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (openAgentId) {
      setDetailId(openAgentId);
      onConsumeOpenAgentId?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAgentId]);

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(() => setToast(""), 2200);
  }

  async function toggleSave(id: string) {
    const res = await fetch(`/api/agents/${id}/save`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, saved: data.saved } : a)));
    showToast(data.saved ? "저장했어요" : "저장을 취소했어요");
  }

  async function copyInstructions(a: AgentDTO) {
    try {
      await navigator.clipboard.writeText(a.instructions);
    } catch {}
    showToast("지침이 복사됐어요");
  }

  // 에이전트도 프롬프트와 동일하게 Claude(데스크톱 있으면 데스크톱, 없으면 웹)로 실행.
  // 파일은 열린 Claude 창에서 각자 직접 첨부.
  async function runAgent(a: AgentDTO) {
    const where = await launchClaude(a.instructions);
    const res = await fetch(`/api/agents/${a.id}/run`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setAgents((prev) => prev.map((x) => (x.id === a.id ? { ...x, runs: data.runs } : x)));
    }
    showToast(
      where === "desktop"
        ? "Claude 데스크톱을 열었어요 (지침 자동 입력됨). 필요한 파일은 그 창에서 첨부해주세요."
        : "Claude 새 탭을 열었어요 (지침 자동 입력됨). 필요한 파일은 그 창에서 첨부해주세요."
    );
  }

  async function submitComment(id: string, text: string): Promise<boolean> {
    const res = await fetch(`/api/agents/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, comments: [...a.comments, data.comment] } : a)));
    return true;
  }

  async function deleteAgent(id: string) {
    if (!confirm("이 에이전트를 삭제할까요? 되돌릴 수 없어요.")) return;
    const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAgents((prev) => prev.filter((a) => a.id !== id));
      if (detailId === id) setDetailId(null);
      showToast("삭제했어요");
    }
  }

  function openEdit(a: AgentDTO) {
    setEditing(a);
    setRegisterOpen(true);
  }

  function closeForm() {
    setRegisterOpen(false);
    setEditing(null);
    setDraft(null);
  }

  async function submitForm(data: { cat: string; name: string; desc: string; instructions: string; tasks: string[] }): Promise<string | null> {
    if (editing) {
      const res = await fetch(`/api/agents/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json();
        return e.error ?? "저장에 실패했어요.";
      }
      const { agent } = await res.json();
      setAgents((prev) => prev.map((a) => (a.id === editing.id ? agent : a)));
    } else {
      const res = await fetch(`/api/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json();
        return e.error ?? "등록에 실패했어요.";
      }
      const { agent } = await res.json();
      setAgents((prev) => [agent, ...prev]);
    }
    closeForm();
    return null;
  }

  // 탭·검색 필터링 (데모 renderView agentMode 분기 이식)
  const f = search.trim().toLowerCase();
  let list = agents.slice();
  let mine = false;
  let emptyMsg = "검색 결과가 없어요.";

  if (tab === "a-popular") {
    list = list.slice().sort((a, b) => b.runs - a.runs);
  } else if (tab === "a-saved") {
    list = list.filter((a) => a.saved);
    if (!f) emptyMsg = "아직 저장한 에이전트가 없어요. 마음에 드는 에이전트를 저장해두면 여기 모여요.";
  } else if (tab === "a-mine") {
    list = list.filter((a) => a.mine);
    mine = true;
    if (!f) emptyMsg = "아직 만든 에이전트가 없어요. 오른쪽 위 '에이전트 등록'으로 첫 에이전트를 만들어보세요.";
  } else if (!f) {
    emptyMsg = "아직 등록된 에이전트가 없어요.";
  }
  if (f) {
    list = list.filter((a) => (a.name + a.desc + a.cat + a.author).toLowerCase().includes(f));
  }

  const detail = detailId ? agents.find((a) => a.id === detailId) ?? null : null;

  return (
    <>
      {list.length === 0 ? (
        <div className="empty">
          <BotIcon size={30} />
          <br />
          {emptyMsg}
        </div>
      ) : (
        <div className="grid">
          {list.map((a) => (
            <AgentCard
              key={a.id}
              agent={a}
              mine={mine}
              onOpen={() => setDetailId(a.id)}
              onToggleSave={() => toggleSave(a.id)}
              onEdit={() => openEdit(a)}
              onDelete={() => deleteAgent(a.id)}
            />
          ))}
        </div>
      )}

      <AgentDetailModal
        agent={detail}
        onClose={() => setDetailId(null)}
        onToggleSave={toggleSave}
        onCopyInstructions={copyInstructions}
        onComment={submitComment}
        onEdit={(a) => { setDetailId(null); openEdit(a); }}
        onDelete={(id) => deleteAgent(id)}
        onRun={runAgent}
      />

      <AgentFormModal open={registerOpen} editing={editing} draft={editing ? null : draft} onClose={closeForm} onSubmit={submitForm} />

      <AgentCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onUseGenerated={(d) => {
          setEditing(null);
          setDraft(d);
          setCreateOpen(false);
          setRegisterOpen(true);
        }}
      />

      <div
        style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--text-1)", color: "#fff", fontSize: 12.5, padding: "10px 16px",
          borderRadius: 20, opacity: toast ? 1 : 0, transition: "opacity .2s", pointerEvents: "none", zIndex: 100,
        }}
      >
        {toast}
      </div>
    </>
  );
}

function AgentCard({
  agent: a,
  mine,
  onOpen,
  onToggleSave,
  onEdit,
  onDelete,
}: {
  agent: AgentDTO;
  mine: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card" onClick={onOpen}>
      <div className="card-head">
        <span className="cat-badge">{a.cat}</span>
        <div className="card-head-right">
          <button
            className={`card-save ${a.saved ? "on" : ""}`}
            title="저장"
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
          >
            {a.saved ? <BookmarkFillIcon size={15} /> : <BookmarkIcon size={15} />}
          </button>
          <span className="card-date">{a.date}</span>
        </div>
      </div>
      <div className="card-title-row">
        <div className="agent-icon"><BotIcon size={16} /></div>
        <div className="card-title">{a.name}</div>
      </div>
      <div className="card-desc">{a.desc}</div>
      <div className="task-chips">
        {a.tasks.slice(0, 2).map((t, i) => (
          <span className="task-chip" key={i}>{t}</span>
        ))}
      </div>
      <div className="card-foot">
        <div className="author">
          <div className="ava">{a.ava}</div>
          <span className="aname">{a.author}</span>
          <span className="dept">{a.dept}</span>
        </div>
        <div className="mini-acts">
          <div className="mini-act"><ZapIcon size={13} /> {a.runs}</div>
          <div className="mini-act"><CommentIcon size={13} /> {a.comments.length}</div>
        </div>
      </div>
      {mine ? (
        <div className="card-manage">
          <button className="manage-btn" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <EditIcon size={13} /> 수정
          </button>
          <button className="manage-btn del" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <TrashIcon size={13} /> 삭제
          </button>
        </div>
      ) : null}
    </div>
  );
}
