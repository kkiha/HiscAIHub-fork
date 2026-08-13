"use client";

import { useEffect, useState } from "react";
import { CommentIcon, DocIcon, BotIcon } from "@/components/icons";

type NotificationDTO = {
  id: string;
  actor: string;
  ava: string;
  title: string;
  promptId: string | null;
  agentId: string | null;
  text: string | null;
  time: string;
};

export default function ActivityFeed({
  onOpenPrompt,
  onOpenAgent,
}: {
  onOpenPrompt: (id: string) => void;
  onOpenAgent: (id: string) => void;
}) {
  const [notifications, setNotifications] = useState<NotificationDTO[] | null>(null);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
      });
  }, []);

  if (!notifications) {
    return <p style={{ fontSize: 12.5, color: "var(--text-3)" }}>불러오는 중…</p>;
  }

  function openNotification(n: NotificationDTO) {
    if (n.promptId) onOpenPrompt(n.promptId);
    else if (n.agentId) onOpenAgent(n.agentId);
  }

  return (
    <div className="feed">
      <div className="feed-section">
        <h3>받은 알림</h3>
        {notifications.length === 0 ? (
          <div className="c-empty">아직 받은 알림이 없어요.</div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              className="feed-item"
              onClick={() => openNotification(n)}
              disabled={!n.promptId && !n.agentId}
            >
              <div className="feed-ava">
                {n.ava}
                <span className="feed-badge comment">
                  <CommentIcon size={9} stroke="#fff" />
                </span>
              </div>
              <div className="feed-text">
                <b>{n.actor}</b>님이 회원님의 {n.agentId ? "에이전트" : "프롬프트"} <span className="q">&apos;{n.title}&apos;</span>
                에 댓글을 남겼습니다.
                {n.text ? <div style={{ color: "var(--text-2)", marginTop: 3 }}>&quot;{n.text}&quot;</div> : null}
                <div className="feed-time">{n.time}</div>
              </div>
              <div className="feed-thumb">
                {n.agentId ? <BotIcon size={16} /> : <DocIcon size={16} />}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
