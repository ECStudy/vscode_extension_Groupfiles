import * as vscode from "vscode";

import { CommandManager } from "./CommandManager";

import { TreeDataManager } from "./state/TreeDataManager";
import { TabsGroupView } from "./enums";

export class Tabs extends CommandManager {
    private TDManager: TreeDataManager;

    constructor() {
        super();

        const initalState = this.getOpenTabs();

        this.TDManager = new TreeDataManager();
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
                console.log("탭 변화 이벤트 닫힘", e.closed);
                this.TDManager.addTabs(e.opened);
                const openTabs = this.getOpenTabs();

                //console.log("열린탭", openTabs);

                this.TDManager.setTreeData(openTabs);
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
}
