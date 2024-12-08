import * as vscode from "vscode";

import { v4 as uuidv4 } from "uuid";
import { TAB_VIEW } from "../type/enums";

import { CommandManager } from "../command/CommandManager";

import { TreeDataProvider } from "../tab/TreeDataProvider";

import {
    TabViewCloseTab,
    TabViewCreateGroup,
    TabViewCreateTabToGroup,
    TabViewCreateTabToGroupContext,
} from "../type/command";
import { Tab } from "../tab/Tab";

export class TabView extends CommandManager {
    private treeDataProvider: TreeDataProvider = new TreeDataProvider();

    constructor() {
        super();
        vscode.window.createTreeView(TAB_VIEW, {
            treeDataProvider: this.treeDataProvider,
            canSelectMany: true,
        });

        this.registerCommandHandler();
    }

    private registerCommandHandler() {
        vscode.commands.registerCommand(TabViewCloseTab, (tab: Tab) => {
            this.handleCloseTab(tab);
        });

        vscode.commands.registerCommand(TabViewCreateGroup, () => {
            this.handleCreateGroup();
        });

        vscode.commands.registerCommand(
            TabViewCreateTabToGroup,
            (uri: vscode.Uri) => {
                this.handleCreateTabToGroup(uri);
            }
        );

        vscode.commands.registerCommand(
            TabViewCreateTabToGroupContext,
            (tab: any) => {
                this.handleCreateTabToGroup(tab.uri); // Tab 객체로부터 URI 가져옴
            }
        );
    }
    private handleCloseTab(tab: any) {
        vscode.commands.executeCommand(
            "workbench.action.closeActiveEditor",
            tab.uri
        );
        this.treeDataProvider.closeTab(tab);
    }

    async handleCreateGroup() {
        const groupName = await vscode.window.showInputBox({
            prompt: "Enter a name for the new group",
            placeHolder: "새 그룹 이름 추가",
        });

        if (!groupName) {
            vscode.window.showErrorMessage("그룹 이름을 입력해주세요.");
            return;
        }

        this.treeDataProvider.createGroup(groupName);
        vscode.window.showInformationMessage(
            `그룹 "${groupName}"이 생성되었습니다.`
        );
    }

    async handleCreateTabToGroup(uri: vscode.Uri) {
        // 트리 데이터에서 그룹 가져오기
        const groups = this.treeDataProvider["treeData"].getData(); // getData로 그룹 리스트 가져오기

        if (groups.length === 0) {
            vscode.window.showErrorMessage(
                "그룹이 없습니다. 먼저 그룹을 생성해주세요."
            );
            return;
        }

        const selectedGroupName = await vscode.window.showQuickPick(
            groups.map((group) => group.label),
            { placeHolder: "탭을 추가할 그룹을 선택하세요." }
        );

        if (!selectedGroupName) {
            vscode.window.showErrorMessage("그룹을 선택하지 않았습니다.");
            return;
        }

        const selectedGroup = groups.find(
            (group) => group.label === selectedGroupName
        );

        if (!selectedGroup) {
            vscode.window.showErrorMessage("선택된 그룹을 찾을 수 없습니다.");
            return;
        }

        try {
            this.treeDataProvider.createTabToGroup(selectedGroup.id, uri);
            vscode.window.showInformationMessage(
                `"${selectedGroup.label}" 그룹에 탭이 추가되었습니다.`
            );
        } catch (error: any) {
            vscode.window.showErrorMessage(
                `탭 추가 중 오류 발생: ${error.message}`
            );
        }
    }
}

//nativeTabs
//tabItem
//tabsItem
