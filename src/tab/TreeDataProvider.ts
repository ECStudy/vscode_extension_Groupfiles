import * as vscode from "vscode";

import { Tree } from "./Tree";
import { GroupItem, TabItem, TreeItemType } from "../type/types";
import { getNativeTabByTabItemPath, getNormalizedId } from "../util";

import { Group } from "./Group";
import { Tab } from "./Tab";

export class TreeDataProvider
    implements
        vscode.TreeDataProvider<vscode.TreeItem>,
        vscode.TreeDragAndDropController<Group | Tab>
{
    private treeData: Tree = new Tree();

    // EventEmitter를 정의
    private _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined | void
    > = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();

    readonly onDidChangeTreeData: vscode.Event<
        vscode.TreeItem | undefined | void
    > = this._onDidChangeTreeData.event;

    readonly dropMimeTypes: string[] = ["application/vnd.code.tree.tab"];
    readonly dragMimeTypes: string[] = ["application/vnd.code.tree.tab"];

    private context: any;

    constructor(context: any) {
        this.context = context;
    }

    getTreeItem(element: Group | Tab): vscode.TreeItem {
        return {};
    }

    getChildren(element?: Group | Tab): Array<Group | Tab> {
        return [];
    }
}
