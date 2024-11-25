import * as vscode from "vscode";

import { CommandManager } from "./CommandManager";

import { TreeDataProvider } from "./tab/TreeDataProvider";
import { TabsTreeView } from "./enums";
import { getNormalizedId } from "./util";
import { Group, Tab, TreeItemType } from "./types";

export class TabView extends CommandManager {
    private treeDataProvider: TreeDataProvider = new TreeDataProvider();

    constructor() {
        super();

        //1. 열려있는 tabs 정보 가져오기
        const initialState = this.initializeState();

        console.log(initialState);

        //2. tabs 정보 저장해두기
        this.treeDataProvider.setState(initialState);

        //트리 뷰 생성
        vscode.window.createTreeView(TabsTreeView, {
            treeDataProvider: this.treeDataProvider,
            canSelectMany: true,
        });

        //그룹 생성 명려어
        this.registerCommandHandler();
    }

    private registerCommandHandler() {
        vscode.commands.registerCommand("tabView.createGroup", () => {
            this.createGroup();
        });

        vscode.commands.registerCommand("tabView.deleteGroup", () => {
            this.deleteGroup();
        });
    }

    initializeState() {
        const nativeTabs = this.getNativeTabs();
        const tabs = this.generateTabs(nativeTabs);
        return tabs;
    }

    getNativeTabs() {
        return vscode.window.tabGroups.all.flatMap((tabGroup) => tabGroup.tabs);
    }

    //네이티브 탭 정보 갖고 type있는 tab정보로 묶기
    generateTabs(nativeTabs: any[]) {
        const tabs: Array<Tab | Group> = [];

        nativeTabs.forEach((nativeTab) => {
            const tabId = getNormalizedId(nativeTab);

            const tabInfo = {
                type: TreeItemType.Tab,
                groupId: null,
                id: tabId,
                uri: nativeTab.input.uri,
            } as Tab;

            tabs.push(tabInfo);
        });

        return tabs;
    }

    async createGroup(arg1?: any, arg2?: any) {
        // 명령 실행 시 실제로 사용하는 코드만 유지
        const groupName = await vscode.window.showInputBox({
            prompt: "Enter a name for the new group",
            placeHolder: "Group Name",
        });

        if (!groupName) {
            vscode.window.showErrorMessage("Group name cannot be empty.");
            return;
        }

        const groupId = `group-${Date.now()}`; // 고유 ID 생성
        const colorId = "chartreuse"; // 그룹 색상 (예시)

        const newGroup: Group = {
            type: TreeItemType.Group,
            id: groupId,
            colorId: colorId,
            label: groupName,
            children: [],
            collapsed: true,
        };

        console.log("🎈그룹 groupName", groupName);
        console.log("🎈그룹 newGroup", newGroup);

        // const currentState = this.treeDataProvider.getState();
        // currentState.push(newGroup);
        // this.treeDataProvider.setState(currentState);

        vscode.window.showInformationMessage(`Group "${groupName}" created!`);
    }

    private deleteGroup() {
        // 그룹 삭제 로직 추가
        vscode.window.showInformationMessage("Delete Group clicked!");
    }
}
