import * as vscode from "vscode";

import { Tree } from "../node/Tree";
import { GroupItem, TabItem, TreeItemType } from "../type/types";
import { getNativeTabByTabItemPath, getNormalizedId } from "../util";

import { Group } from "../node/Group";
import { Tab } from "../node/Tab";
import { ICreateGroup } from "../type/group";
import { EventHandler } from "../EventHandler";
import { Node } from "../node/Node";

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
        //this.tree.addEvent("create", () => this.triggerEventRerender());
        //this.tree.addEvent("delete", () => this.triggerEventRerender());
        //this.tree.addEvent("update", () => this.triggerEventRerender());
    }

    public triggerEventRerender() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Group | Tab): vscode.TreeItem {
        //console.log("getTreeItem-->", element);

        const treeItem = element.render(this.context);
        //접혔다 펼쳤다 하는 기능
        //this.context에 collapsed를 넣어야할거고, 그걸 통해서 여기서 렌더시칼 때 group에 전부 반영 시켜서 렌더링 시켜줘야할거같음

        return treeItem;
    }

    getChildren(element?: Group | Tab): Group[] {
        if (element instanceof Tab) {
            return [];
        }

        const target = element ?? this.tree;
        return target.getChildren();
    }

    getGroups() {
        console.log("aaaaaaa", this.tree.getChildren());
        return this.tree.getAllGroups();
    }

    /**
     * 그룹 생성
     */
    createGroup(payload: ICreateGroup) {
        //그룹 생성
        const group = new Group(payload.label);
        // const group2 = new Group("child");
        // group.add(group2);
        this.tree.add(group);

        //탭 있는 경우 탭 생성
        if (payload?.uri) {
            const uri = payload.uri;
            const nativeTab: vscode.Tab = {
                input: { uri },
                label: uri.path.split("/").pop() || "Unknown",
            } as vscode.Tab;

            const tab = new Tab(nativeTab);
            group.add(tab);
        }

        this.triggerEventRerender();
    }

    addTabToPrevGroup(payload: any) {
        //그룹이 넘어온 경우 그 그룹에 추가하기
        if (payload?.uri) {
            const uri = payload.uri;
            const nativeTab: vscode.Tab = {
                input: { uri },
                label: uri.path.split("/").pop() || "Unknown",
            } as vscode.Tab;

            const tab = new Tab(nativeTab);
            payload.group.add(tab);
        }

        this.triggerEventRerender();
    }
}
