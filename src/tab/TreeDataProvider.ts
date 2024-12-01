import * as vscode from "vscode";

import { TreeData } from "./TreeData";
import { Group, Tab, TreeItemType } from "../type/types";
import { getNormalizedId } from "../util";

export class TreeDataProvider
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private treeData: TreeData = new TreeData();
    // EventEmitter를 정의
    private _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined | void
    > = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();

    private treeItemMap: Record<string, vscode.TreeItem> = {};

    // EventEmitter의 event 속성을 사용하여 이벤트를 외부로 노출
    readonly onDidChangeTreeData: vscode.Event<
        vscode.TreeItem | undefined | void
    > = this._onDidChangeTreeData.event;

    constructor() {}

    getNativeTabs(tab: Tab): vscode.Tab[] {
        const currentNativeTabs = vscode.window.tabGroups.all.flatMap(
            (tabGroup) => tabGroup.tabs
        );
        const nativeTabs = currentNativeTabs.filter((nativeTab) => {
            return tab.id === `${(nativeTab as any).input.uri.path}`;
        });
        return nativeTabs;
    }

    createTreeItem(tab: any): vscode.TreeItem {
        console.log("tab---->", tab);
        const treeItem = new vscode.TreeItem(
            tab.input.uri,
            vscode.TreeItemCollapsibleState.None
        );

        treeItem.command = {
            command: "vscode.open",
            title: "Open Tab",
            arguments: [tab.input.uri], // 클릭 시 파일 열기
        };

        return treeItem;
    }

    createGroup(element: any) {
        // 그룹 트리 항목 생성
        const treeItem = new vscode.TreeItem(
            element.label,
            vscode.TreeItemCollapsibleState.Collapsed
        );
        treeItem.contextValue = "group";
        treeItem.iconPath = new vscode.ThemeIcon("folder");
        return treeItem;
    }

    createTabTreeItem(tab: Tab): vscode.TreeItem {
        //console.log("생성", tab);
        const nativeTabs = this.getNativeTabs(tab);

        if (nativeTabs.length === 0) {
            return {};
        }

        const nativeTab = nativeTabs[0];
        console.log("네이티브 탭 가져옴", nativeTabs);
        const treeItem = this.createTreeItem(nativeTab);
        return treeItem;
    }

    getTreeItem(element: Group | Tab): vscode.TreeItem {
        console.log();

        //그룹
        if (element.type === TreeItemType.Group) {
            // 그룹 트리 항목 생성
            const groupItem = this.createGroup(element);
            return groupItem;
        }
        //탭
        else if (element.type === TreeItemType.Tab) {
            const newTreeItem = this.createTabTreeItem(element);
            console.log("새로 생성된 TreeItem:", newTreeItem);

            return newTreeItem;
        }

        return new vscode.TreeItem("Unknown");
    }

    //getChildren과 getTreeItem은 독립적으로 작동하지만,
    //getChildren에서 반환한 데이터는 반드시 getTreeItem의 입력으로 전달됩니다.
    getChildren(element?: vscode.TreeItem): any {
        console.log("getChildren 호출됨, element:", element);
        const children = this.treeData.getChildren(element);

        console.log("getChildren 반환값:", children);

        //return element;

        // return children.map((tab: any) => {
        //     const treeItem = new vscode.TreeItem(
        //         tab.uri,
        //         vscode.TreeItemCollapsibleState.None
        //     );
        //     treeItem.command = {
        //         command: "vscode.open",
        //         title: "Open File",
        //         arguments: [tab.uri],
        //     };
        //     return treeItem;
        // });

        return children;
    }

    setState(state: Array<Tab | Group>) {
        this.treeData.setState(state);
        this.triggerRerender();
    }

    public triggerRerender() {
        console.log("새로고침");
        this._onDidChangeTreeData.fire();
        this.refreshFilePathTree();
    }

    private refreshFilePathTree() {
        const leafNodes = this.treeData.getState() as Tab[];

        leafNodes.forEach((leafNode: Tab) => {
            const tabId = leafNode.id;
            const leafItem = this.getTreeItem(leafNode);

            console.log("리프 노드 가져옴", leafItem);
        });

        //getTreeItem()
    }

    public addGroup(groupName: string) {
        this.treeData.addGroup(groupName);
        this.triggerRerender();
    }

    addTabToGroup(groupId: string, tab: Tab): void {
        this.treeData.addTabToGroup(groupId, tab);
        this.refreshFilePathTree();
    }

    getGroups(): Group[] {
        const state = this.treeData.getState();
        return state.filter(
            (item) => item.type === TreeItemType.Group
        ) as Group[];
    }
}
