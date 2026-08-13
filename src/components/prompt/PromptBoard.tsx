"use client";

import { useEffect, useState } from "react";
import type { PromptDTO } from "@/lib/prompts";
import PromptDetailModal from "./PromptDetailModal";
import PromptFormModal, { type PromptDraft } from "./PromptFormModal";
import PromptCreateModal from "./PromptCreateModal";
import { launchClaude } from "@/lib/launch-claude";
import {
  ZapIcon,
  CopyIcon,
  CommentIcon,
  BookmarkIcon,
  BookmarkFillIcon,
  EditIcon,
  TrashIcon,
  FlameIcon,
  StarIcon,
} from "@/components/icons";

type Award = { prompt: PromptDTO; kind: "run" | "hot" | "useful" };

const AWARD_META: Record<Award["kind"], { cls: string; icon: React.ReactNode; text: string }> = {
  run: { cls: "run", icon: <ZapIcon size={13} />, text: "누적 실행이 가장 많은 프롬프트예요" },
  hot: { cls: "hot", icon: <FlameIcon size={13} />, text: "Hot · 누적 댓글이 가장 많아요" },
  useful: { cls: "useful", icon: <StarIcon size={13} />, text: "누적 복사가 가장 많은 프롬프트예요" },
};

function pickAwards(list: PromptDTO[]): Award[] {
  const excluded = new Set<string>();
  function pick(scoreFn: (p: PromptDTO) => number): PromptDTO | null {
    const candidates = list.filter((p) => !excluded.has(p.id));
    if (!candidates.length) return null;
    candidates.sort((a, b) => scoreFn(b) - scoreFn(a));
    const winner = candidates[0];
    excluded.add(winner.id);
    return winner;
  }
  const run = pick((p) => p.runs);
  const hot = pick((p) => p.comments.length);
  const useful = pick((p) => p.copies);
  const awards: Award[] = [];
  if (run) awards.push({ prompt: run, kind: "run" });
  if (hot) awards.push({ prompt: hot, kind: "hot" });
  if (useful) awards.push({ prompt: useful, kind: "useful" });
  return awards;
}

export default function PromptBoard({
  initialPrompts,
  tab,
  search,
  registerOpen,
  setRegisterOpen,
  createOpen,
  setCreateOpen,
  openPromptId,
  onConsumeOpenPromptId,
}: {
  initialPrompts: PromptDTO[];
  tab: string;
  search: string;
  registerOpen: boolean;
  setRegisterOpen: (open: boolean) => void;
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  openPromptId?: string | null;
  onConsumeOpenPromptId?: () => void;
}) {
  const [prompts, setPrompts] = useState(initialPrompts);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PromptDTO | null>(null);
  const [draft, setDraft] = useState<PromptDraft | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (openPromptId) {
      setDetailId(openPromptId);
      onConsumeOpenPromptId?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPromptId]);

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(() => setToast(""), 2200);
  }

  async function toggleSave(id: string) {
    const res = await fetch(`/api/prompts/${id}/save`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, saved: data.saved } : p)));
    showToast(data.saved ? "저장했어요" : "저장을 취소했어요");
  }

  async function copyPrompt(p: PromptDTO) {
    try {
      await navigator.clipboard.writeText(p.body);
    } catch {}
    const res = await fetch(`/api/prompts/${p.id}/copy`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setPrompts((prev) => prev.map((x) => (x.id === p.id ? { ...x, copies: data.copies } : x)));
    }
    showToast("클립보드에 복사됐어요");
  }

  async function runPrompt(p: PromptDTO) {
    const where = await launchClaude(p.body);
    const res = await fetch(`/api/prompts/${p.id}/run`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setPrompts((prev) => prev.map((x) => (x.id === p.id ? { ...x, runs: data.runs } : x)));
    }
    showToast(
      where === "desktop"
        ? "Claude 데스크톱을 열었어요 (프롬프트 자동 입력됨)"
        : "Claude 새 탭을 열었어요 (프롬프트 자동 입력됨)"
    );
  }

  async function submitComment(id: string, text: string): Promise<boolean> {
    const res = await fetch(`/api/prompts/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, comments: [...p.comments, data.comment] } : p)));
    return true;
  }

  async function deletePrompt(id: string) {
    if (!confirm("이 프롬프트를 삭제할까요? 되돌릴 수 없어요.")) return;
    const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      if (detailId === id) setDetailId(null);
      showToast("삭제했어요");
    }
  }

  function openEdit(p: PromptDTO) {
    setEditing(p);
    setRegisterOpen(true);
  }

  function closeForm() {
    setRegisterOpen(false);
    setEditing(null);
    setDraft(null);
  }

  async function submitForm(data: { cat: string; title: string; desc: string; body: string }): Promise<string | null> {
    if (editing) {
      const res = await fetch(`/api/prompts/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json();
        return e.error ?? "저장에 실패했어요.";
      }
      const { prompt } = await res.json();
      setPrompts((prev) => prev.map((p) => (p.id === editing.id ? prompt : p)));
    } else {
      const res = await fetch(`/api/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json();
        return e.error ?? "등록에 실패했어요.";
      }
      const { prompt } = await res.json();
      setPrompts((prev) => [prompt, ...prev]);
    }
    closeForm();
    return null;
  }

  // 탭·검색 필터링 (데모 renderView 로직 이식)
  const f = search.trim().toLowerCase();
  let list = prompts.slice();
  let mine = false;
  let awards: Award[] | null = null;
  let emptyMsg = "검색 결과가 없어요.";

  if (tab === "popular") {
    awards = pickAwards(prompts);
    list = awards.map((a) => a.prompt);
    emptyMsg = "아직 표시할 프롬프트가 없어요.";
  } else {
    if (tab === "saved") {
      list = list.filter((p) => p.saved);
      if (!f) emptyMsg = "아직 저장한 프롬프트가 없어요. 마음에 드는 프롬프트를 저장해두면 여기 모여요.";
    } else if (tab === "mine") {
      list = list.filter((p) => p.mine);
      mine = true;
      if (!f) emptyMsg = "아직 작성한 프롬프트가 없어요. 오른쪽 위 '프롬프트 등록'으로 첫 프롬프트를 공유해보세요.";
    }
    if (f) {
      list = list.filter((p) => (p.title + p.desc + p.cat + p.author).toLowerCase().includes(f));
    }
  }

  const detail = detailId ? prompts.find((p) => p.id === detailId) ?? null : null;

  return (
    <>
      {list.length === 0 ? (
        <div className="empty">
          <BookmarkIcon size={30} />
          <br />
          {emptyMsg}
        </div>
      ) : (
        <div className="grid">
          {list.map((p) => {
            const award = awards?.find((a) => a.prompt.id === p.id);
            return (
              <PromptCard
                key={p.id}
                prompt={p}
                mine={mine}
                award={award}
                onOpen={() => setDetailId(p.id)}
                onToggleSave={() => toggleSave(p.id)}
                onEdit={() => openEdit(p)}
                onDelete={() => deletePrompt(p.id)}
              />
            );
          })}
        </div>
      )}

      <PromptDetailModal
        prompt={detail}
        onClose={() => setDetailId(null)}
        onToggleSave={toggleSave}
        onCopy={copyPrompt}
        onRun={runPrompt}
        onComment={submitComment}
        onEdit={(p) => { setDetailId(null); openEdit(p); }}
        onDelete={(id) => deletePrompt(id)}
      />

      <PromptFormModal open={registerOpen} editing={editing} draft={editing ? null : draft} onClose={closeForm} onSubmit={submitForm} />

      <PromptCreateModal
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

function PromptCard({
  prompt: p,
  mine,
  award,
  onOpen,
  onToggleSave,
  onEdit,
  onDelete,
}: {
  prompt: PromptDTO;
  mine: boolean;
  award?: Award;
  onOpen: () => void;
  onToggleSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card" onClick={onOpen}>
      {award ? (
        <div className={`award-banner ${AWARD_META[award.kind].cls}`}>
          {AWARD_META[award.kind].icon} {AWARD_META[award.kind].text}
        </div>
      ) : null}
      <div className="card-head">
        <span className="cat-badge">{p.cat}</span>
        <div className="card-head-right">
          <button
            className={`card-save ${p.saved ? "on" : ""}`}
            title="저장"
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
          >
            {p.saved ? <BookmarkFillIcon size={15} /> : <BookmarkIcon size={15} />}
          </button>
          <span className="card-date">{p.date}</span>
        </div>
      </div>
      <div className="card-title">{p.title}</div>
      <div className="card-desc">{p.desc}</div>
      <div className="card-foot">
        <div className="author">
          <div className="ava">{p.ava}</div>
          <span className="aname">{p.author}</span>
          <span className="dept">{p.dept}</span>
        </div>
        <div className="mini-acts">
          <div className="mini-act"><ZapIcon size={13} /> {p.runs}</div>
          <div className="mini-act"><CopyIcon size={13} /> {p.copies}</div>
          <div className="mini-act"><CommentIcon size={13} /> {p.comments.length}</div>
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
