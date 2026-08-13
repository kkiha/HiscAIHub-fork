"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { BulbIcon, SearchIcon } from "@/components/icons";
import "@/styles/login.css";

const initial: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <div className="login-page">
      {/* 좌측 브랜딩 (데모 그대로) */}
      <div className="login-left">
        <div className="login-left-logo">
          <div className="login-left-logo-sq">
            <BulbIcon size={15} />
          </div>
          <div>
            <div className="login-left-logo-name">AI 공유 허브</div>
            <div className="login-left-logo-sub">한화투자증권 임직원 전용</div>
          </div>
        </div>

        <div className="login-left-copy">
          <h2>
            동료의 프롬프트로
            <br />
            업무를 더 빠르게
          </h2>
          <p>
            임직원이 직접 만들고 검증한 Claude 프롬프트를
            <br />한 곳에서 찾고 바로 활용해보세요.
          </p>
        </div>

        <div className="login-features">
          <div className="login-feat">
            <div className="login-feat-icon">
              <SearchIcon size={15} />
            </div>
            <div>
              <div className="login-feat-title">업무별 프롬프트 탐색</div>
              <div className="login-feat-desc">
                보고서, 리서치, 고객응대, 코딩 등 직무별로 검증된 프롬프트를 바로 복사해 사용
              </div>
            </div>
          </div>
          <div className="login-feat">
            <div className="login-feat-icon">
              <UploadMini />
            </div>
            <div>
              <div className="login-feat-title">나만의 프롬프트 공유</div>
              <div className="login-feat-desc">
                잘 만든 프롬프트를 등록하고 동료의 반응을 확인해보세요
              </div>
            </div>
          </div>
          <div className="login-feat">
            <div className="login-feat-icon">
              <ActivityMini />
            </div>
            <div>
              <div className="login-feat-title">실행 · 댓글 · 복사</div>
              <div className="login-feat-desc">
                실제로 많이 쓰이는 프롬프트가 자연스럽게 상위에 노출
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 우측 로그인 폼 */}
      <div className="login-right">
        <div className="login-box">
          <div className="login-greeting">안녕하세요 👋</div>
          <div className="login-sub">
            회사 이메일과 비밀번호를 입력하면
            <br />별도 가입 없이 바로 이용할 수 있어요.
          </div>

          <form action={formAction}>
            <div className="login-field">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                placeholder="name@hanwha.com"
              />
              <div className="login-field-hint">@hanwha.com 계정만 로그인 가능합니다</div>
            </div>
            <div className="login-field">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <button className="login-btn" type="submit" disabled={pending}>
              {pending ? "로그인 중…" : "로그인"}
            </button>
          </form>

          {state.error ? <div className="login-error">{state.error}</div> : null}

          <div className="login-notice">
            <ShieldMini />
            <p>
              <strong>임직원 전용 서비스입니다.</strong>
              <br />
              @hanwha.com 계정 외에는 접근이 제한되며, 계정 문의는 AI Roll-up TFT로 연락해주세요.
            </p>
          </div>

          <div className="login-footer-note">
            문의 · 오류 신고: AI Roll-up TFT
            <br />© 2026 Hanwha Investment Securities
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadMini() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

function ActivityMini() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13a8 8 0 0 1 8-8 8.7 8.7 0 0 1 6 2.4L20 9" />
      <path d="M20 4v5h-5" />
      <path d="M20 13a8 8 0 0 1-8 8 8.7 8.7 0 0 1-6-2.4L4 17" />
      <path d="M4 22v-5h5" />
    </svg>
  );
}

function ShieldMini() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
