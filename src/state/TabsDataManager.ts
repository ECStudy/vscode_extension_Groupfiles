import * as vscode from "vscode";

import { TabsData } from "./TabsData";

export class TabsDataManager {
    private tabsData: any;

    // EventEmitter를 정의
    private _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined | void
    > = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();

    // EventEmitter의 event 속성을 사용하여 이벤트를 외부로 노출
    readonly onDidChangeTreeData: vscode.Event<
        vscode.TreeItem | undefined | void
    > = this._onDidChangeTreeData.event;

    constructor() {
        this.tabsData = new TabsData();
    }

    setTabsData(data: any) {
        this.tabsData.setData(data);
        this.triggerRerender();
    }

    getTabsData() {
        return this.tabsData.getData();
    }

    /**
     * 트리의 각 항목(TreeItem)을 제공
     * 트리 뷰는 각 항목에 대해 getTreeItem을 호출하여, 해당 항목을 렌더링할 때 사용할 데이터를 가져옴
     * 예를 들어, 트리 아이템의 레이블, 아이콘, 명령, 확장 가능 여부 등의 정보를 설정할 수 있음
     * @param element
     * @returns
     */
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        console.log("엘리먼트", element);

        return element;
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
    ): vscode.TreeItem[] | Thenable<vscode.TreeItem[]> {
        if (!element) {
            return this.getTreeItemByTabsData();
        }
        return [];
    }

    getTreeItemByTabsData() {
        const tabs = this.getTabsData() || [];
        return tabs.map((tab: vscode.Tab) => {
            const treeItem = new vscode.TreeItem(
                tab.label,
                vscode.TreeItemCollapsibleState.None
            );

            treeItem.command = {
                command: "vscode.open",
                title: "fileOpen",
                arguments: [
                    tab.input instanceof vscode.TabInputText
                        ? tab.input.uri
                        : undefined,
                ],
            };
            return treeItem;
        });
    }

    /**
     * 트리뷰 새로 고침
     */
    public triggerRerender() {
        this._onDidChangeTreeData.fire();
    }
}
