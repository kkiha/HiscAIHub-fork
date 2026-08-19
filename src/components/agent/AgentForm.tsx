"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AgentDTO } from "@/lib/agents";
import { CATEGORIES, CATEGORY_GUIDE, RUN_TYPES } from "@/lib/categories";
import { TIME_BANDS } from "@/lib/time-band";
import { ArrowLeftIcon } from "@/components/icons";

export type AgentFormData = {
  cat: string;
  name: string;
  desc: string;
  runType: string;
  trigger: string;
  targetTask: string;
  tasks: string[];
  tools: string[];
  effect: string;
  timeBefore: string;
  timeAfter: string;
  prerequisites: string[];
  howToUse: string[];
  instructions: string;
  linkUrl: string;
};

// 등록 시 카테고리는 필수 선택이라 기본값을 비워 둔다(기획서 4.2 — 업무유형 집계 기준).
const EMPTY: AgentFormData = {
  cat: "",
  name: "",
  desc: "",
  runType: "",
  trigger: "",
  targetTask: "",
  tasks: [],
  tools: [],
  effect: "",
  timeBefore: "",
  timeAfter: "",
  prerequisites: [],
  howToUse: [],
  instructions: "",
  linkUrl: "",
};

// 산출물 섹션은 업로드 저장소가 정해진 뒤에 붙인다. 그때 4번 항목이 여기 추가된다.
const SECTIONS = [
  { n: 1, label: "기본 정보" },
  { n: 2, label: "무엇을, 왜" },
  { n: 3, label: "가져다 쓰는 방법" },
];

const lines = (s: string): string[] =>
  s
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

function initial(editing: AgentDTO | null): AgentFormData {
  if (!editing) return EMPTY;
  return {
    cat: editing.cat,
    name: editing.name,
    desc: editing.desc === "(설명 없음)" ? "" : editing.desc,
    runType: editing.runType,
    trigger: editing.trigger,
    targetTask: editing.targetTask,
    tasks: editing.tasks,
    tools: editing.tools,
    effect: editing.effect,
    timeBefore: editing.timeBefore ?? "",
    timeAfter: editing.timeAfter ?? "",
    prerequisites: editing.prerequisites,
    howToUse: editing.howToUse,
    instructions: editing.instructions,
    linkUrl: editing.linkUrl ?? "",
  };
}

export default function AgentForm({ editing }: { editing: AgentDTO | null }) {
  const router = useRouter();
  const base = initial(editing);

  const [form, setForm] = useState<AgentFormData>(base);
  // 줄바꿈 구분 입력은 편집 중 빈 줄을 허용해야 해서 문자열 상태로 따로 둔다.
  const [tasksText, setTasksText] = useState(base.tasks.join("\n"));
  const [toolsText, setToolsText] = useState(base.tools.join("\n"));
  const [prereqText, setPrereqText] = useState(base.prerequisites.join("\n"));
  const [howToText, setHowToText] = useState(base.howToUse.join("\n"));
  const [section, setSection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const selectedCategory = CATEGORY_GUIDE.find((category) => category.value === form.cat);

  const backHref = editing ? `/agents/${editing.id}` : "/";

  function set<K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    const data: AgentFormData = {
      ...form,
      name: form.name.trim(),
      desc: form.desc.trim(),
      trigger: form.trigger.trim(),
      targetTask: form.targetTask.trim(),
      effect: form.effect.trim(),
      instructions: form.instructions.trim(),
      linkUrl: form.linkUrl.trim(),
      tasks: lines(tasksText),
      tools: lines(toolsText),
      prerequisites: lines(prereqText),
      howToUse: lines(howToText),
    };

    if (!data.cat) {
      setError("업무 카테고리를 선택해주세요.");
      setSection(1);
      return;
    }
    if (!data.runType) {
      setError("실행 방식을 선택해주세요.");
      setSection(3);
      return;
    }

    setPending(true);
    setError(null);
    const res = await fetch(editing ? `/api/agents/${editing.id}` : "/api/agents", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setPending(false);

    if (!res.ok) {
      const e = await res.json();
      setError(e.error ?? (editing ? "저장에 실패했어요." : "등록에 실패했어요."));
      return;
    }
    const { agent } = await res.json();
    router.push(`/agents/${agent.id}`);
    router.refresh();
  }

  return (
    <>
      <div className="page wide">
        <div className="page-head">
          <button className="back-btn" onClick={() => router.push(backHref)}>
            <ArrowLeftIcon size={15} /> {editing ? "상세로" : "목록으로"}
          </button>
          <span className="crumb">{editing ? `/agents/${editing.id}/edit` : "/agents/new"}</span>
        </div>

        <div className="page-card">
          <div className="form-layout">
            <nav className="fs-nav">
              {SECTIONS.map((s) => (
                <a
                  key={s.n}
                  href={`#fs${s.n}`}
                  className={section === s.n ? "on" : ""}
                  onClick={() => setSection(s.n)}
                >
                  <span className="n">{s.n}</span>
                  {s.label}
                </a>
              ))}
              <div className="note">작성 중인 내용은 페이지를 벗어나면 사라져요. 다 채우고 등록해주세요.</div>
            </nav>

            <div className="form-body">
              <div className="form-title">{editing ? "에이전트 수정" : "에이전트 등록"}</div>
              <div className="form-sub">
                내가 만든 에이전트를 공유합니다. <b>개발을 모르는 동료가 이 글만 보고 그대로 따라 할
                수 있을 만큼</b> 적어주세요.
              </div>

              {/* 1. 기본 정보 */}
              <div className="form-section first" id="fs1">
                <div className="fs-title">
                  <span className="fs-num">1</span> 기본 정보
                </div>
                <p className="fs-sub">목록에서 보이는 부분이에요.</p>

                <div className="field">
                  <label>
                    에이전트 이름<span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="예) 리서치 브리핑 자동 발송 에이전트"
                  />
                </div>

                <div className="field">
                  <label>
                    카테고리<span className="req">*</span>
                  </label>
                  <select value={form.cat} onChange={(e) => set("cat", e.target.value)}>
                    <option value="" disabled>
                      선택해주세요
                    </option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {selectedCategory && (
                    <div className="hint">
                      {selectedCategory.desc}
                      <br />예: {selectedCategory.examples}
                    </div>
                  )}
                  <div className="hint">
                    업무 유형 기준이에요. 어떤 업무에 AI가 쓰이는지 집계하는 기준이 됩니다.
                    <br />헷갈리면 「이 에이전트가 없으면 손으로 무슨 일을 하게 되나」를 떠올려
                    보세요. 여러 개에 해당하면 <b>가장 마지막에 나오는 결과물</b>을 기준으로 골라
                    주세요.
                  </div>
                </div>

                <div className="field">
                  <label>
                    한 줄 소개<span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.desc}
                    onChange={(e) => set("desc", e.target.value)}
                    placeholder="예) 리포트를 넣으면 투자포인트와 리스크를 표로 정리해줍니다"
                  />
                </div>
              </div>

              {/* 2. 무엇을, 왜 */}
              <div className="form-section" id="fs2">
                <div className="fs-title">
                  <span className="fs-num">2</span> 무엇을, 왜
                </div>
                <p className="fs-sub">
                  이 에이전트가 어떤 업무를 대신하고 무엇이 좋아졌는지 적어주세요.
                </p>

                <div className="field">
                  <label>
                    어떤 업무를 위한 것인가요?<span className="req">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.targetTask}
                    onChange={(e) => set("targetTask", e.target.value)}
                    placeholder="이 에이전트가 없을 때 그 업무를 어떻게 하고 계셨는지도 함께 적어주시면, 읽는 사람이 자기 업무에 맞는지 바로 판단할 수 있어요."
                  />
                </div>

                <div className="field">
                  <label>
                    에이전트가 스스로 하는 일<span className="req">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={tasksText}
                    onChange={(e) => setTasksText(e.target.value)}
                    placeholder={
                      "한 줄에 하나씩 적어주세요\n포털 3곳에서 전날 신규 리포트를 스스로 수집\n같은 종목 리포트를 묶고 투자의견이 갈리는 건 표시"
                    }
                  />
                  <div className="hint">
                    「무엇을 시키면 답해준다」가 아니라 <b>에이전트가 알아서 하는 동작</b>을
                    적어주세요. 상세 화면에 번호가 붙은 흐름으로 보입니다.
                  </div>
                </div>

                <div className="field">
                  <label>
                    연결되는 도구 · 데이터<span className="req">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={toolsText}
                    onChange={(e) => setToolsText(e.target.value)}
                    placeholder={"한 줄에 하나씩\n사내 리서치 포털 (조회)\n사내 메일 (발송)"}
                  />
                  <div className="hint">
                    읽기만 하는지, 쓰기·발송까지 하는지 괄호로 함께 적어주세요.
                  </div>
                </div>

                <div className="field">
                  <label>
                    어떤 효과가 있었나요?<span className="req">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.effect}
                    onChange={(e) => set("effect", e.target.value)}
                    placeholder="시간이 얼마나 줄었는지, 품질·실수가 어떻게 달라졌는지 적어주세요."
                  />
                </div>

                <div className="time-row">
                  <div className="field">
                    <label>1회 실행당 기존 소요시간</label>
                    <select
                      value={form.timeBefore}
                      onChange={(e) => set("timeBefore", e.target.value)}
                    >
                      <option value="">선택 안 함</option>
                      {TIME_BANDS.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sep">→</div>
                  <div className="field">
                    <label>단축 후 소요시간</label>
                    <select
                      value={form.timeAfter}
                      onChange={(e) => set("timeAfter", e.target.value)}
                    >
                      <option value="">선택 안 함</option>
                      {TIME_BANDS.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="hint" style={{ marginTop: 6 }}>
                  사람마다 기준이 다른 자유 입력 대신 구간으로 받아요. 두 칸을 모두 고르면 목록
                  카드에 「1~3시간 → 10분 미만 · 약 96% 단축」 배지가 붙고, 전사 절감 시간 집계에
                  반영됩니다.
                </div>
              </div>

              {/* 3. 가져다 쓰는 방법 */}
              <div className="form-section" id="fs3">
                <div className="fs-title">
                  <span className="fs-num">3</span> 남들이 가져다 쓰는 방법
                </div>
                <p className="fs-sub">
                  이 부분이 가장 중요해요. 처음 보는 동료가 순서대로 따라 하면 되도록 적어주세요.
                </p>

                <div className="field">
                  <label>
                    실행 방식<span className="req">*</span>
                  </label>
                  <div className="radio-row">
                    {RUN_TYPES.map((r) => (
                      <button
                        type="button"
                        key={r.value}
                        className={`radio-card ${form.runType === r.value ? "on" : ""}`}
                        onClick={() => set("runType", r.value)}
                      >
                        <div className="rc-t">{r.label}</div>
                        <div className="rc-d">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>
                    언제 실행되나요?<span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.trigger}
                    onChange={(e) => set("trigger", e.target.value)}
                    placeholder={'예) 매일 오전 06:30 (평일) · 신규 티켓이 생성될 때마다 · "마감 점검해줘" 라고 부르면'}
                  />
                  <div className="hint">
                    스스로 도는 에이전트인지, 불러야 도는 에이전트인지가 여기서 갈립니다.
                  </div>
                </div>

                <div className="field">
                  <label>미리 준비할 것 (선택)</label>
                  <textarea
                    rows={3}
                    value={prereqText}
                    onChange={(e) => setPrereqText(e.target.value)}
                    placeholder={
                      "한 줄에 하나씩\n사내 리서치 포털 계정 (조회 권한)\n에이전트를 상시 켜둘 PC (IT기획팀에 신청)"
                    }
                  />
                </div>

                <div className="field">
                  <label>
                    사용 순서<span className="req">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={howToText}
                    onChange={(e) => setHowToText(e.target.value)}
                    placeholder="한 줄에 한 단계씩 적어주세요"
                  />
                  <div className="hint">
                    &quot;터미널에서 실행&quot; 같은 표현 대신 실제 눌러야 할 버튼과 폴더 이름을
                    적어주세요.
                  </div>
                </div>

                <div className="field">
                  <label>
                    에이전트 정의<span className="req">*</span>
                  </label>
                  <textarea
                    rows={6}
                    className="mono"
                    value={form.instructions}
                    onChange={(e) => set("instructions", e.target.value)}
                    placeholder={"name:\ndescription:\n\ntools:\n  - \n\n[작업 절차]\n1. \n\n[규칙]\n- "}
                  />
                  <div className="hint">
                    역할 · 사용 도구 · 작업 절차 · 규칙이 함께 들어가야 합니다. 다른 사람은 [정의
                    복사]로 이 내용을 받아갑니다.
                  </div>
                </div>

                {form.runType === "app" ? (
                  <div className="field">
                    <label>
                      접속 주소 · 봇 이름<span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.linkUrl}
                      onChange={(e) => set("linkUrl", e.target.value)}
                      placeholder="https://teams.hanwhawm.internal/bots/policy-qa"
                    />
                    <div className="hint">
                      이미 배포된 주소를 적어주세요. 상세 화면에 바로가기 버튼이 생깁니다.
                    </div>
                  </div>
                ) : (
                  <div className="field">
                    <label>참고 링크 (선택)</label>
                    <input
                      type="text"
                      value={form.linkUrl}
                      onChange={(e) => set("linkUrl", e.target.value)}
                      placeholder="사내 Git 저장소 · 공유드라이브 · 사용 안내 문서 주소"
                    />
                    <div className="hint">
                      Git 저장소 주소를 넣으면 「Git 연동 등록」으로 집계됩니다. 없으면 비워두세요.
                    </div>
                  </div>
                )}
              </div>

              <div className="warn-note">
                고객 정보 · 계좌번호 · 비공개 내부자료가 정의에 들어가지 않도록 확인해주세요. 등록한
                내용은 사내 임직원 전체에게 공개됩니다.
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="sticky-actions">
                <button className="btn-ghost" onClick={() => router.push(backHref)} disabled={pending}>
                  취소
                </button>
                <button className="btn-primary" onClick={handleSubmit} disabled={pending}>
                  {pending ? "저장 중…" : editing ? "수정 저장" : "등록하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
