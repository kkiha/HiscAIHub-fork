"use client";

import { useEffect, useState } from "react";
import type { AgentDTO } from "@/lib/agents";
import {
  XIcon,
  BotIcon,
  DocIcon,
  BookmarkIcon,
  BookmarkFillIcon,
  CopyIcon,
  ShareIcon,
  EditIcon,
  TrashIcon,
  ZapIcon,
  ZapFillIcon,
} from "@/components/icons";

export default function AgentDetailModal({
  agent,
  onClose,
  onToggleSave,
  onCopyInstructions,
  onComment,
  onEdit,
  onDelete,
  onRun,
}: {
  agent: AgentDTO | null;
  onClose: () => void;
  onToggleSave: (id: string) => void;
  onCopyInstructions: (a: AgentDTO) => void;
  onComment: (id: string, text: string) => Promise<boolean>;
  onEdit: (a: AgentDTO) => void;
  onDelete: (id: string) => void;
  onRun: (a: AgentDTO) => void;
}) {
  const [instShown, setInstShown] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setInstShown(false);
    setCommentText("");
  }, [agent?.id]);

  if (!agent) return null;
  const a = agent;

  async function submitComment() {
    const text = commentText.trim();
    if (!text) return;
    setSubmitting(true);
    const ok = await onComment(a.id, text);
    setSubmitting(false);
    if (ok) setCommentText("");
  }

  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <XIcon size={18} />
        </button>

        <span className="modal-cat">{a.cat}</span>
        <div className="modal-icon-row">
          <div className="agent-icon"><BotIcon size={20} /></div>
          <div className="modal-title">{a.name}</div>
        </div>
        <div className="modal-desc">{a.desc}</div>

        <div className="prompt-label">이 에이전트가 하는 일</div>
        <div className="task-chips">
          {a.tasks.map((t, i) => (
            <span className="task-chip" key={i}>{t}</span>
          ))}
        </div>

        <button className="link-toggle" onClick={() => setInstShown((v) => !v)}>
          <DocIcon size={13} /> {instShown ? "지침 닫기" : "지침 보기"}
        </button>
        {instShown ? <div className="modal-prompt">{a.instructions}</div> : null}

        <div className="author-row">
          <div className="ava">{a.ava}</div>
          <span className="aname">{a.author}</span>
          <span className="dept">{a.dept}</span>
          {a.mine ? <span className="mine-tag">내 글</span> : null}
          <span className="date">{a.date}</span>
        </div>

        <div className="stat-strip">
          <span><ZapIcon size={13} /> 실행 <b>{a.runs}</b></span>
        </div>
        <hr className="divider" />

        <div className="actions">
          <button className="act-btn run" onClick={() => onRun(a)}>
            <ZapFillIcon size={14} /> Claude로 실행
          </button>
          <button className={`act-btn ${a.saved ? "saved" : ""}`} onClick={() => onToggleSave(a.id)}>
            {a.saved ? <BookmarkFillIcon size={14} /> : <BookmarkIcon size={14} />} {a.saved ? "저장됨" : "저장"}
          </button>
          <button className="act-btn" onClick={() => onCopyInstructions(a)}>
            <CopyIcon size={14} /> 지침 복사
          </button>
          <button className="act-btn" onClick={() => alert("공유 링크가 복사됐어요")}>
            <ShareIcon size={14} /> 공유
          </button>
          {a.mine ? (
            <>
              <button className="act-btn" onClick={() => onEdit(a)}>
                <EditIcon size={14} /> 수정
              </button>
              <button className="act-btn del" onClick={() => onDelete(a.id)}>
                <TrashIcon size={14} /> 삭제
              </button>
            </>
          ) : null}
        </div>

        <div className="comments-label">
          댓글 <span>{a.comments.length}</span>
        </div>
        <div>
          {a.comments.length === 0 ? (
            <div className="c-empty">아직 댓글이 없어요. 첫 댓글을 남겨보세요.</div>
          ) : (
            a.comments.map((c) => (
              <div className="comment-item" key={c.id}>
                <div className="comment-head">
                  <div className="c-ava">{c.ava}</div>
                  <span className="c-name">{c.name}</span>
                  <span className="c-dept">{c.dept}</span>
                  <span className="c-date">{c.date}</span>
                </div>
                <div className="c-text">{c.text}</div>
              </div>
            ))
          )}
        </div>
        <div className="comment-input-row">
          <input
            className="comment-input"
            placeholder="댓글을 입력하세요..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }}
          />
          <button className="comment-submit" onClick={submitComment} disabled={submitting}>
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
