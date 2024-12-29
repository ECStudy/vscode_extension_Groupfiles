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
        console.log("getTreeItem-->", element);

        const treeItem = element.render(this.context);
        //접혔다 펼쳤다 하는 기능
        //this.context에 collapsed를 넣어야할거고, 그걸 통해서 여기서 렌더시칼 때 group에 전부 반영 시켜서 렌더링 시켜줘야할거같음

        return treeItem;
    }

    getChildren(element?: Group | Tab): Group[] {
        if (!element) {
            // 최상위 레벨: 그룹 목록 반환
            return this.tree.getTree();
        }

        if (element instanceof Group) {
            // 그룹의 자식 탭 반환
            return element.children;
        }

        // 탭은 자식이 없음
        return [];
    }

    getGroupMap() {
        return this.tree.getGroupMap();
    }

    createEmptyGroup(payload: ICreateGroup) {
        //여기서 그룹 생성이 적절할거같음
        this.tree.createEmptyGroup(payload);
    }
}
