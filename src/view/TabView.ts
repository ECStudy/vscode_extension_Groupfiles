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
import { TabViewCloseTab, TabViewCreateGroup } from "../type/command";

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
}

//nativeTabs
//tabItem
//tabsItem
