# AI Log

這份紀錄用來留下小組如何使用 AI / Coding Agent 的操作脈絡。重點不是逐字保存所有對話，而是記錄重要協作、取捨與人類判斷。

## 什麼時候要記錄

請在以下情況更新本檔案：

- AI 協助分析原始資訊。
- AI 協助找出不能判斷處。
- AI 協助判斷哪些資訊不能直接相信。
- AI 協助判斷哪些資訊不能直接變成任務。
- AI 協助修改畫面標示或前端工作台。
- AI 可能補了原文沒有的資訊。
- AI 建議被小組拒絕，且拒絕原因和安全 / 正確性 / scope 有關
- AI 輸出可能造成誤導，例如把未確認資料寫成已確認事實

## 不需要記錄

- 不需要逐字貼完整對話
- 不需要記錄每一次小型 autocomplete
- 不需要記錄單純修 typo 或格式化

## 紀錄格式

| 時間       | 階段       | 任務                    | AI / Agent 建議                                                                                                                    | 採用 / 拒絕 | 人類判斷理由                                                                                           | 相關檔案 / commit                                                                                                                                                                                                                           |
| ---------- | ---------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-09 | Phase 0    | 檢查起始專案完成條件    | 讀取 Phase 0 任務、現有 UI、原始資訊與測試，指出工作台還缺可建立、編輯、刪除或重設整理草稿                                         | 採用        | 任務卡明確要求至少 6 筆可編輯草稿，原本 UI 仍停在提示狀態                                              | `src/features/phase-0/Phase0Workbench.tsx`, `tests/app-smoke.test.tsx`                                                                                                                                                                      |
| 2026-07-09 | Phase 0    | 實作整理工作台          | 建議用記憶體狀態建立保守草稿，不用 localStorage、後端或外部 API；所有草稿預設不能直接行動                                          | 採用        | 符合 Phase 0 front-end only 邊界，也避免把未確認資訊保存成正式資料                                     | `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/phase0-heuristics.ts`                                                                                                                                                     |
| 2026-07-09 | Phase 0    | 分析較完整資訊          | Agent 可能把 M-010 視為地點狀態候選，因為原文有時間、數量與盤點資訊                                                                | 部分採用    | 只採用為「候選整理」，不採用為已確認事實；`verificationStatus` 仍是 `needs_review`                     | `docs/phase0-observations.md`                                                                                                                                                                                                               |
| 2026-07-09 | Phase 0    | 檢查 AI 可能誤導處      | Agent 可能把 M-001、M-012 直接整理成清泥或藥品任務                                                                                 | 拒絕        | 原文缺完整位置、當事人確認或現場狀態，不能直接變成志工任務                                             | `docs/phase0-observations.md`                                                                                                                                                                                                               |
| 2026-07-09 | Phase 0    | 優化工作台介面          | 建議加入首頁摘要、兩步驟分頁、原始資訊狀態摘要、草稿進度、目前處理列與分段編輯區                                                   | 採用        | 只改善資訊層級與操作路徑，沒有新增真實資料，也沒有把候選草稿改成已確認結果                             | `src/app/App.tsx`, `src/features/phase-0/Phase0RawInfoPanel.tsx`, `src/features/phase-0/Phase0Workbench.tsx`, `src/styles/global.css`                                                                                                       |
| 2026-07-09 | Phase 0    | 增加摘要快速篩選        | 建議讓首頁數字卡可點擊，直接切到原始資訊並篩選全部、待人工確認或未查核分類                                                         | 採用        | 只是改善導覽與篩選，不改變原始資訊，也不把待確認資料顯示成已確認                                       | `src/app/App.tsx`, `src/features/phase-0/Phase0RawInfoPanel.tsx`, `tests/app-smoke.test.tsx`                                                                                                                                                |
| 2026-07-09 | Phase 0    | 調整工作台摘要按鈕      | 建議把草稿、不能直接行動、需要人工確認三格改成按鈕，並移除目前處理列的「不可直接派工」標籤                                         | 採用        | 保留「不能直接行動」作為草稿欄位，但移除容易造成派工語意的紅色標籤                                     | `src/features/phase-0/Phase0Workbench.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`                                                                                                                                             |
| 2026-07-09 | Phase 0    | 刪除重複分類按鈕        | 建議保留上方全域摘要按鈕，刪除原始資訊區內重複的三格分類控制                                                                       | 採用        | 上方按鈕已能跨頁導覽與篩選；下方重複控制會增加認知負擔                                                 | `src/features/phase-0/Phase0RawInfoPanel.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`                                                                                                                                          |
| 2026-07-09 | Phase 0    | 標示 AI 優先確認候選    | 建議用 mock 原文完整度與限制語句評分，將候選小卡標紅                                                                               | 部分採用    | 只標示為「AI 候選：優先人工確認」，不採用「最緊急」作為真實救災判斷                                    | `src/features/phase-0/phase0-heuristics.ts`, `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/Phase0RawInfoPanel.tsx`                                                                                                      |
| 2026-07-09 | Phase 0    | 重新檢視按鈕與顏色      | 建議按高 / 中 / 低人工確認等級套色，並讓草稿狀態可由使用者更新                                                                     | 採用        | 顏色只表示 AI 候選人工確認等級，不表示真實緊急派工；草稿狀態維持可編輯                                 | `src/features/phase-0/phase0-types.ts`, `src/features/phase-0/phase0-heuristics.ts`, `src/features/phase-0/Phase0Workbench.tsx`                                                                                                             |
| 2026-07-09 | Phase 0    | 增加背景與儲存狀態      | 建議使用抽象城市背景，並新增草稿儲存按鈕與已儲存 / 未儲存標籤                                                                      | 採用        | 背景不使用真實城市或地圖；儲存只保留在前端記憶體，不使用 localStorage 或後端                           | `src/features/phase-0/Phase0Workbench.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`                                                                                                                                             |
| 2026-07-09 | Phase 0    | 簡化草稿編輯區          | 建議移除信心程度與長篇依據編輯，保留狀態、候選類型、下一步、不能直接行動與筆記                                                     | 採用        | 降低操作負擔，同時保留 Phase 0 需要人工確認與不能直接變任務的安全標示                                  | `src/features/phase-0/Phase0Workbench.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`                                                                                                                                             |
| 2026-07-09 | Release 01 | 決定 v1 主要服務者      | Agent 協助把「行動者」作為主要服務者整理成需求取捨文件，並提醒不要把完整原始資訊直接變成可行動任務                                 | 採用        | 主要服務者由人類明確指定；採用的是文件整理，不採用 AI 代替決策或自動判斷救災行動                       | `docs/decisions.md`, `docs/ai-log.md`                                                                                                                                                                                                       |
| 2026-07-09 | Release 01 | 啟用 sub-agent 訪談     | 啟用回報者、資訊整理者、行動者三個 persona sub-agent；三者共同指出「人工已看過」和「已確認」容易混淆                               | 採用        | 人類已指定 v1 主要服務行動者，因此採用行動者回饋作為主要取捨依據；未採用任何 AI 自動派工或真實救災判斷 | `docs/interview-notes.md`, `docs/interview-summary.md`, `docs/decisions.md`, `docs/ai-log.md`                                                                                                                                               |
| 2026-07-09 | v1 修正    | 修正行動者誤讀風險      | 依訪談問題，把「人工已看過」改成「仍待確認：已初步查看」，把「最高優先人工確認」改成看似急迫或資訊較完整提醒                       | 採用        | 這是文案安全修正，不代表資料已確認、緊急或可行動；仍保留人工確認與不可直接行動的邊界                   | `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/Phase0RawInfoPanel.tsx`, `src/features/phase-0/phase0-heuristics.ts`, `tests/app-smoke.test.tsx`, `docs/interview-summary.md`                                             |
| 2026-07-09 | Release 01 | 重新啟用 sub-agent 訪談 | 在三個 persona 檔都恢復後重新訪談；三者指出紅色小卡、已初步查看、已暫存、候選通報仍可能像正式流程                                  | 採用        | 採用為需求分析與下一步取捨，不直接讓 AI 修改成正式流程或行動判斷                                       | `docs/interview-notes.md`, `docs/interview-summary.md`, `docs/decisions.md`, `docs/ai-log.md`                                                                                                                                               |
| 2026-07-09 | v1 修正    | 修正紅色標示說明        | 人類指出標紅是因為原文看似急迫或資訊較完整，不是因為資料缺口較多                                                                   | 採用        | 修正 AI 對紅色標示原因的錯誤歸因；資訊完整不代表已確認，也不代表資料缺口較多                           | `src/features/phase-0/phase0-heuristics.ts`, `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/Phase0RawInfoPanel.tsx`, `docs/interview-notes.md`, `docs/interview-summary.md`, `docs/decisions.md`, `docs/ai-log.md`       |
| 2026-07-09 | Release 01 | 五輪深化訪談            | 依使用者要求先不修正，連續五輪拉高使用者視野，從單一行動者推進到多人協作、交接、責任分工與系統信任邊界                             | 採用        | 只採用為需求分析，不修改 `src/`；重點是總結使用者提出的問題，不替人類做產品決策                        | `docs/interview-notes.md`, `docs/interview-summary.md`, `docs/decisions.md`, `docs/ai-log.md`                                                                                                                                               |
| 2026-07-09 | Release 01 | sub-agent 五輪深化訪談  | 依使用者要求重新啟用 sub-agent，五輪分別訪談單一行動者、多人判讀、交接、小隊責任分工與系統信任邊界                                 | 採用        | 第 5 輪首次因模型容量失敗後重試；仍只採用為需求分析，不修改 `src/`，不替人類做產品或救災決策           | `docs/interview-notes.md`, `docs/interview-summary.md`, `docs/ai-log.md`                                                                                                                                                                    |
| 2026-07-09 | Release 01 | 填寫需求取捨決策        | 依三個 persona 與五輪深化訪談整理 17 行決策內容                                                                                    | 採用        | 使用者明確回覆「允許全部」後才寫入；採用為需求取捨文件，不改 release-pack 教材模板                     | `docs/decisions.md`, `docs/ai-log.md`                                                                                                                                                                                                       |
| 2026-07-09 | v1 修正    | 依 decisions 修正網頁   | 依 `docs/decisions.md` 新增行動邊界提示，將候選通報與地點更新建議改成線索語氣，並要求人工確認筆記寫出原因                          | 採用        | 降低行動者把候選草稿、暫存狀態或 AI 提醒誤讀成正式派工依據的風險；仍不新增後端、外部 API 或真實判斷    | `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/Phase0JudgementCard.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`, `docs/ai-log.md`                                                                           |
| 2026-07-09 | v1 修正    | 縮小行動邊界提示        | 使用者指出行動邊界太礙事，將大區塊改為一行輕量提醒並縮短文案                                                                       | 採用        | 保留「不能出發」安全邊界，但降低畫面干擾，讓行動者能繼續看原文與草稿                                   | `src/features/phase-0/Phase0Workbench.tsx`, `src/styles/global.css`, `docs/ai-log.md`                                                                                                                                                       |
| 2026-07-09 | Release 02 | 產生資訊流程設計        | 依 `docs/decisions.md` 與 `docs/interview-summary.md` 產生以行動者為主的流程，包含 Mermaid、人工確認點、不可自動處理分支與判斷紀錄 | 採用        | 流程目標是避免未確認資訊、候選草稿或 AI 提醒被誤當成可行動任務；仍需人類預覽 Mermaid 並檢查流程合理性  | `docs/flow.md`, `docs/ai-log.md`                                                                                                                                                                                                            |
| 2026-07-09 | Release 03 | 依流程實作工作台        | 依 `docs/flow.md` 在畫面加入流程停點、需要人工確認的原因與「線索不是正式任務」提示                                                 | 採用        | 只把流程邊界呈現在前端，不新增資料來源、後端、地圖或 AI runtime，也不讓 AI 判斷真實緊急或派工          | `src/features/phase-0/Phase0Workbench.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`, `docs/ai-log.md`                                                                                                                           |
| 2026-07-09 | v1 實作    | 接上 `/v1/` 展示入口    | 依課程規則保留首頁 Phase 0，新增 `/v1/` 行動者線索工作台入口，預設顯示依 `docs/flow.md` 實作的流程停點與確認原因                   | 採用        | 讓 v1 成果從 `/v1/` 存取，同時仍使用 Phase 0 原始資訊，不新增後端、外部 API 或正式任務資料             | `src/app/App.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`, `docs/ai-log.md`                                                                                                                                                    |
| 2026-07-09 | v1 修正    | 降低正式流程語氣        | 依 4 個 sub-agent 建議，把草稿、候選類型、建議下一步、暫存草稿等文案降級為整理筆記、原文可能涉及、確認方向、保存整理筆記           | 採用        | 降低行動者把閱讀筆記或待查線索誤讀成正式流程、通報或任務的風險；不修改資料模型、不新增正式派工功能     | `src/app/App.tsx`, `src/components/status-labels.ts`, `src/features/phase-0/Phase0JudgementCard.tsx`, `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/phase0-heuristics.ts`, `tests/app-smoke.test.tsx`, `docs/ai-log.md` |
| 2026-07-09 | v1 視覺    | 調整戰情室風格 UI       | 依使用者要求將 `/v1/` 調整為戰情室風格，加入深墨、朱紅、銅金與中式印章 / 格紋感視覺                                                | 採用        | 只改視覺樣式與 v1 class，不改資料、不新增真實地圖或救災判斷；仍保留不可行動與人工確認語意              | `src/app/App.tsx`, `src/styles/global.css`, `docs/ai-log.md`                                                                                                                                                                                |
| 2026-07-09 | v1 修正    | 精簡行動者工作台區塊    | 依使用者要求刪除 `flow.md` 停點面板，以及整理筆記中的第 3、4 個輔助區塊                                                            | 採用        | 降低工作台資訊量，讓行動者主要看原文、行動邊界、快速整理與人工確認筆記；不改資料來源或判斷規則         | `src/features/phase-0/Phase0Workbench.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`, `docs/ai-log.md`                                                                                                                           |
| 2026-07-09 | v1 修正    | 移除安全預設卡          | 依使用者要求刪除行動者工作台下方的 Starter 安全預設卡                                                                              | 採用        | 只移除重複的展示卡，保留主要行動邊界與人工確認筆記；不把未確認資訊改成已確認                           | `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/Phase0JudgementCard.tsx`, `src/styles/global.css`, `tests/app-smoke.test.tsx`, `docs/ai-log.md`                                                                           |
| 2026-07-09 | v1 修正    | 修正 `/v1/` 靜態部署    | 讓路由判斷與連結支援 GitHub Pages base path，並在 build 後產生 `dist/v1/index.html` 與 `dist/404.html`                             | 採用        | 修正靜態站台直接開 `/v1/` 會 404 的問題；不改資料、不新增後端或外部 API                                | `src/app/App.tsx`, `package.json`, `scripts/create-static-routes.ts`, `docs/ai-log.md`                                                                                                                                                      |

## 範例

| 時間  | 階段    | 任務         | AI / Agent 建議                        | 採用 / 拒絕 | 人類判斷理由                              | 相關檔案 / commit             |
| ----- | ------- | ------------ | -------------------------------------- | ----------- | ----------------------------------------- | ----------------------------- |
| 09:45 | Phase 0 | 分析原始資訊 | 建議把社群貼文直接轉成 verified report | 拒絕        | 社群貼文來源未確認，應保持 `needs_review` | `docs/phase0-observations.md` |

## 課後反思

### AI 幫助最大的地方

- 快速檢查任務卡、現有畫面與測試之間的落差，並把缺少的 Phase 0 完成條件轉成可操作 UI。
- 協助把原始資訊中的卡住原因拆成來源、查核狀態、操作者、同意與是否能直接行動等欄位。

### AI 最容易誤導的地方

- 看到比較完整的文字時，容易把「候選整理」說得像「已確認結果」。
- 看到求助語句時，容易直接補成任務，但原文可能缺位置、同意、風險與確認者。

### 下次使用 AI 開發前，我們會先準備

- 先寫清楚哪些狀態不能被顯示成已確認。
- 先定義哪些欄位是原文、哪些欄位是候選判斷、哪些欄位必須人工確認後才可使用。
- 先列出不能做的事，例如不查外部資料、不補真實地址、不呼叫 runtime LLM。
