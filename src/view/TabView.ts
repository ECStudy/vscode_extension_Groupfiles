import * as vscode from "vscode";

import { v4 as uuidv4 } from 'uuid';

import { CommandManager } from "../command/CommandManager";

import { TreeDataProvider } from "../tab/TreeDataProvider";
import { TabsTreeView } from "../type/enums";
import { getNormalizedId } from "../util";
import { Group, Tab, TreeItemType } from "../type/types";

export class TabView extends CommandManager {
    private treeDataProvider: TreeDataProvider = new TreeDataProvider();

    constructor() {
        super();

        //1. 열려있는 tabs 정보 가져오기
        const initialState = this.initializeState();

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

        vscode.commands.registerCommand(
            "tabView.addToGroup",
            (uri: vscode.Uri) => {
                this.addTabToGroup(uri);
            }
        );

        vscode.commands.registerCommand(
            "tabView.addToGroup.context",
            (uri: vscode.Uri) => {
                this.addTabToGroup(uri);
            }
        );
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

        this.treeDataProvider.addGroup(groupName);
    }

    private deleteGroup() {
        // 그룹 삭제 로직 추가
        vscode.window.showInformationMessage("Delete Group clicked!");
    }

    async addTabToGroup(uri?: vscode.Uri) {
        if (!uri) {
            vscode.window.showErrorMessage("No file selected.");
            return;
        }

        console.log("👚👚👚선택된 URI:", uri.path);

        // 현재 존재하는 그룹 가져오기
        const groups = this.treeDataProvider.getGroups();

        if (groups.length === 0) {
            vscode.window.showErrorMessage(
                "No groups available. Create a group first."
            );
            return;
        }

        // QuickPick으로 그룹 선택
        const selectedGroupName = await vscode.window.showQuickPick(
            groups.map((group) => group.label),
            { placeHolder: "Select a group to add the tab" }
        );

        if (!selectedGroupName) {
            vscode.window.showErrorMessage("No group selected.");
            return;
        }

        // 선택된 그룹 찾기
        const selectedGroup = groups.find(
            (group) => group.label === selectedGroupName
        );

        if (!selectedGroup) {
            vscode.window.showErrorMessage("Selected group not found.");
            return;
        }

        //left로 추가하는 경우 지금 컨버팅된 type으로 가져와서 id에 있음
        const id = uri.path || (uri as any).id;

        // 선택된 파일의 탭 객체 생성
        const tab: Tab = {
            type: TreeItemType.Tab,
            id: id,
            groupId: selectedGroup.id,
            uri: uri,
        };

        // 그룹에 탭 추가
        this.treeDataProvider.addTabToGroup(selectedGroup.id, tab);

        vscode.window.showInformationMessage(
            `Tab "${uri.path || (uri as any).id}" added to group "${
                selectedGroup.label
            }".`
        );
    }
}
