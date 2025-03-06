import * as vscode from "vscode";
import { TabView } from "../view/TabView";
import { registerCommandCheckContextMenu } from "./registerCommandCheckContextMenu";

export const registerSubscriptionsCommandHandler = (tabView: TabView) => {
    //TODO : provider로 빼기
    tabView.context.subscriptions.push(
        vscode.commands.registerCommand("global.state.reset", () => {
            tabView.handleClearGlobalState();
        })
    );

    // option1 명령 핸들러
    tabView.context.subscriptions.push(
        vscode.commands.registerCommand("option1", () => {})
    );

    // 전체 그룹 접기 / 펼치기
    registerCommandCheckContextMenu({
        trueCommand: "myext.group.fold",
        falseCommand: "myext.group.unfold",
        whenCondition: "myext:group.fold",
        trueCallback: () => tabView.handleFoldGroup(),
        falseCallback: () => tabView.handleFoldGroup(),
    });
    // 주석 보이기 / 숨기기
    registerCommandCheckContextMenu({
        trueCommand: "myext.show.description",
        falseCommand: "myext.hide.description",
        whenCondition: "myext:show.description",
        trueCallback: () => tabView.handleViewDescription(),
        falseCallback: () => tabView.handleViewDescription(),
    });
    // 탭 Alias 보이기 / 숨기기
    registerCommandCheckContextMenu({
        trueCommand: "myext.show.alias",
        falseCommand: "myext.hide.alias",
        whenCondition: "myext:show.alias",
        trueCallback: () => tabView.handleViewAlias(),
        falseCallback: () => tabView.handleViewAlias(),
    });
};
