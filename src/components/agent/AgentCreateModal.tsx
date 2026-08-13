"use client";

import { useState } from "react";
import { XIcon, ZapFillIcon, BotIcon } from "@/components/icons";
import type { AgentDraft } from "./AgentFormModal";
import { WORK_CATEGORIES, type WorkCategory } from "@/lib/work-categories";

type Step = 1 | 2 | 3;
type Generated = { name: string; instructions: string; tasks: string[]; category: WorkCategory };

export default function AgentCreateModal({
  open,
  onClose,
  onUseGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onUseGenerated: (draft: AgentDraft) => void;
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
      setError("어떤 일을 하는 에이전트인지 입력해주세요.");
      return;
    }
    setError(null);
    setStep(2);
    try {
      const res = await fetch("/api/generate/agent", {
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
      setGenerated({ name: data.name, instructions: data.instructions, tasks: data.tasks, category: data.category });
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
        <div className="form-title">에이전트 만들기</div>
        <div className="form-sub">어떤 일을 맡기고 싶은지 입력하면, 그 일을 수행하는 에이전트를 만들어드려요.</div>

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
              <label>어떤 일을 하는 에이전트를 만들고 싶으세요?</label>
              <textarea
                rows={4}
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="예: 애널리스트 리포트를 넣으면 핵심 투자포인트와 리스크를 정리해주고, 종목끼리 비교도 해주는 에이전트."
              />
              <div className="hint">맡길 업무·입력·원하는 결과를 적을수록 더 똑똑한 에이전트가 만들어져요.</div>
            </div>
            {error ? <div className="form-error">{error}</div> : null}
            <div className="form-actions">
              <button className="btn-ghost" onClick={handleClose}>취소</button>
              <button className="btn-primary" onClick={runGenerate}>에이전트 생성</button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <div className="gen-loading">
            <div className="spinner" /> 업무에 맞는 에이전트를 설계하고 있어요…
          </div>
        ) : null}

        {step === 3 && generated ? (
          <>
            <div className="modal-icon-row">
              <div className="agent-icon"><BotIcon size={20} /></div>
              <div>
                <div className="prompt-label" style={{ marginBottom: 2 }}>생성된 에이전트</div>
                <div className="modal-title" style={{ fontSize: 16 }}>{generated.name}</div>
              </div>
            </div>
            <div className="prompt-label">지침</div>
            <div className="modal-prompt">{generated.instructions}</div>
            <div className="prompt-label">예시 작업</div>
            <div className="task-chips">
              {generated.tasks.map((t, i) => (
                <span className="task-chip" key={i}>{t}</span>
              ))}
            </div>
            <div className="actions">
              <button
                className="act-btn run"
                onClick={() => {
                  navigator.clipboard?.writeText(generated.instructions).catch(() => {});
                  window.open(`https://claude.ai/new?q=${encodeURIComponent(generated.instructions)}`, "_blank", "noopener");
                  showToast("Claude 새 탭을 열었어요 (지침 복사됨)");
                }}
              >
                <ZapFillIcon size={14} /> Claude로 실행
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
                  onUseGenerated({ cat: generated.category, name: generated.name, instructions: generated.instructions, tasks: generated.tasks });
                  reset();
                }}
              >
                이 에이전트 등록하기
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
