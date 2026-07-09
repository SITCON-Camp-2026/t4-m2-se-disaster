import type {
  Phase0JudgementDraft,
  Phase0MessyRecord,
  Phase0ReviewSignalLevel,
} from "./phase0-types";

export function createPhase0Judgement(
  record: Phase0MessyRecord,
): Phase0JudgementDraft {
  const isVerified = record.verificationStatus === "verified";

  return {
    messyRecordId: record.id,
    possibleKind: "unknown",
    confidence: "low",
    evidence: ["尚未建立整理草稿：請由小組從原文標出判斷依據。"],
    blockers: isVerified
      ? ["仍需確認這筆資訊適合進入哪個後續流程。"]
      : ["目前不是已確認資訊，不能直接行動或當成事實發布。"],
    suggestedNextStep: isVerified ? "keep_raw" : "send_to_human_review",
    unsafeToActDirectly: true,
    draftStatus: "needs_human_review",
  };
}

export function createPhase0EditableDraft(
  record: Phase0MessyRecord,
): Phase0JudgementDraft {
  const rawText = record.rawText;
  const hasConcreteUpdate =
    rawText.includes("確認") ||
    rawText.includes("預計") ||
    rawText.includes("約剩") ||
    rawText.includes("14:");
  const hasProxyOperator =
    rawText.includes("代一位") ||
    rawText.includes("家屬") ||
    rawText.includes("有人在群組") ||
    rawText.includes("有人說");
  const hasConflict =
    rawText.includes("但") ||
    rawText.includes("不知道") ||
    rawText.includes("不確定") ||
    rawText.includes("尚未");

  return {
    messyRecordId: record.id,
    possibleKind: hasConcreteUpdate ? "site_status_candidate" : "unknown",
    confidence: hasConcreteUpdate && !hasConflict ? "medium" : "low",
    evidence: [
      hasConcreteUpdate
        ? "原文包含較具體的時間、數量或現場更新，可先作為候選整理。"
        : "原文資訊不足，先保留為待判斷草稿。",
    ],
    blockers: [
      record.verificationStatus === "verified"
        ? "即使來源較完整，仍需確認是否能進入後續流程。"
        : "查核狀態不是已確認，不能直接當成事實或行動依據。",
      hasProxyOperator
        ? "操作者或轉述者可能不是當事人，需要確認同意、位置或現況。"
        : "仍需補上來源、時間、地點或責任角色等缺口。",
    ],
    suggestedNextStep: hasConcreteUpdate
      ? "create_site_update_suggestion"
      : "send_to_human_review",
    unsafeToActDirectly: true,
    draftStatus: "needs_human_review",
    humanReviewNote: hasProxyOperator
      ? "先確認轉述者、當事人同意與現場狀況，不要直接派任務。"
      : "請小組對照原文確認這只是候選整理。",
  };
}

function scoreReviewSignal(record: Phase0MessyRecord) {
  const rawText = record.rawText;
  let score = 0;

  if (/\d{1,2}:\d{2}/.test(rawText)) score += 3;
  if (/\d+/.test(rawText)) score += 2;
  if (rawText.includes("確認")) score += 2;
  if (rawText.includes("預計")) score += 1;
  if (rawText.includes("只接受") || rawText.includes("不要")) score += 2;
  if (rawText.includes("封閉") || rawText.includes("淹水")) score += 2;
  if (rawText.includes("藥品")) score += 2;
  if (rawText.includes("不知道") || rawText.includes("不確定")) score -= 2;
  if (rawText.includes("尚未")) score -= 1;

  return score;
}

export function getPhase0ReviewSignal(record: Phase0MessyRecord): {
  level: Phase0ReviewSignalLevel;
  label: string;
} {
  const score = scoreReviewSignal(record);

  if (score >= 6) {
    return { level: "high", label: "AI 候選：高優先人工確認" };
  }

  if (score >= 3) {
    return { level: "medium", label: "AI 候選：中優先人工確認" };
  }

  return { level: "low", label: "AI 候選：一般人工確認" };
}

export function getPhase0PriorityReviewCandidateId(
  records: Phase0MessyRecord[],
) {
  const scoredRecords = records.map((record) => ({
    id: record.id,
    score: scoreReviewSignal(record),
  }));

  return scoredRecords.sort((left, right) => right.score - left.score)[0]?.id;
}
