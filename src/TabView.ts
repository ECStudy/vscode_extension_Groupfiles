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
}
