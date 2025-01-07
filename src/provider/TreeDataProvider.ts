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
import { STORAGE_KEYS, StoreageManager } from "../StorageManager";

export class TreeDataProvider
    implements
        vscode.TreeDataProvider<vscode.TreeItem>,
        vscode.TreeDragAndDropController<Group | Tab>
{
    private tree: Tree;
    private storageManager: StoreageManager;

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
        this.storageManager = new StoreageManager(this.context);

        this.loadData();
    }

    public getGlobalState<T>(key: STORAGE_KEYS) {
        return this.storageManager.get<T>(key);
    }

    public saveData() {
        const tree = this.tree.getTree();
        const serializedTree = Serialize.toJson(tree);

        console.log("🎀 json 만들기 json 데이터임-->", serializedTree);

        this.storageManager.set(STORAGE_KEYS.TREE_DATA, serializedTree);
        this.storageManager.set(STORAGE_KEYS.VIEW_COLLAPSE, this.viewCollapse);
    }

    private loadData() {
        const jsonTreeData = this.getGlobalState<string>(
            STORAGE_KEYS.TREE_DATA
        );

        if (jsonTreeData) {
            const treeClass = Serialize.fromJson(jsonTreeData);

            console.log("🎈 json 복구", treeClass);

            this.tree.setChildren(treeClass.getChildren());
        }

        const viewCollapse = this.getGlobalState<boolean>(
            STORAGE_KEYS.VIEW_COLLAPSE
        );
        if (viewCollapse !== undefined) {
            this.viewCollapse = viewCollapse;
        }
    }

    public async restoreData(jsonTreeData: string, target?: Group) {
        if (jsonTreeData) {
            const treeClass = Serialize.fromJson(jsonTreeData);

            if (!target) {
                this.tree.setChildren(treeClass.getChildren());
            } else {
                target.setChildren(treeClass.getChildren());
            }

            this.triggerEventRerender();
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
        if (element instanceof Tab) {
            return [];
        }

        const target = element ?? this.tree;
        return target.getChildren();
    }

    getGroups() {
        return this.tree.getAllGroups();
    }

    getGroupById(parentList: Node[], id: string): Node | undefined {
        // parentList 배열을 순회하며 탐색
        for (const parent of parentList) {
            // 현재 노드의 id와 비교
            if (parent.id === id) {
                return parent;
            }

            // 자식 노드 재귀 탐색
            const result = this.getGroupById(parent.getChildren(), id);
            if (result) {
                return result; // 발견 시 즉시 반환
            }
        }

        // 배열 전체를 탐색해도 결과를 찾지 못하면 undefined 반환
        return undefined;
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

    remove(node: Node) {
        node.remove(node);
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

    setCollapsed(node: any, isCollapse: boolean) {
        // 전체 접기/펼치기 상태 업데이트
        this.viewCollapse = isCollapse;

        // 각 그룹의 상태 업데이트
        node.forEach((group: Group) => {
            group.setCollapsed(isCollapse);
        });

        this.triggerEventRerender();
    }

    moveTabToGroup(targetGroup: Group, nodes: Node[]) {
        console.log("🍳targetGroup", targetGroup);
        console.log("🍳node", nodes);

        //기존 부모 그룹에서는 지워줘야함
        nodes.forEach((node) => {
            console.log("🍕🍕🍕", node);
            const parent = node.getParentNode(); //정상적인 Tab이 아님, 이게 없다...ㅠ
            console.log("🌟 parent", parent);
            const parentChildren = parent?.getChildren();
            console.log("🌟 parentChildren", parentChildren);
            const filteredParentChildren = parentChildren?.filter(
                (parentChildrenNode) => parentChildrenNode.id !== node.id
            );

            console.log("333", filteredParentChildren);

            parent?.setChildren(filteredParentChildren);
        });

        nodes.forEach((node) => {
            targetGroup.add(node);
        });
        console.log("nodes", nodes);
        console.log("this.tree", this.tree);

        //새로운 그룹에서는 추가해줘야힘

        //add로 넣어야, 기존꺼랑, 지금꺼랑 유지 된다.
        this.triggerEventRerender();
    }

    getAllParent() {
        const parent = this.tree.getAllGroups();
        //드래그앤 드랍이 가능한 부모를 위해서 tree 추가
        parent.push(this.tree);
        return parent;
    }
}
