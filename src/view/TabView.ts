import * as vscode from "vscode";

import { v4 as uuidv4 } from "uuid";
import { TAB_VIEW } from "../type/enums";

import { CommandManager } from "../command/CommandManager";

import { TreeDataProvider } from "../tab/TreeDataProvider";
import { getNativeTabs, getNormalizedId } from "../util";
import {
    GroupItem,
    NativeTabInput,
    TabItem,
    TreeItemType,
} from "../type/types";
import {
    TabViewCloseTab,
    TabViewCreateGroup,
    TabViewCreateTabToGroup,
    TabViewCreateTabToGroupContext,
} from "../type/command";

export class TabView extends CommandManager {
    private treeDataProvider: TreeDataProvider = new TreeDataProvider();

    constructor() {
        super();

        //1. 열려있는 tabItem 정보 가져오기
        const activeTabItem = this.getinitializeTabItems();

        //2. tabItems 저장
        this.treeDataProvider.setData(activeTabItem);

        //트리 뷰 생성
        vscode.window.createTreeView(TAB_VIEW, {
            treeDataProvider: this.treeDataProvider,
            canSelectMany: true,
        });

        this.registerCommandHandler();
    }

    private registerCommandHandler() {
        vscode.commands.registerCommand(TabViewCloseTab, (tabItem: TabItem) => {
            this.handleCloseTab(tabItem);
        });

        vscode.commands.registerCommand(TabViewCreateGroup, () => {
            this.handleCreateGroup();
        });

        //네이티브, 추가
        vscode.commands.registerCommand(
            TabViewCreateTabToGroup,
            (uri: vscode.Uri) => {
                this.handleCreateTabToGroup(uri);
            }
        );

        //만든 탭으로 추가하기
        vscode.commands.registerCommand(
            TabViewCreateTabToGroupContext,
            (tabItem: any) => {
                this.handleCreateTabToGroup(tabItem.uri);
            }
        );

        this.registerCommand(
            vscode.window.tabGroups.onDidChangeTabs((e) => {
                // console.log("탭 변화 이벤트 변화", e.changed);
                console.log("탭 변화 이벤트 열림", e.opened);
                // console.log("탭 변화 이벤트 닫힘", e.closed);

                const openTab = e.opened[0]; //탭 열때는 무조건 1개이거나 0개이거나
                //const activeTabItem = this.getinitializeTabItems();

                //2. tabItems 저장
                //this.treeDataProvider.setData(activeTabItem);
            })
        );
    }

    getinitializeTabItems(): Array<TabItem> {
        //native tab 가져옴
        const nativeTabs = getNativeTabs();
        //native tab으로 tabItems 생성
        return this.generateTabItems(nativeTabs);
    }

    generateTabItems(nativeTabs: vscode.Tab[]) {
        const tabItems: Array<TabItem> = [];

        nativeTabs.forEach((nativeTab: vscode.Tab) => {
            const path = getNormalizedId(nativeTab);
            const id = `tab_${uuidv4()}`;

            const nativeTabInput = nativeTab.input as NativeTabInput;
            if (nativeTabInput) {
                const tabItem = {
                    type: TreeItemType.Tab,
                    groupId: null,
                    path: path,
                    id: id,
                    uri: nativeTabInput?.uri,
                } as TabItem;

                tabItems.push(tabItem);
            }
        });
        return tabItems;
    }

    private handleCloseTab(tabItem: TabItem) {
        // 탭 닫기
        vscode.commands.executeCommand(
            "workbench.action.closeActiveEditor",
            tabItem.uri
        );
        this.treeDataProvider.closeTab(tabItem);
    }

    async handleCreateGroup() {
        // 명령 실행 시 실제로 사용하는 코드만 유지
        const groupName = await vscode.window.showInputBox({
            prompt: "Enter a name for the new group",
            placeHolder: "새 그룹 이름 추가",
        });

        if (!groupName) {
            vscode.window.showErrorMessage("Group name cannot be empty.");
            return;
        }

        this.treeDataProvider.createGroup(groupName);
    }

    async handleCreateTabToGroup(uri: vscode.Uri) {
        // console.log(
        //     "handleCreateTabToGroup 넘어 오는 값 봐야함,🎈🎈🎈🎈",
        //     value
        // );
        //tab-context : 네이티브
        //탐색기 : 네이티브
        //tabView : tabItem

        // 현재 존재하는 그룹 가져오기
        const currentGroups = this.treeDataProvider.getGroups();

        console.log("🎈🎈🎈🎈 현재 만들어진 그룹 정보", currentGroups);
        if (currentGroups.length === 0) {
            //그룹이 하나도 없으면 그룹 만어라
            this.handleCreateGroup();
            //추가하는 과정도 들어가야한다.
            //handleCreateTabToGroup() 이게 분리 되어야함
            return;
        }

        // QuickPick으로 그룹 선택
        const selectedGroupName = await vscode.window.showQuickPick(
            currentGroups.map((group) => group.label),
            { placeHolder: "그룹을 선택해주세요" }
        );
        if (!selectedGroupName) {
            vscode.window.showErrorMessage("그룹을 선택하지 않았습니다.");
            return;
        }

        // 선택된 그룹 찾기
        const selectedGroup = currentGroups.find(
            (group) => group.label === selectedGroupName
        );

        if (!selectedGroup) {
            vscode.window.showErrorMessage("Selected group not found.");
            return;
        }

        const tab = {
            groupId: selectedGroup.id,
            uri: uri,
            path: uri.path,
        };

        console.log("🎄🎄🎄", uri);

        const result = this.treeDataProvider.createTabToGroup(
            selectedGroup.id,
            tab
        );

        if (result) {
            selectedGroup.collapsed = false; // 그룹 상태를 열림으로 설정
            this.treeDataProvider.triggerRerender();
            vscode.window.showErrorMessage(
                `${selectedGroup.id} 그룹에 추가 완료`
            );
        } else {
            vscode.window.showErrorMessage("그룹 추가 실패");
        }
    }
}

//nativeTabs
//tabItem
//tabsItem
