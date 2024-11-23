import * as vscode from "vscode";

import { TreeData } from "./TreeData";
import { Group, Tab } from "../types";
import { getNormalizedId } from "../util";

export class TreeDataManager
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private treeData: any;

    private treeItemMap: Record<string, vscode.TreeItem> = {};

    // EventEmitter를 정의
    private _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined | void
    > = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();

    // EventEmitter의 event 속성을 사용하여 이벤트를 외부로 노출
    readonly onDidChangeTreeData: vscode.Event<
        vscode.TreeItem | undefined | void
    > = this._onDidChangeTreeData.event;

    constructor() {
        this.treeData = new TreeData();
    }

    setTreeData(state: Array<Tab | Group>) {
        this.treeData.setData(state);
        this.triggerRerender();
    }

    getTreeData() {
        return this.treeData.getTreeRootData();
    }

    /**
     * uri.path가 id가 되고, path를 기준으로 tabItem을 만든다.
     * @param nativeTabs
     */
    appendTabs(nativeTabs: readonly vscode.Tab[]) {
        nativeTabs.forEach((nativeTab) => {
            const tabId = getNormalizedId(nativeTab);
            if (tabId) {
                this.treeData.appendTab(tabId);
            }
        });
    }

    closeTabs(nativeTabs: readonly vscode.Tab[]) {
        nativeTabs.forEach((nativeTab) => {
            const tabId = getNormalizedId(nativeTab);
            const tab = this.treeData.getTab(tabId);
            if (tab && nativeTabs.length === 0) {
                this.treeData.deleteTab(tabId);
            }
        });
    }

    /**
     * 트리의 각 항목(TreeItem)을 제공
     * 트리 뷰는 각 항목에 대해 getTreeItem을 호출하여, 해당 항목을 렌더링할 때 사용할 데이터를 가져옴
     * 예를 들어, 트리 아이템의 레이블, 아이콘, 명령, 확장 가능 여부 등의 정보를 설정할 수 있음
     * @param element
     * @returns
     */
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        console.log("🎈 getTreeItem", element, "🎈", (element as any).type);

        return element;

        //return {}
    }

    /**
     * 트리의 각 항목의 하위 요소(children)를 반환하는 메서드
     * 트리 뷰는 계층적인 구조를 가지고 있으며,
     * 특정 항목에 하위 요소가 있는지 확인하기 위해 getChildren 메서드를 호출
     * 이 메서드는 트리의 루트 요소부터 시작하여 하위 요소를 순차적으로 탐색하여 트리를 구성
     * @param element
     * @returns
     */
    getChildren(
        element?: vscode.TreeItem
    ): vscode.ProviderResult<vscode.TreeItem[]> {
        console.log("🍀 getChildren", element);
        if (!element) {
            return this.getTreeItemByTreeData(); // 루트 레벨 요소 반환
        }
        return []; // 자식 요소가 없으므로 빈 배열 반환
    }

    getTreeItemByTreeData(): vscode.TreeItem[] {
        const tabs = this.treeData.getTreeRootData() || [];
        return tabs.map((tab: vscode.Tab) => {
            if (tab.input instanceof vscode.TabInputText) {
                const treeItem = new vscode.TreeItem(
                    tab.input.uri,
                    vscode.TreeItemCollapsibleState.None
                );
                treeItem.command = {
                    command: "vscode.open",
                    title: "Open File",
                    arguments: [tab.input.uri],
                };
                return treeItem;
            } else {
                // 이게 뭘까?
                return null;
            }
        });
    }

    /**
     * 트리뷰 새로 고침
     */
    public triggerRerender() {
        this._onDidChangeTreeData.fire();
        this.refreshFilePathTree();
    }

    private refreshFilePathTree() {
        //root 가져옴
        const treeData = this.treeData.getTreeRootData();

        console.log("🥾", treeData);

        treeData.forEach((leafNode: Tab) => {
            console.log("👠leafNode", leafNode.id);

            //const tabId = getNormalizedId();
        });
    }
}
