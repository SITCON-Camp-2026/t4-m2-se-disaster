import { useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0RawInfoPanel } from "../features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import type {
  Phase0MessyRecord,
  Phase0RawStatusFilter,
} from "../features/phase-0/phase0-types";

type TabKey = "raw" | "workbench";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "raw", label: "1 原始資訊" },
  { key: "workbench", label: "2 整理工作台" },
];

const v1Tabs: Array<{ key: TabKey; label: string }> = [
  { key: "raw", label: "1 原始資訊" },
  { key: "workbench", label: "2 行動者工作台" },
];

const phase0Records = messyReports satisfies Phase0MessyRecord[];
const reviewRecordCount = phase0Records.filter(
  (record) => record.verificationStatus === "needs_review",
).length;
const unverifiedRecordCount = phase0Records.filter(
  (record) => record.verificationStatus === "unverified",
).length;

export function App() {
  const isV1Route =
    window.location.pathname.replace(/\/+$/, "") === "/v1" ||
    window.location.pathname === "/v1/";
  const [activeTab, setActiveTab] = useState<TabKey>(
    isV1Route ? "workbench" : "raw",
  );
  const [rawStatusFilter, setRawStatusFilter] =
    useState<Phase0RawStatusFilter>("all");
  const [selectedRecordId, setSelectedRecordId] = useState(
    phase0Records[0]?.id ?? "",
  );
  const visibleTabs = isV1Route ? v1Tabs : tabs;

  function selectForWorkbench(recordId: string) {
    setSelectedRecordId(recordId);
    setActiveTab("workbench");
  }

  function showRawCategory(filter: Phase0RawStatusFilter) {
    setRawStatusFilter(filter);
    setActiveTab("raw");
  }

  return (
    <main className={`layout ${isV1Route ? "layout--war-room" : ""}`}>
      <header className="hero">
        <div>
          <p className="eyebrow">
            SITCON Camp 2026 / {isV1Route ? "v1" : "Phase 0"}
          </p>
          <h1>{isV1Route ? "行動者線索工作台" : "災害資訊整理工作台"}</h1>
          <p>
            {isV1Route
              ? "依 docs/flow.md 實作：行動者先確認資訊停在哪裡，避免把未確認線索誤當成可行動任務。"
              : "先看原始資訊，再建立整理筆記；所有未確認內容都維持待人工確認。"}
          </p>
          {isV1Route ? (
            <a className="hero__link" href="/">
              回到 Phase 0
            </a>
          ) : (
            <a className="hero__link" href="/v1/">
              進入 v1 行動者工作台
            </a>
          )}
        </div>
        <div className="hero__stats" aria-label="原始資訊摘要">
          <button
            className={rawStatusFilter === "all" ? "active" : ""}
            type="button"
            onClick={() => showRawCategory("all")}
          >
            <strong>{phase0Records.length}</strong>
            <span>原始資訊</span>
          </button>
          <button
            className={rawStatusFilter === "needs_review" ? "active" : ""}
            type="button"
            onClick={() => showRawCategory("needs_review")}
          >
            <strong>{reviewRecordCount}</strong>
            <span>待人工確認</span>
          </button>
          <button
            className={rawStatusFilter === "unverified" ? "active" : ""}
            type="button"
            onClick={() => showRawCategory("unverified")}
          >
            <strong>{unverifiedRecordCount}</strong>
            <span>未查核</span>
          </button>
        </div>
      </header>

      <nav
        className="tabs"
        aria-label={isV1Route ? "v1 行動者工作區" : "第一階段工作區"}
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="panel">
        {phase0Records.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : activeTab === "raw" ? (
          <Phase0RawInfoPanel
            records={phase0Records}
            statusFilter={rawStatusFilter}
            onStatusFilterChange={setRawStatusFilter}
            selectedRecordId={selectedRecordId}
            onSelect={selectForWorkbench}
          />
        ) : (
          <Phase0Workbench
            records={phase0Records}
            selectedRecordId={selectedRecordId}
            onSelect={setSelectedRecordId}
          />
        )}
      </section>
    </main>
  );
}
