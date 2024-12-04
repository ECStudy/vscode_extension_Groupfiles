import * as vscode from "vscode";

import { TreeData } from "./TreeData";
import {
    GroupItem,
    NativeTabInput,
    TabItem,
    TreeItemType,
} from "../type/types";
import { getNativeTabByTabItemPath, getNormalizedId } from "../util";

export class TreeDataProvider
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private treeData: TreeData = new TreeData();
    // EventEmitter를 정의
    private _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined | void
    > = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();

    private treeItemMap: Record<string, vscode.TreeItem> = {};

    readonly onDidChangeTreeData: vscode.Event<
        vscode.TreeItem | undefined | void
    > = this._onDidChangeTreeData.event;

    constructor() {}

    createTreeItemByNativeTab(nativeTab: vscode.Tab): vscode.TreeItem {
        if (!(nativeTab.input instanceof vscode.TabInputText)) {
            return new vscode.TreeItem("Invalid Tab");
        }
        const treeItem = new vscode.TreeItem(
            nativeTab.input.uri,
            vscode.TreeItemCollapsibleState.None
        );

        treeItem.command = {
            command: "vscode.open",
            title: "Open Tab",
            // 클릭 시 파일 열기
            arguments: [nativeTab.input.uri],
        };

        //x 버튼 닫기
        treeItem.contextValue = "closableTab";

        return treeItem;
    }
    createTabTreeItem(tabItem: TabItem): vscode.TreeItem {
        console.log("createTabTreeItem tabItem --> ", tabItem);

        const nativeTab = getNativeTabByTabItemPath(tabItem?.path);

        if (!nativeTab) {
            return {};
        }

        const treeItem = this.createTreeItemByNativeTab(nativeTab);
        return treeItem;
    }

    createGroupTreeItem(element: any) {
        // 그룹 item 생성
        const treeItem = new vscode.TreeItem(
            element.label,
            vscode.TreeItemCollapsibleState.Collapsed
        );
        treeItem.contextValue = "group";
        treeItem.iconPath = new vscode.ThemeIcon("folder");
        return treeItem;
    }

    getTreeItem(element: GroupItem | TabItem): vscode.TreeItem {
        if (element.type === TreeItemType.Group) {
            // 그룹 트리 항목 생성
            const groupItem = this.createGroupTreeItem(element);
            return groupItem;
        }
        //탭
        else if (element.type === TreeItemType.Tab) {
            const newTreeItem = this.createTabTreeItem(element);
            return newTreeItem;
        }

        return new vscode.TreeItem("Unknown");
    }

    getChildren(element?: TabItem | GroupItem): any {
        const children = this.treeData.getChildren(element);
        return children;
    }

    setData(data: (GroupItem | TabItem)[]) {
        this.treeData.setData(data);
        this.triggerRerender();
    }

    public triggerRerender() {
        this._onDidChangeTreeData.fire();
        this.refreshFilePathTree();
    }

    private refreshFilePathTree() {
        const leafNodes = this.treeData.getData();

        leafNodes.forEach((leafNode) => {
            const tabId = leafNode.id;
            this.getTreeItem(leafNode);
        });
    }

    public closeTab(tabItem: TabItem) {
        const leafNodes = this.treeData.getData();
        const updatedData = leafNodes.filter((item) => item.id !== tabItem.id);

        this.setData(updatedData);
        this.triggerRerender();
    }

    public createGroup(groupName: string) {
        this.treeData.createGroup(groupName);
        this.triggerRerender();
    }
}
