import * as vscode from "vscode";
import { TabView } from "../view/views/TabView";
import { registerToggleContextCommand } from "./registerToggleContextCommand";

export const registerToggleContextCommands = (tabView: TabView) => {
    //TODO : provider로 빼기
    tabView.context.subscriptions.push(
        vscode.commands.registerCommand("global.state.reset", () => {
            tabView.handleClearGlobalState();
        })
    );

    // 전체 노드 접기 / 펼치기
    registerToggleContextCommand({
        trueCommand: "myext.group.collapsed",
        falseCommand: "myext.group.unCollapsed",
        whenCondition: "myext:group.collapsed",
        trueCallback: () => tabView.handleViewCollapsed(),
        falseCallback: () => tabView.handleViewCollapsed(),
    });

    // 주석 보이기 / 숨기기
    registerToggleContextCommand({
        trueCommand: "myext.show.description",
        falseCommand: "myext.hide.description",
        whenCondition: "myext:show.description",
        trueCallback: () => tabView.handleViewDescription(),
        falseCallback: () => tabView.handleViewDescription(),
    });

    // 탭 Alias 보이기 / 숨기기
    registerToggleContextCommand({
        trueCommand: "myext.show.alias",
        falseCommand: "myext.hide.alias",
        whenCondition: "myext:show.alias",
        trueCallback: () => tabView.handleViewAlias(),
        falseCallback: () => tabView.handleViewAlias(),
    });
};
