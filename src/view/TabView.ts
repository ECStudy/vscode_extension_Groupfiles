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
import { GroupItem } from "../type/types";

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
        //탭 닫기
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

        //context 메뉴 통해서 그룹에 탭 넣기
        vscode.commands.registerCommand(
            TabViewCreateTabToGroupContext,
            (tab: any) => {
                this.handleCreateTabToGroup(tab.uri); // Tab 객체로부터 URI 가져옴
            }
        );

        //새로 그룹 만들고, 탭 넣기
        vscode.commands.registerCommand(
            "tab-and-bookmark.tabview.create.TabToNewGroup",
            (uri: vscode.Uri) => {
                //그룹 생성
                this.handleCreateGroupAndCreateTab(uri);
            }
        );

        //그룹 모두 삭제
        vscode.commands.registerCommand(
            "tab-and-bookmark.tabview.delete.group",
            (uri: GroupItem) => {
                //그룹 모두 삭제
                this.handleDeleteGroup(uri);
            }
        );

        //그룹 이름 변경
        vscode.commands.registerCommand(
            "tab-and-bookmark.tabview.update.group",
            (uri: GroupItem) => {
                //그룹 이름 변경 삭제
                this.handleUpdateGroup(uri);
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

    async handleCreateGroupAndCreateTab(uri: vscode.Uri) {
        const groupName = await vscode.window.showInputBox({
            prompt: "Enter a name for the new group",
            placeHolder: "새 그룹 이름 추가",
        });

        if (!groupName) {
            vscode.window.showErrorMessage("그룹 이름을 입력해주세요.");
            return;
        }

        this.treeDataProvider.createGroup(groupName);
        const groups = this.treeDataProvider["treeData"].getData(); // getData로 그룹 리스트 가져오기
        const selectedGroup = groups.find((group) => group.label === groupName);
        if (!selectedGroup) {
            vscode.window.showErrorMessage("선택된 그룹을 찾을 수 없습니다.");
            return;
        }

        this.treeDataProvider.createTabToGroup(selectedGroup.id, uri);
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
            this.handleCreateGroupAndCreateTab(uri);
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

    async handleDeleteGroup(uri: GroupItem) {
        this.treeDataProvider.deleteGroup(uri.id);
    }

    async handleUpdateGroup(uri: GroupItem) {
        const groupName = await vscode.window.showInputBox({
            prompt: "Enter a name for the new group",
            placeHolder: "수정할 그룹 이름 입력",
        });
        console.log("🎄🎄🎄 이름 변경", uri);

        if (!groupName) {
            vscode.window.showErrorMessage("그룹 이름을 입력해주세요.");
            return;
        }

        this.treeDataProvider.updateGroupLabel(uri.id, groupName);
    }
}
