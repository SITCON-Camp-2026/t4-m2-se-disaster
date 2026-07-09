import { useMemo, useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import {
  createPhase0EditableDraft,
  getPhase0PriorityReviewCandidateId,
  getPhase0ReviewSignal,
} from "./phase0-heuristics";
import type {
  Phase0DraftStatus,
  Phase0JudgementDraft,
  Phase0MessyRecord,
  Phase0PossibleKind,
  Phase0SuggestedNextStep,
} from "./phase0-types";

type WorkbenchSummaryFilter = "drafts" | "unsafe" | "review";

const summaryFilterLabels: Record<WorkbenchSummaryFilter, string> = {
  drafts: "整理筆記",
  unsafe: "不能直接行動",
  review: "需要人工確認",
};

const kindOptions: Array<{ value: Phase0PossibleKind; label: string }> = [
  { value: "unknown", label: "原文可能涉及：待判斷" },
  { value: "help_request_candidate", label: "原文可能涉及求助" },
  { value: "site_status_candidate", label: "原文可能涉及地點狀態" },
  { value: "task_candidate", label: "原文可能涉及任務樣貌" },
  { value: "assignment_candidate", label: "原文可能涉及人員安排" },
  { value: "announcement_candidate", label: "原文可能涉及公告" },
];

const draftStatusOptions: Array<{ value: Phase0DraftStatus; label: string }> = [
  { value: "draft", label: "整理中" },
  { value: "needs_human_review", label: "待人工確認" },
  {
    value: "human_reviewed",
    label: "仍待確認：僅已閱讀原文，尚未查證",
  },
  { value: "do_not_use", label: "暫不使用" },
];

const draftStatusLabels: Record<Phase0DraftStatus, string> = Object.fromEntries(
  draftStatusOptions.map((option) => [option.value, option.label]),
) as Record<Phase0DraftStatus, string>;

const nextStepOptions: Array<{
  value: Phase0SuggestedNextStep;
  label: string;
}> = [
  { value: "keep_raw", label: "先保留原始資訊" },
  { value: "ask_for_more_info", label: "確認方向：補問來源或現場資訊" },
  { value: "send_to_human_review", label: "確認方向：交由具權限人員查核" },
  { value: "create_candidate_report", label: "加入待查通報線索" },
  { value: "create_site_update_suggestion", label: "加入待查地點線索" },
  { value: "do_not_use_yet", label: "暫時不要使用" },
];

function createInitialDrafts(records: Phase0MessyRecord[]) {
  const priorityCandidateId = getPhase0PriorityReviewCandidateId(records);
  const starterRecords = records.slice(0, 6);
  const priorityRecord = records.find(
    (record) => record.id === priorityCandidateId,
  );
  const draftRecords =
    priorityRecord &&
    !starterRecords.some((record) => record.id === priorityRecord.id)
      ? [...starterRecords.slice(0, 5), priorityRecord]
      : starterRecords;

  return Object.fromEntries(
    draftRecords.map((record) => [
      record.id,
      createPhase0EditableDraft(record),
    ]),
  );
}

function needsHumanReview(record: Phase0MessyRecord) {
  return (
    record.verificationStatus !== "verified" ||
    record.rawText.includes("代一位") ||
    record.rawText.includes("家屬") ||
    record.rawText.includes("不確定") ||
    record.rawText.includes("不知道")
  );
}

function getActionBoundary(
  record: Phase0MessyRecord,
  draft?: Phase0JudgementDraft,
) {
  if (draft?.draftStatus === "do_not_use") {
    return {
      title: "目前只能保留紀錄",
      detail: "不能作為準備、出發或派工依據。",
    };
  }

  if (draft?.unsafeToActDirectly || needsHumanReview(record)) {
    return {
      title: "目前只能閱讀與等待確認",
      detail: "看似急迫或已保存都不是已確認；行動者不能出發。",
    };
  }

  return {
    title: "目前仍不可自行行動",
    detail: "進入正式流程前，仍需確認來源、現場、同意與責任角色。",
  };
}

export function Phase0Workbench({
  records,
  selectedRecordId,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  const initialDrafts = useMemo(() => createInitialDrafts(records), [records]);
  const [drafts, setDrafts] =
    useState<Record<string, Phase0JudgementDraft>>(initialDrafts);
  const [savedDraftIds, setSavedDraftIds] = useState<Set<string>>(new Set());
  const [summaryFilter, setSummaryFilter] =
    useState<WorkbenchSummaryFilter>("drafts");
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const priorityCandidateId = getPhase0PriorityReviewCandidateId(records);
  const selectedDraft = drafts[selectedRecord.id];
  const draftCount = Object.keys(drafts).length;
  const unsafeDraftCount = Object.values(drafts).filter(
    (draft) => draft.unsafeToActDirectly,
  ).length;
  const reviewDraftCount = Object.keys(drafts).filter((recordId) => {
    const record = records.find((item) => item.id === recordId);

    return record ? needsHumanReview(record) : false;
  }).length;
  const selectedNeedsReview = needsHumanReview(selectedRecord);
  const selectedDraftIsSaved = savedDraftIds.has(selectedRecord.id);
  const actionBoundary = getActionBoundary(selectedRecord, selectedDraft);
  const visibleQueueRecords = records.filter((record) => {
    const draft = drafts[record.id];

    if (summaryFilter === "drafts") {
      return Boolean(draft);
    }

    if (summaryFilter === "unsafe") {
      return Boolean(draft?.unsafeToActDirectly);
    }

    return Boolean(draft) && needsHumanReview(record);
  });

  function showSummaryCategory(filter: WorkbenchSummaryFilter) {
    const nextRecords = records.filter((record) => {
      const draft = drafts[record.id];

      if (filter === "drafts") {
        return Boolean(draft);
      }

      if (filter === "unsafe") {
        return Boolean(draft?.unsafeToActDirectly);
      }

      return Boolean(draft) && needsHumanReview(record);
    });

    setSummaryFilter(filter);

    if (
      nextRecords.length > 0 &&
      !nextRecords.some((record) => record.id === selectedRecord.id)
    ) {
      onSelect(nextRecords[0].id);
    }
  }

  function upsertDraft(record: Phase0MessyRecord) {
    setDrafts((current) => ({
      ...current,
      [record.id]: createPhase0EditableDraft(record),
    }));
    setSavedDraftIds((current) => {
      const next = new Set(current);

      next.delete(record.id);

      return next;
    });
  }

  function updateSelectedDraft(patch: Partial<Phase0JudgementDraft>) {
    setDrafts((current) => {
      const currentDraft =
        current[selectedRecord.id] ?? createPhase0EditableDraft(selectedRecord);

      return {
        ...current,
        [selectedRecord.id]: {
          ...currentDraft,
          ...patch,
        },
      };
    });
    setSavedDraftIds((current) => {
      const next = new Set(current);

      next.delete(selectedRecord.id);

      return next;
    });
  }

  function saveSelectedDraft() {
    if (!selectedDraft) {
      return;
    }

    setSavedDraftIds((current) => {
      const next = new Set(current);

      next.add(selectedRecord.id);

      return next;
    });
  }

  function deleteSelectedDraft() {
    setDrafts((current) => {
      const next = { ...current };

      delete next[selectedRecord.id];

      return next;
    });
    setSavedDraftIds((current) => {
      const next = new Set(current);

      next.delete(selectedRecord.id);

      return next;
    });
  }

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <div>
          <p className="eyebrow">整理工作台</p>
          <h2>
            第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。
          </h2>
        </div>
        <div className="workbench__summary" aria-label="整理筆記摘要">
          <button
            className={summaryFilter === "drafts" ? "active" : ""}
            type="button"
            onClick={() => showSummaryCategory("drafts")}
          >
            <span>整理筆記</span>
            <strong>{draftCount}</strong>
          </button>
          <button
            className={summaryFilter === "unsafe" ? "active" : ""}
            type="button"
            onClick={() => showSummaryCategory("unsafe")}
          >
            <span>不能直接行動</span>
            <strong>{unsafeDraftCount}</strong>
          </button>
          <button
            className={summaryFilter === "review" ? "active" : ""}
            type="button"
            onClick={() => showSummaryCategory("review")}
          >
            <span>需要人工確認</span>
            <strong>{reviewDraftCount}</strong>
          </button>
        </div>
        <p className="workbench__filter-note">
          目前篩選：{summaryFilterLabels[summaryFilter]}
          。紅色小卡表示原文看似急迫或資訊較完整，不代表已確認、真實緊急或可直接派工。
        </p>
      </div>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇原始資訊">
          <div className="workbench__queue-header">
            <h3>選擇一筆</h3>
            <span>{visibleQueueRecords.length} 筆</span>
          </div>
          {visibleQueueRecords.map((record) => {
            const draft = drafts[record.id];
            const reviewSignal = getPhase0ReviewSignal(record);

            return (
              <button
                className={`${record.id === selectedRecord.id ? "active" : ""} queue-item--${reviewSignal.level}`}
                key={record.id}
                type="button"
                onClick={() => onSelect(record.id)}
              >
                <span className="queue-item__top">
                  <strong>{record.id}</strong>
                  <StatusBadge status={record.verificationStatus} />
                </span>
                <span className="queue-item__meta">
                  {draft
                    ? `整理狀態：${draftStatusLabels[draft.draftStatus]}`
                    : "尚未記錄"}{" "}
                  ·{" "}
                  {draft && savedDraftIds.has(record.id)
                    ? "已保存筆記"
                    : "未保存筆記"}{" "}
                  · {needsHumanReview(record) ? "需人工確認" : "可先保留"}
                </span>
                <span
                  className={`priority-badge priority-badge--${reviewSignal.level}`}
                >
                  {record.id === priorityCandidateId
                    ? "AI 提醒：看似急迫，仍待人工確認"
                    : reviewSignal.label}
                </span>
              </button>
            );
          })}
        </aside>

        <div className="workbench__main">
          <section className="selected-record-bar" aria-label="目前處理資訊">
            <div>
              <p className="eyebrow">目前處理</p>
              <h3>{selectedRecord.id}</h3>
            </div>
            <div className="selected-record-bar__badges">
              <StatusBadge status={selectedRecord.verificationStatus} />
              {selectedNeedsReview ? (
                <span className="review-badge">需人工確認</span>
              ) : null}
            </div>
          </section>

          <RecordCard record={selectedRecord} />

          <section className="action-boundary" aria-label="目前行動邊界">
            <strong>{actionBoundary.title}</strong>
            <span>{actionBoundary.detail}</span>
          </section>

          {selectedDraft ? (
            <article className="draft-editor">
              <div className="draft-editor__header">
                <div>
                  <p className="eyebrow">可編輯整理筆記</p>
                  <h3>{selectedRecord.id} 閱讀判斷筆記</h3>
                </div>
                <span
                  className={`save-badge ${
                    selectedDraftIsSaved ? "save-badge--saved" : ""
                  }`}
                >
                  {selectedDraftIsSaved ? "已保存筆記" : "未保存變更"}
                </span>
              </div>

              <p>
                這是小組可修改的閱讀筆記，不是已確認事實。所有欄位都應回到原文找依據，不能直接變成志工任務。
              </p>

              <section className="draft-section">
                <div className="draft-section__title">
                  <span>1</span>
                  <h4>快速整理</h4>
                </div>
                <div className="draft-editor__grid">
                  <label>
                    整理狀態
                    <select
                      value={selectedDraft.draftStatus}
                      onChange={(event) =>
                        updateSelectedDraft({
                          draftStatus: event.target.value as Phase0DraftStatus,
                        })
                      }
                    >
                      {draftStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    原文可能涉及
                    <select
                      value={selectedDraft.possibleKind}
                      onChange={(event) =>
                        updateSelectedDraft({
                          possibleKind: event.target
                            .value as Phase0PossibleKind,
                        })
                      }
                    >
                      {kindOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    確認方向
                    <select
                      value={selectedDraft.suggestedNextStep}
                      onChange={(event) =>
                        updateSelectedDraft({
                          suggestedNextStep: event.target
                            .value as Phase0SuggestedNextStep,
                        })
                      }
                    >
                      {nextStepOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="draft-editor__checkbox">
                  <input
                    type="checkbox"
                    checked={selectedDraft.unsafeToActDirectly}
                    onChange={(event) =>
                      updateSelectedDraft({
                        unsafeToActDirectly: event.target.checked,
                      })
                    }
                  />
                  不能直接變成任務或行動
                </label>

                <p className="draft-editor__note">
                  目前輸出只能是原文、待查線索、人工確認原因與不可行動邊界；待查通報線索或待查地點線索都不是正式任務。
                </p>
              </section>

              <section className="draft-section">
                <div className="draft-section__title">
                  <span>2</span>
                  <h4>人工確認筆記</h4>
                </div>
                <label>
                  筆記：請寫下為什麼需要確認
                  <textarea
                    placeholder="例如：缺來源、缺時間、缺當事人同意、AI 有推測、原文互相矛盾。"
                    value={selectedDraft.humanReviewNote ?? ""}
                    onChange={(event) =>
                      updateSelectedDraft({
                        humanReviewNote: event.target.value,
                      })
                    }
                  />
                </label>
              </section>

              {selectedNeedsReview ? (
                <p className="draft-editor__warning">
                  這筆資訊目前需要人工確認；若操作者不是當事人，還要確認授權、位置與現況。
                </p>
              ) : null}

              <div className="draft-editor__actions">
                <button type="button" onClick={saveSelectedDraft}>
                  保存整理筆記
                </button>
                <button
                  type="button"
                  onClick={() => upsertDraft(selectedRecord)}
                >
                  重設這筆筆記
                </button>
                <button type="button" onClick={deleteSelectedDraft}>
                  刪除這筆筆記
                </button>
              </div>
            </article>
          ) : (
            <article className="draft-editor">
              <div className="draft-editor__header">
                <div>
                  <p className="eyebrow">尚未建立筆記</p>
                  <h3>{selectedRecord.id} 還沒有整理筆記</h3>
                </div>
              </div>
              <p>
                可以先保留原始資訊，也可以建立一份保守閱讀筆記，再由小組人工修正。
              </p>
              <button type="button" onClick={() => upsertDraft(selectedRecord)}>
                建立整理筆記
              </button>
            </article>
          )}
        </div>

        <aside className="workbench__checklist">
          <h3>人工確認門檻</h3>
          <ul>
            <li>
              已載入 <strong>{records.length}</strong> 筆原始資訊
            </li>
            <li>
              已建立 <strong>{draftCount}</strong> 筆閱讀筆記
            </li>
            <li>
              <strong>{unsafeDraftCount}</strong> 筆標示不能直接變成任務
            </li>
            <li>
              <strong>{reviewDraftCount}</strong> 筆需要人工確認或補問來源
            </li>
            <li>請挑至少 2 個閱讀判斷由人類質疑或修正</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              setDrafts(initialDrafts);
              setSavedDraftIds(new Set());
            }}
          >
            重設全部筆記
          </button>
        </aside>
      </div>
    </div>
  );
}
