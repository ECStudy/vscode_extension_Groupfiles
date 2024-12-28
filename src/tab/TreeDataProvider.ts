import * as vscode from "vscode";

import { Tree } from "./Tree";
import { GroupItem, TabItem, TreeItemType } from "../type/types";
import { getNativeTabByTabItemPath, getNormalizedId } from "../util";

import { Group } from "./Group";
import { Tab } from "./Tab";
import { ICreateGroup } from "../type/group";
import { EventHandler } from "../EventHandler";

export class TreeDataProvider
    implements
        vscode.TreeDataProvider<vscode.TreeItem>,
        vscode.TreeDragAndDropController<Group | Tab>
{
    private tree: Tree;

    // EventEmitter를 정의
    private _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined | void
    > = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();

    readonly onDidChangeTreeData: vscode.Event<
        vscode.TreeItem | undefined | void
    > = this._onDidChangeTreeData.event;

    readonly dropMimeTypes: string[] = ["application/vnd.code.tree.tab"];
    readonly dragMimeTypes: string[] = ["application/vnd.code.tree.tab"];

    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.tree = new Tree();
        //
        this.tree.addEvent("create", () => this.triggerEventRerender());
        this.tree.addEvent("delete", () => this.triggerEventRerender());
        this.tree.addEvent("update", () => this.triggerEventRerender());
    }

    public triggerEventRerender() {
        console.log("리렌더");
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Group | Tab): vscode.TreeItem {
        return {};
    }

    getChildren(element?: Group | Tab): Array<Group | Tab> {
        return [];
    }

    createEmptyGroup(payload: ICreateGroup) {
        this.tree.createEmptyGroup(payload);
    }
}
