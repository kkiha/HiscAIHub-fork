"use client";

import { useEffect, useState } from "react";
import { XIcon } from "@/components/icons";
import type { PromptDTO } from "@/lib/prompts";
import { WORK_CATEGORIES, type WorkCategory } from "@/lib/work-categories";

export type PromptDraft = { cat: WorkCategory; title?: string; desc?: string; body: string };

export default function PromptFormModal({
  open,
  editing,
  draft,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: PromptDTO | null;
  draft?: PromptDraft | null;
  onClose: () => void;
  onSubmit: (data: { cat: string; title: string; desc: string; body: string }) => Promise<string | null>;
}) {
  const [cat, setCat] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setCat(editing.cat);
      setTitle(editing.title);
      setDesc(editing.desc === "(설명 없음)" ? "" : editing.desc);
      setBody(editing.body);
    } else if (draft) {
      setCat(draft.cat);
      setTitle(draft.title ?? "");
      setDesc(draft.desc ?? "");
      setBody(draft.body);
    } else {
      setCat("");
      setTitle("");
      setDesc("");
      setBody("");
    }
  }, [open, editing, draft]);

  if (!open) return null;

  async function handleSubmit() {
    if (!cat) {
      setError("업무 카테고리를 선택해주세요.");
      return;
    }
    if (!title.trim() || !body.trim()) {
      setError("제목과 프롬프트 내용을 입력해주세요.");
      return;
    }
    setPending(true);
    setError(null);
    const err = await onSubmit({ cat, title: title.trim(), desc: desc.trim(), body: body.trim() });
    setPending(false);
    if (err) setError(err);
  }

  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <XIcon size={18} />
        </button>
        <div className="form-title">{editing ? "프롬프트 수정" : "프롬프트 등록"}</div>
        <div className="form-sub">동료들이 바로 쓸 수 있도록 프롬프트를 공유해보세요.</div>

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
          <label>제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 종목 리서치 리포트 핵심 요약"
          />
        </div>
        <div className="field">
          <label>설명</label>
          <textarea
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="이 프롬프트가 무엇을 해주는지 한두 줄로 설명해주세요."
          />
        </div>
        <div className="field">
          <label>프롬프트 내용</label>
          <textarea
            rows={6}
            className="mono"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="실제 프롬프트를 입력하세요. {{변수}} 형태로 입력값을 표시할 수 있어요."
          />
          <div className="hint">예: 다음 리포트를 읽고 핵심 투자포인트 3가지를 요약해주세요. 리포트: {"{{내용}}"}</div>
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
