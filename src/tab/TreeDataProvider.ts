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

    readonly onDidChangeTreeData: vscode.Event<
        vscode.TreeItem | undefined | void
    > = this._onDidChangeTreeData.event;

    constructor() {}

    getTreeItem(element: Group | Tab): any {}

    getChildren(element?: vscode.TreeItem): any {}
}
