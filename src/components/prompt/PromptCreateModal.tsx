"use client";

import { useState } from "react";
import { XIcon, ZapFillIcon, CopyIcon } from "@/components/icons";
import type { PromptDraft } from "./PromptFormModal";
import { WORK_CATEGORIES, type WorkCategory } from "@/lib/work-categories";

type Step = 1 | 2 | 3;
type Generated = { title: string; body: string; category: WorkCategory };

export default function PromptCreateModal({
  open,
  onClose,
  onUseGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onUseGenerated: (draft: PromptDraft) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [cat, setCat] = useState("");
  const [task, setTask] = useState("");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  function reset() {
    setStep(1);
    setCat("");
    setTask("");
    setGenerated(null);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function runGenerate() {
    if (!cat) {
      setError("업무 카테고리를 선택해주세요.");
      return;
    }
    if (!task.trim()) {
      setError("하려는 업무를 입력해주세요.");
      return;
    }
    setError(null);
    setStep(2);
    try {
      const res = await fetch("/api/generate/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cat, task: task.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "생성에 실패했어요.");
        setStep(1);
        return;
      }
      setGenerated({ title: data.title, body: data.body, category: data.category });
      setStep(3);
    } catch {
      setError("네트워크 오류로 생성에 실패했어요.");
      setStep(1);
    }
  }

  if (!open) return null;

  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={handleClose}>
          <XIcon size={18} />
        </button>
        <div className="form-title">프롬프트 만들기</div>
        <div className="form-sub">하려는 업무를 입력하면 Claude에게 시키기 좋은 형태로 프롬프트를 만들어드려요.</div>

        {step === 1 ? (
          <>
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
              <label>어떤 업무를 하고 싶으세요?</label>
              <textarea
                rows={4}
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="예: 고객에게 보낼 주간 시장 동향 요약 메일을 작성하고 싶어요. 너무 딱딱하지 않게, 핵심만 3가지로."
              />
              <div className="hint">목표·대상·원하는 결과물을 적을수록 더 좋은 프롬프트가 만들어져요.</div>
            </div>
            {error ? <div className="form-error">{error}</div> : null}
            <div className="form-actions">
              <button className="btn-ghost" onClick={handleClose}>취소</button>
              <button className="btn-primary" onClick={runGenerate}>프롬프트 생성</button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <div className="gen-loading">
            <div className="spinner" /> 업무에 맞는 프롬프트를 만들고 있어요…
          </div>
        ) : null}

        {step === 3 && generated ? (
          <>
            <div className="prompt-label">생성된 프롬프트</div>
            <div className="modal-prompt">{generated.body}</div>
            <div className="actions">
              <button
                className="act-btn run"
                onClick={() => {
                  navigator.clipboard?.writeText(generated.body).catch(() => {});
                  window.open(`https://claude.ai/new?q=${encodeURIComponent(generated.body)}`, "_blank", "noopener");
                  showToast("Claude 새 탭을 열었어요 (복사됨)");
                }}
              >
                <ZapFillIcon size={14} /> Claude로 실행
              </button>
              <button
                className="act-btn"
                onClick={() => {
                  navigator.clipboard?.writeText(generated.body).catch(() => {});
                  showToast("클립보드에 복사됐어요");
                }}
              >
                <CopyIcon size={14} /> 복사
              </button>
              <button className="act-btn" onClick={runGenerate}>다시 만들기</button>
              <span className="toast show" style={{ opacity: toast ? 1 : 0 }}>{toast}</span>
            </div>
            <div className="gen-note">마음에 들면 그대로 등록하거나, 등록 화면에서 자유롭게 다듬을 수 있어요.</div>
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setStep(1)}>처음으로</button>
              <button
                className="btn-primary"
                onClick={() => {
                  onUseGenerated({ cat: generated.category, title: generated.title, body: generated.body });
                  reset();
                }}
              >
                이 프롬프트 등록하기
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
