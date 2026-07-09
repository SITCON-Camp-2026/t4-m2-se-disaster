import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
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

    expect(screen.getByText("可編輯整理草稿")).toBeInTheDocument();
    expect(screen.getByText(/已建立/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /草稿\s*6/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /不能直接行動\s*6/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /需要人工確認\s*6/ }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("候選類型")).toBeInTheDocument();
    expect(screen.getByLabelText("草稿狀態")).toHaveValue("needs_human_review");
    expect(screen.queryByLabelText("信心程度")).not.toBeInTheDocument();
    expect(screen.getByText("未暫存變更")).toBeInTheDocument();
    expect(screen.getByText("目前只能閱讀與等待確認")).toBeInTheDocument();
    expect(screen.getByText(/行動者不能出發/)).toBeInTheDocument();
    expect(screen.getByText("流程停在：閱讀與等待確認")).toBeInTheDocument();
    expect(
      screen.getByText(/不能判斷真實緊急、派工、出發或公開資訊/),
    ).toBeInTheDocument();
    expect(screen.getAllByText("查核狀態不是已確認").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("不能直接變成任務或行動")).toBeChecked();
    expect(
      screen.getByText(/通報線索或地點更新線索都不是正式任務/),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("筆記：請寫下為什麼需要確認"),
    ).toBeInTheDocument();
    expect(screen.getByText("本筆需要確認的原因")).toBeInTheDocument();
    expect(screen.getByText("記下通報線索")).toBeInTheDocument();
    expect(screen.getByText("記下地點更新線索")).toBeInTheDocument();
    expect(screen.queryByText("建立候選通報")).not.toBeInTheDocument();
    expect(screen.queryByText("建立地點更新建議")).not.toBeInTheDocument();
    expect(screen.queryByText("不可直接派工")).not.toBeInTheDocument();
    expect(
      screen.getByText(/AI 提醒：看似急迫，仍待人工確認/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/最高優先/)).not.toBeInTheDocument();
    expect(screen.queryByText(/資料缺口較多/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("草稿狀態"), {
      target: { value: "human_reviewed" },
    });

    expect(screen.getByLabelText("草稿狀態")).toHaveValue("human_reviewed");
    expect(
      screen.getByText(/草稿狀態：仍待確認：已初步查看/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/人工已看過/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "暫存草稿" }));

    expect(screen.getAllByText("已暫存").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("草稿狀態"), {
      target: { value: "do_not_use" },
    });

    expect(screen.getByText("未暫存變更")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /不能直接行動\s*6/ }));

    expect(screen.getByText(/目前篩選：不能直接行動/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "刪除這筆草稿" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "重設全部草稿" }),
    ).toBeInTheDocument();
  });

  it("can delete and recreate a selected draft without local storage", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "2 整理工作台" }));
    fireEvent.click(screen.getByRole("button", { name: "刪除這筆草稿" }));

    expect(screen.getByText("M-001 還沒有整理草稿")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "建立整理草稿" }));

    expect(screen.getByText("M-001 候選判斷")).toBeInTheDocument();
  });
});
