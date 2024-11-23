import * as vscode from "vscode";

import { CommandManager } from "./CommandManager";

import { TreeDataManager } from "./state/TreeDataManager";
import { TabsGroupView } from "./enums";
import { getNormalizedId } from "./util";
import { Group, Tab, TreeItemType } from "./types";

export class TabView extends CommandManager {
    private TDManager: TreeDataManager;

    constructor() {
        super();

        //1. 열려있는 tabGroup 정보 가져오기
        const initalState = this.initializeState();

        //2. TreeData 생성
        this.TDManager = new TreeDataManager();

        //3. 열려있는 tabGroup 정보 set해주기
        this.TDManager.setTreeData(initalState);

        //트리 뷰 생성
        vscode.window.createTreeView(TabsGroupView, {
            treeDataProvider: this.TDManager,
            canSelectMany: true,
        });

        //command 등록
        this.registerCommandHandler();
    }

    private registerCommandHandler() {
        this.registerCommand(
            vscode.window.tabGroups.onDidChangeTabs((e) => {
                // console.log("탭 변화 이벤트 변화", e.changed);
                console.log("탭 변화 이벤트 열림", e.opened);
                //console.log("탭 변화 이벤트 닫힘", e.closed);
                this.TDManager.appendTabs(e.opened);
                const openTabs = this.getOpenTabs();

                //console.log("열린탭", openTabs);

                //this.TDManager.setTreeData(openTabs);

                this.TDManager.triggerRerender();
            })
        );
    }

    /**
     * 현재 열린 모든 탭 정보 반환
     * @returns
     */
    private getOpenTabs() {
        //vscode.window.tabGroups.all : VS Code에서 열린 모든 탭 그룹을 반환
        const currentOpenTabs = vscode.window.tabGroups.all.flatMap(
            (tabGroup) => tabGroup.tabs
        );
        return currentOpenTabs;
    }

    /**
     * 초기 state 생성
     * @returns
     */
    private initializeState() {
        //1. 현재 열린 모든 탭 정보 반환
        const nativeTabs = this.getOpenTabs();

        //2. nativeTabs 데이터를 TreeItem.Tab[] 데이터에 맞게 변환
        const tabs = this.convertedNativeTabsToTabs(nativeTabs);

        console.log("이닛", tabs);

        //3. 반환
        return tabs;
        //return nativeTabs;
    }

    private convertedNativeTabsToTabs(nativeTabs: readonly vscode.Tab[]) {
        const mergedTabs: Array<Tab | Group> = [];
        const tabMap: Record<string, Tab> = {};
        nativeTabs.forEach((nativeTab) => {
            try {
                const id = getNormalizedId(nativeTab);
                if (!tabMap[id]) {
                    tabMap[id] = { type: TreeItemType.Tab, groupId: null, id };
                    mergedTabs.push(tabMap[id]);
                }
            } catch {}
        });

        return mergedTabs;
    }
}
