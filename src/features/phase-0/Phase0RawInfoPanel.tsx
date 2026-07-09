import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import {
  getPhase0PriorityReviewCandidateId,
  getPhase0ReviewSignal,
} from "./phase0-heuristics";
import type { Phase0MessyRecord, Phase0RawStatusFilter } from "./phase0-types";

const filterLabels: Record<Phase0RawStatusFilter, string> = {
  all: "全部原始資訊",
  needs_review: "待人工確認",
  unverified: "未查核",
};

export function Phase0RawInfoPanel({
  records,
  statusFilter,
  onStatusFilterChange,
  selectedRecordId,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  statusFilter: Phase0RawStatusFilter;
  onStatusFilterChange: (filter: Phase0RawStatusFilter) => void;
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  const visibleRecords =
    statusFilter === "all"
      ? records
      : records.filter((record) => record.verificationStatus === statusFilter);
  const priorityCandidateId = getPhase0PriorityReviewCandidateId(records);

  return (
    <div className="phase0-raw">
      <div className="panel__header">
        <div>
          <h2>原始資訊</h2>
          <p>先看原文、來源與查核狀態；這些還不是整理後資料。</p>
        </div>
        <p>{visibleRecords.length} 筆資料</p>
      </div>

      <div className="filter-notice">
        <span>目前分類：{filterLabels[statusFilter]}</span>
        {statusFilter !== "all" ? (
          <button type="button" onClick={() => onStatusFilterChange("all")}>
            顯示全部
          </button>
        ) : null}
      </div>

      <div className="grid">
        {visibleRecords.map((record) =>
          (() => {
            const reviewSignal = getPhase0ReviewSignal(record);
            const isPriorityCandidate = record.id === priorityCandidateId;

            return (
              <article
                className={`record-card record-card--${reviewSignal.level} ${
                  record.id === selectedRecordId ? "record-card--selected" : ""
                }`}
                key={record.id}
              >
                <div className="record-card__header">
                  <h3>{record.id}</h3>
                  <StatusBadge status={record.verificationStatus} />
                </div>
                <p>{record.rawText}</p>
                <div className="record-card__meta">
                  <span>
                    來源：
                    <SourceLabel sourceType={record.sourceType} />
                  </span>
                  <span>查核：尚未成為已確認資料</span>
                  <span>更新：{formatDateTime(record.updatedAt)}</span>
                </div>
                <p
                  className={`priority-note priority-note--${reviewSignal.level}`}
                >
                  {isPriorityCandidate
                    ? "AI 候選：最高優先人工確認。"
                    : reviewSignal.label}
                </p>
                <p className="record-card__notice">不能直接當成任務或公告。</p>
                <button type="button" onClick={() => onSelect(record.id)}>
                  整理這筆
                </button>
              </article>
            );
          })(),
        )}
      </div>
    </div>
  );
}
