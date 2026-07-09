import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊整理工作台")).toBeInTheDocument();
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "1 原始資訊" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "2 整理工作台" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "進入 v1 行動者工作台" }),
    ).toHaveAttribute("href", "/v1/");
    expect(
      screen.queryByRole("button", { name: "通報" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "地點" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "志工任務" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "人員指派" }),
    ).not.toBeInTheDocument();
  });

  it("shows review states in the phase 0 workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "2 整理工作台" }));

    expect(
      screen.getByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("filters raw records from the summary counters", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /9\s*待人工確認/ }));

    expect(screen.getByText("目前分類：待人工確認")).toBeInTheDocument();
    expect(screen.getByText("9 筆資料")).toBeInTheDocument();
    expect(screen.queryByText("M-002")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /顯示全部\s*12/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /3\s*未查核/ }));

    expect(screen.getByText("目前分類：未查核")).toBeInTheDocument();
    expect(screen.getByText("3 筆資料")).toBeInTheDocument();
    expect(screen.getByText("M-002")).toBeInTheDocument();
  });

  it("supports editable phase 0 judgement drafts", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "2 整理工作台" }));

    expect(screen.getByText("可編輯整理筆記")).toBeInTheDocument();
    expect(screen.getByText(/已建立/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /整理筆記\s*6/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /不能直接行動\s*6/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /需要人工確認\s*6/ }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("原文可能涉及")).toBeInTheDocument();
    expect(screen.getByLabelText("整理狀態")).toHaveValue("needs_human_review");
    expect(screen.queryByLabelText("信心程度")).not.toBeInTheDocument();
    expect(screen.getByText("未保存變更")).toBeInTheDocument();
    expect(screen.getByText("目前只能閱讀與等待確認")).toBeInTheDocument();
    expect(screen.getByText(/行動者不能出發/)).toBeInTheDocument();
    expect(screen.getByText("流程停在：閱讀與等待確認")).toBeInTheDocument();
    expect(
      screen.getByText(/不能判斷真實緊急、派工、出發或公開資訊/),
    ).toBeInTheDocument();
    expect(screen.getAllByText("查核狀態不是已確認").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("不能直接變成任務或行動")).toBeChecked();
    expect(
      screen.getByText(/待查通報線索或待查地點線索都不是正式任務/),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("筆記：請寫下為什麼需要確認"),
    ).toBeInTheDocument();
    expect(screen.getByText("本筆需要確認的原因")).toBeInTheDocument();
    expect(screen.getByText("加入待查通報線索")).toBeInTheDocument();
    expect(screen.getByText("加入待查地點線索")).toBeInTheDocument();
    expect(screen.queryByText("建立候選通報")).not.toBeInTheDocument();
    expect(screen.queryByText("建立地點更新建議")).not.toBeInTheDocument();
    expect(screen.queryByText("建議下一步")).not.toBeInTheDocument();
    expect(screen.queryByText("候選類型")).not.toBeInTheDocument();
    expect(screen.queryByText("暫存草稿")).not.toBeInTheDocument();
    expect(screen.queryByText("不可直接派工")).not.toBeInTheDocument();
    expect(
      screen.getByText(/AI 提醒：看似急迫，仍待人工確認/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/最高優先/)).not.toBeInTheDocument();
    expect(screen.queryByText(/資料缺口較多/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("整理狀態"), {
      target: { value: "human_reviewed" },
    });

    expect(screen.getByLabelText("整理狀態")).toHaveValue("human_reviewed");
    expect(
      screen.getByText(/整理狀態：仍待確認：僅已閱讀原文，尚未查證/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/人工已看過/)).not.toBeInTheDocument();
    expect(screen.queryByText(/已初步查看/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "保存整理筆記" }));

    expect(screen.getAllByText("已保存筆記").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("整理狀態"), {
      target: { value: "do_not_use" },
    });

    expect(screen.getByText("未保存變更")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /不能直接行動\s*6/ }));

    expect(screen.getByText(/目前篩選：不能直接行動/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "刪除這筆筆記" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "重設全部筆記" }),
    ).toBeInTheDocument();
  });

  it("can delete and recreate a selected draft without local storage", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "2 整理工作台" }));
    fireEvent.click(screen.getByRole("button", { name: "刪除這筆筆記" }));

    expect(screen.getByText("M-001 還沒有整理筆記")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "建立整理筆記" }));

    expect(screen.getByText("M-001 閱讀判斷筆記")).toBeInTheDocument();
  });

  it("serves the flow-based actor workbench at /v1/", () => {
    window.history.pushState({}, "", "/v1/");

    render(<App />);

    expect(screen.getByText("行動者線索工作台")).toBeInTheDocument();
    expect(screen.getByText(/依 docs\/flow\.md 實作/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "回到 Phase 0" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("button", { name: "2 行動者工作台" }),
    ).toBeInTheDocument();
    expect(screen.getByText("流程停在：閱讀與等待確認")).toBeInTheDocument();
    expect(
      screen.getByText(/待查通報線索或待查地點線索都不是正式任務/),
    ).toBeInTheDocument();
  });
});
