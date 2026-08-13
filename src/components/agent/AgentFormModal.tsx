"use client";

import { useEffect, useState } from "react";
import { XIcon } from "@/components/icons";
import type { AgentDTO } from "@/lib/agents";
import { WORK_CATEGORIES, type WorkCategory } from "@/lib/work-categories";

export type AgentDraft = { cat: WorkCategory; name?: string; desc?: string; instructions: string; tasks?: string[] };

export default function AgentFormModal({
  open,
  editing,
  draft,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: AgentDTO | null;
  draft?: AgentDraft | null;
  onClose: () => void;
  onSubmit: (data: { cat: string; name: string; desc: string; instructions: string; tasks: string[] }) => Promise<string | null>;
}) {
  const [cat, setCat] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tasksText, setTasksText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setCat(editing.cat);
      setName(editing.name);
      setDesc(editing.desc === "(설명 없음)" ? "" : editing.desc);
      setInstructions(editing.instructions);
      setTasksText(editing.tasks.join("\n"));
    } else if (draft) {
      setCat(draft.cat);
      setName(draft.name ?? "");
      setDesc(draft.desc ?? "");
      setInstructions(draft.instructions);
      setTasksText((draft.tasks ?? []).join("\n"));
    } else {
      setCat("");
      setName("");
      setDesc("");
      setInstructions("");
      setTasksText("");
    }
  }, [open, editing, draft]);

  if (!open) return null;

  async function handleSubmit() {
    if (!cat) {
      setError("업무 카테고리를 선택해주세요.");
      return;
    }
    if (!name.trim() || !instructions.trim()) {
      setError("에이전트 이름과 지침을 입력해주세요.");
      return;
    }
    setPending(true);
    setError(null);
    const tasks = tasksText.split("\n").map((t) => t.trim()).filter(Boolean);
    const err = await onSubmit({ cat, name: name.trim(), desc: desc.trim(), instructions: instructions.trim(), tasks });
    setPending(false);
    if (err) setError(err);
  }

  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <XIcon size={18} />
        </button>
        <div className="form-title">{editing ? "에이전트 수정" : "에이전트 등록"}</div>
        <div className="form-sub">반복 업무를 대신 처리하는 나만의 에이전트를 만들어 공유해보세요.</div>

        <div className="field">
          <label>업무 카테고리 *</label>
          <select value={cat} onChange={(e) => setCat(e.target.value)} required>
            <option value="" disabled>업무 카테고리를 선택해주세요</option>
            {WORK_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>에이전트 이름</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 리서치 어시스턴트" />
        </div>
        <div className="field">
          <label>설명</label>
          <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="이 에이전트가 어떤 일을 해주는지 한두 줄로 설명해주세요." />
        </div>
        <div className="field">
          <label>에이전트 지침 (시스템 프롬프트)</label>
          <textarea
            rows={6}
            className="mono"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="이 에이전트가 항상 따를 역할과 규칙을 적어주세요."
          />
          <div className="hint">예: 당신은 증권사 리서치 보조 에이전트입니다. 리포트를 받으면 핵심 투자포인트·리스크를 정리합니다…</div>
        </div>
        <div className="field">
          <label>예시 작업 (한 줄에 하나씩)</label>
          <textarea
            rows={3}
            value={tasksText}
            onChange={(e) => setTasksText(e.target.value)}
            placeholder={"이 리포트 핵심만 요약해줘\nA와 B 종목 비교해줘"}
          />
        </div>

        {error ? <div className="form-error">{error}</div> : null}

        <div className="form-actions">
          <button className="btn-ghost" onClick={onClose} disabled={pending}>취소</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={pending}>
            {pending ? "저장 중…" : editing ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
