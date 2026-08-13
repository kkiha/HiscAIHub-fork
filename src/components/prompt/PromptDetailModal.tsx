"use client";

import { useState } from "react";
import type { PromptDTO } from "@/lib/prompts";
import {
  XIcon,
  ZapFillIcon,
  BookmarkIcon,
  BookmarkFillIcon,
  CopyIcon,
  ShareIcon,
  EditIcon,
  TrashIcon,
} from "@/components/icons";

export default function PromptDetailModal({
  prompt,
  onClose,
  onToggleSave,
  onCopy,
  onRun,
  onComment,
  onEdit,
  onDelete,
}: {
  prompt: PromptDTO | null;
  onClose: () => void;
  onToggleSave: (id: string) => void;
  onCopy: (p: PromptDTO) => void;
  onRun: (p: PromptDTO) => void;
  onComment: (id: string, text: string) => Promise<boolean>;
  onEdit: (p: PromptDTO) => void;
  onDelete: (id: string) => void;
}) {
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!prompt) return null;
  const p = prompt;

  async function submit() {
    const text = commentText.trim();
    if (!text) return;
    setSubmitting(true);
    const ok = await onComment(p.id, text);
    setSubmitting(false);
    if (ok) setCommentText("");
  }

  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <XIcon size={18} />
        </button>

        <span className="modal-cat">{p.cat}</span>
        <div className="modal-title">{p.title}</div>
        <div className="modal-desc">{p.desc}</div>

        <div className="prompt-label">프롬프트</div>
        <div className="modal-prompt">{p.body}</div>

        <div className="author-row">
          <div className="ava">{p.ava}</div>
          <span className="aname">{p.author}</span>
          <span className="dept">{p.dept}</span>
          {p.mine ? <span className="mine-tag">내 글</span> : null}
          <span className="date">{p.date}</span>
        </div>

        <div className="stat-strip">
          <span><ZapFillIcon size={13} /> Claude 실행 <b>{p.runs}</b></span>
          <span><CopyIcon size={13} /> 복사 <b>{p.copies}</b></span>
        </div>
        <hr className="divider" />

        <div className="actions">
          <button className="act-btn run" onClick={() => onRun(p)}>
            <ZapFillIcon size={14} /> Claude로 실행
          </button>
          <button className={`act-btn ${p.saved ? "saved" : ""}`} onClick={() => onToggleSave(p.id)}>
            {p.saved ? <BookmarkFillIcon size={14} /> : <BookmarkIcon size={14} />} {p.saved ? "저장됨" : "저장"}
          </button>
          <button className="act-btn" onClick={() => onCopy(p)}>
            <CopyIcon size={14} /> 복사
          </button>
          <button className="act-btn" onClick={() => alert("공유 링크가 복사됐어요")}>
            <ShareIcon size={14} /> 공유
          </button>
          {p.mine ? (
            <>
              <button className="act-btn" onClick={() => onEdit(p)}>
                <EditIcon size={14} /> 수정
              </button>
              <button className="act-btn del" onClick={() => onDelete(p.id)}>
                <TrashIcon size={14} /> 삭제
              </button>
            </>
          ) : null}
        </div>

        <div className="comments-label">
          댓글 <span>{p.comments.length}</span>
        </div>
        <div>
          {p.comments.length === 0 ? (
            <div className="c-empty">아직 댓글이 없어요. 첫 댓글을 남겨보세요.</div>
          ) : (
            p.comments.map((c) => (
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
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          />
          <button className="comment-submit" onClick={submit} disabled={submitting}>
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
