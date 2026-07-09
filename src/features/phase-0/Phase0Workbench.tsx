import { useMemo, useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import {
  createPhase0EditableDraft,
  createPhase0Judgement,
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
  drafts: "草稿",
  unsafe: "不能直接行動",
  review: "需要人工確認",
};

const kindOptions: Array<{ value: Phase0PossibleKind; label: string }> = [
  { value: "unknown", label: "候選類型待判斷" },
  { value: "help_request_candidate", label: "求助候選" },
  { value: "site_status_candidate", label: "地點狀態候選" },
  { value: "task_candidate", label: "任務候選" },
  { value: "assignment_candidate", label: "人員指派候選" },
  { value: "announcement_candidate", label: "公告候選" },
];

const draftStatusOptions: Array<{ value: Phase0DraftStatus; label: string }> = [
  { value: "draft", label: "草稿" },
  { value: "needs_human_review", label: "待人工確認" },
  { value: "human_reviewed", label: "人工已看過" },
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
  { value: "ask_for_more_info", label: "補問來源或現場資訊" },
  { value: "send_to_human_review", label: "交給人工確認" },
  { value: "create_candidate_report", label: "建立候選通報" },
  { value: "create_site_update_suggestion", label: "建立地點更新建議" },
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
  const safetyBoundary = createPhase0Judgement(selectedRecord);
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
        <div className="workbench__summary" aria-label="整理草稿摘要">
          <button
            className={summaryFilter === "drafts" ? "active" : ""}
            type="button"
            onClick={() => showSummaryCategory("drafts")}
          >
            <span>草稿</span>
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
          目前篩選：{summaryFilterLabels[summaryFilter]}。紅色小卡是 AI
          候選的優先人工確認項目，不代表已確認或可直接派工。
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
                    ? `草稿狀態：${draftStatusLabels[draft.draftStatus]}`
                    : "尚未建草稿"}{" "}
                  ·{" "}
                  {draft && savedDraftIds.has(record.id) ? "已儲存" : "未儲存"}{" "}
                  · {needsHumanReview(record) ? "需人工確認" : "可先保留"}
                </span>
                <span
                  className={`priority-badge priority-badge--${reviewSignal.level}`}
                >
                  {record.id === priorityCandidateId
                    ? "AI 候選：最高優先人工確認"
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

          {selectedDraft ? (
            <article className="draft-editor">
              <div className="draft-editor__header">
                <div>
                  <p className="eyebrow">可編輯整理草稿</p>
                  <h3>{selectedRecord.id} 候選判斷</h3>
                </div>
                <span
                  className={`save-badge ${
                    selectedDraftIsSaved ? "save-badge--saved" : ""
                  }`}
                >
                  {selectedDraftIsSaved ? "已儲存" : "未儲存變更"}
                </span>
              </div>

              <p>
                這是小組可修改的候選整理，不是已確認事實。所有欄位都應回到原文找依據，不能直接變成志工任務。
              </p>

              <section className="draft-section">
                <div className="draft-section__title">
                  <span>1</span>
                  <h4>快速整理</h4>
                </div>
                <div className="draft-editor__grid">
                  <label>
                    草稿狀態
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
                    候選類型
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
                    建議下一步
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
              </section>

              <section className="draft-section">
                <div className="draft-section__title">
                  <span>2</span>
                  <h4>人工確認筆記</h4>
                </div>
                <label>
                  筆記
                  <textarea
                    value={selectedDraft.humanReviewNote ?? ""}
                    onChange={(event) =>
                      updateSelectedDraft({
                        humanReviewNote: event.target.value,
                      })
                    }
                  />
                </label>
              </section>

              <section className="draft-section draft-section--compact">
                <div className="draft-section__title">
                  <span>!</span>
                  <h4>自動保留的安全提醒</h4>
                </div>
                <ul className="draft-summary-list">
                  {[...selectedDraft.evidence, ...selectedDraft.blockers].map(
                    (item) => (
                      <li key={item}>{item}</li>
                    ),
                  )}
                </ul>
              </section>

              {selectedNeedsReview ? (
                <p className="draft-editor__warning">
                  這筆資訊目前需要人工確認；若操作者不是當事人，還要確認授權、位置與現況。
                </p>
              ) : null}

              <div className="draft-editor__actions">
                <button type="button" onClick={saveSelectedDraft}>
                  儲存草稿
                </button>
                <button
                  type="button"
                  onClick={() => upsertDraft(selectedRecord)}
                >
                  重設這筆草稿
                </button>
                <button type="button" onClick={deleteSelectedDraft}>
                  刪除這筆草稿
                </button>
              </div>
            </article>
          ) : (
            <article className="draft-editor">
              <div className="draft-editor__header">
                <div>
                  <p className="eyebrow">尚未建立草稿</p>
                  <h3>{selectedRecord.id} 還沒有整理草稿</h3>
                </div>
              </div>
              <p>
                可以先保留原始資訊，也可以建立一張保守草稿，再由小組人工修正。
              </p>
              <button type="button" onClick={() => upsertDraft(selectedRecord)}>
                建立整理草稿
              </button>
            </article>
          )}

          <Phase0JudgementCard
            judgement={safetyBoundary}
            record={selectedRecord}
          />
        </div>

        <aside className="workbench__checklist">
          <h3>本頁進度</h3>
          <ul>
            <li>
              已載入 <strong>{records.length}</strong> 筆原始資訊
            </li>
            <li>
              已建立 <strong>{draftCount}</strong> 筆可編輯草稿
            </li>
            <li>
              <strong>{unsafeDraftCount}</strong> 筆標示不能直接變成任務
            </li>
            <li>
              <strong>{reviewDraftCount}</strong> 筆需要人工確認或補問來源
            </li>
            <li>請挑至少 2 個候選判斷由人類質疑或修正</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              setDrafts(initialDrafts);
              setSavedDraftIds(new Set());
            }}
          >
            重設全部草稿
          </button>
        </aside>
      </div>
    </div>
  );
}
