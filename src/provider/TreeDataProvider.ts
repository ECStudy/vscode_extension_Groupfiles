import * as vscode from "vscode";

import { Tree } from "../node/Tree";

import { Group } from "../node/Group";
import { Tab } from "../node/Tab";
import { ICreateGroup, IUpdateGroup } from "../type/group";
import { EventHandler } from "../EventHandler";
import { Node } from "../node/Node";
import { UpdateAction } from "../type/enums";
import { v4 as uuidv4 } from "uuid";
import { Serialize } from "../Serialize";
import { TreeItemType } from "../type/types";

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

    private viewCollapse: boolean;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.tree = new Tree("root");
        this.viewCollapse = false;
        //
        //this.tree.addEvent("create", () => this.triggerEventRerender());
        //this.tree.addEvent("delete", () => this.triggerEventRerender());
        //this.tree.addEvent("update", () => this.triggerEventRerender());
        this.loadData();
    }

    getGlobalState(key: string) {
        const jsonData = this.context.globalState.get(
            "extensionState"
        ) as string;

        if (jsonData) {
            const globalStateState = JSON.parse(jsonData);
            return globalStateState[key];
        }
    }

    private saveData() {
        const tree = this.tree.getTree();

        const serializedTree = Serialize.toJson(tree);
        const state = {
            treeData: serializedTree,
            viewCollapse: this.viewCollapse, // 전체 접기/펼치기 상태 저장
        };
        //global에 저장하기
        this.context.globalState.update(
            "extensionState",
            JSON.stringify(state)
        );
    }

    loadData() {
        const jsonData = this.context.globalState.get(
            "extensionState"
        ) as string;

        if (jsonData) {
            const state = JSON.parse(jsonData);

            if (state?.treeData) {
                const treeClass = Serialize.fromJson(state.treeData);
                this.tree.setChildren(treeClass.getChildren());
            }

            if (state?.viewCollapse !== undefined) {
                this.viewCollapse = state.viewCollapse; // 전체 접기/펼치기 상태 복원
            }
        }
    }

    public triggerEventRerender() {
        this.saveData();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Group | Tab): vscode.TreeItem {
        const treeItem = element.render(this.context);
        if (element.type === TreeItemType.Group) {
            //접기 펼치기 캐싱 때문에 렌더 할 때 아이디 변경
            treeItem.id = `${element.id}_${
                element.collapsed ? "collapsed" : "expanded"
            }`;

            treeItem.collapsibleState = element.collapsed
                ? vscode.TreeItemCollapsibleState.Collapsed //닫힘 1
                : vscode.TreeItemCollapsibleState.Expanded; //열림 2
        }

        return treeItem;
    }

    getChildren(element?: Group | Tab): Group[] {
        console.log("2", element);
        if (element instanceof Tab) {
            return [];
        }

        const target = element ?? this.tree;
        return target.getChildren();
    }

    getGroups() {
        return this.tree.getAllGroups();
    }

    /**
     * 그룹 생성
     */
    createGroup(payload: ICreateGroup) {
        //그룹이 이미 있는 경우
        if (payload?.group) {
            if (payload?.uri) {
                const uri = payload.uri;
                const nativeTab: vscode.Tab = {
                    input: { uri },
                    label: uri.path.split("/").pop() || "Unknown",
                } as vscode.Tab;

                const tab = new Tab(`tab_${uuidv4()}`, nativeTab);
                payload.group.add(tab);
            }
        }
        //그룹 신규 생성
        else {
            //그룹 생성
            if (payload?.label) {
                const group = new Group(`group_${uuidv4()}`, payload?.label);
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

                    const tab = new Tab(`tab_${uuidv4()}`, nativeTab);
                    group.add(tab);
                }
            }
        }

        this.triggerEventRerender();
    }

    createGroupAndGroup(payload: ICreateGroup) {
        //그룹에서 그룹 생성
        if (payload?.label) {
            const group = new Group(`group_${uuidv4()}`, payload?.label);
            payload?.group?.add(group);
        }

        this.triggerEventRerender();
    }

    resetAll() {
        this.tree.reset();
        this.triggerEventRerender();
    }

    updateGroup(payload: IUpdateGroup) {
        switch (payload.action) {
            case UpdateAction.LABEL:
                payload?.label && payload.group.setLabel(payload?.label);
                break;
            case UpdateAction.COLOR:
                payload?.color && payload.group.setColor(payload?.color);
                break;
            default:
                break;
        }
        this.triggerEventRerender();
    }

    remove(node: Node) {
        node.remove(node);
        this.triggerEventRerender();
    }

    setCollapsed(node: any, isCollapse: boolean) {
        // 전체 접기/펼치기 상태 업데이트
        this.viewCollapse = isCollapse;

        // 각 그룹의 상태 업데이트
        node.forEach((group: Group) => {
            group.setCollapsed(isCollapse);
        });

        this.triggerEventRerender();
    }
}
