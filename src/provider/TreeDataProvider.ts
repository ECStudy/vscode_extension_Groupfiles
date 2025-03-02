import * as vscode from "vscode";

import { Tree } from "../node/Tree";

import { Group } from "../node/Group";
import { Tab } from "../node/Tab";
import {
    CREATE_TYPE,
    ICreateGroup,
    IUpdateGroup,
    IUpdateTab,
} from "../type/group";

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
    private viewDescription: boolean;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.tree = new Tree("root");
        this.viewCollapse = false;
        this.viewDescription = true;
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
        const tree = this.tree;
        const jsonTree = Serialize.toJson(tree);

        this.storageManager.set(STORAGE_KEYS.TREE_DATA, jsonTree);
        this.storageManager.set(STORAGE_KEYS.VIEW_COLLAPSE, this.viewCollapse);
        this.storageManager.set(
            STORAGE_KEYS.VIEW_DESCRIPTION,
            this.viewDescription
        );
    }

    private loadData() {
        const jsonTree = this.getGlobalState<string>(STORAGE_KEYS.TREE_DATA);

        if (jsonTree) {
            const tree = Serialize.fromJson(jsonTree, this.tree);
            this.tree.setChildren(tree.getChildren());
        }

        const viewCollapse = this.getGlobalState<boolean>(
            STORAGE_KEYS.VIEW_COLLAPSE
        );
        if (viewCollapse !== undefined) {
            this.viewCollapse = viewCollapse;
        }
    }

    public triggerEventRerender() {
        this.saveData();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Group | Tab): vscode.TreeItem {
        const itemPayload = {
            viewDescription: this.viewDescription,
        };
        const treeItem = element.render(this.context, itemPayload);
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

    getAllParent() {
        const parent = this.tree.getAllGroups();
        //드래그앤 드랍이 가능한 부모를 위해서 tree 추가
        parent.push(this.tree);
        return parent;
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
    createGroup = async (payload: ICreateGroup) => {
        //그룹 신규 생성
        if (payload.createType === CREATE_TYPE.NEW) {
            //그룹 생성
            if (payload?.label) {
                const group = new Group(`group_${uuidv4()}`, payload?.label);
                this.tree.add(group);

                //탭 있는 경우 탭 생성
                if (payload?.uris) {
                    for (const uri of payload.uris || []) {
                        const stat = await vscode.workspace.fs.stat(uri);
                        //다중 선택해도 파일만 Tab 생성
                        if (stat.type === vscode.FileType.File) {
                            const nativeTab: vscode.Tab = {
                                input: { uri },
                                label: uri.path.split("/").pop() || "Unknown",
                            } as vscode.Tab;

                            const tab = new Tab(`tab_${uuidv4()}`, nativeTab);
                            group.add(tab);
                            //TODO : group 인터페이스 수정
                            (group as any)?.setUpdateCollapsed(false);
                        }
                    }
                }
            }
        }

        //그룹이 이미 있는 경우
        else if (payload.createType === CREATE_TYPE.PREV) {
            if (payload?.group && payload?.uris) {
                const group = payload?.group;
                for (const uri of payload.uris || []) {
                    const stat = await vscode.workspace.fs.stat(uri);
                    //다중 선택해도 파일만 Tab 생성
                    if (stat.type === vscode.FileType.File) {
                        const nativeTab: vscode.Tab = {
                            input: { uri },
                            label: uri.path.split("/").pop() || "Unknown",
                        } as vscode.Tab;

                        const tab = new Tab(`tab_${uuidv4()}`, nativeTab);
                        group.add(tab);
                        //TODO : group 인터페이스 수정
                        (group as any)?.setUpdateCollapsed(false);
                    }
                }
            }
        }

        this.triggerEventRerender();
    };

    createGroupAndGroup(payload: ICreateGroup) {
        //그룹에서 그룹 생성
        if (payload?.label) {
            const group = new Group(`group_${uuidv4()}`, payload?.label);
            payload?.group?.add(group);
        }

        this.triggerEventRerender();
    }

    resetAll() {
        const children = [...this.tree.getChildren()];
        this.tree.reset();
        this.triggerEventRerender();
        return children;
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
            case UpdateAction.DESCRIPTION:
                payload?.description &&
                    payload.group.setDescription(payload?.description);
                break;
            default:
                break;
        }
        this.triggerEventRerender();
    }

    updateTab(payload: IUpdateTab) {
        switch (payload.action) {
            case UpdateAction.LABEL:
                payload?.label && payload.tab.setLabel(payload?.label);
                break;
            case UpdateAction.DESCRIPTION:
                payload?.description &&
                    payload.tab.setDescription(payload?.description);
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

    moveNode(target: any, dropNodeArr: any[]) {
        if (!dropNodeArr) {
            return;
        }

        let targetGroup: Tree | Group;
        if (!target) {
            targetGroup = this.tree;
        } else {
            if (target?.type === TreeItemType.Group) {
                targetGroup = target;
            }
            //드랍한 타겟이 Tab
            else if (target?.type === TreeItemType.Tab) {
                targetGroup = target.getParentNode() as Group;
            } else {
                //
            }
        }

        // const allGroups = this.getAllParent();
        const filterDropNodeArr = dropNodeArr
            .map((node: any) => {
                const tempNode = this.tree.findPath(
                    node.split("/").filter(Boolean)
                );

                return tempNode;
            })
            .filter((node: any) => node);

        filterDropNodeArr.forEach((node) => {
            //자기 자신이 자기 자신 그룹인 경우 넣을 수 없다.
            if (node.id === targetGroup.id) {
                return;
            }

            //node가 tab인데 tree에 넣을 수는 없다.
            if (
                node.type === TreeItemType.Tab &&
                targetGroup.type === TreeItemType.Tree
            ) {
                return;
            }

            //자기자신 못넣음
            //tab은 tree에 붙을 수 없음
            targetGroup.add(node);
        });
        this.triggerEventRerender();
    }

    getTree() {
        return this.tree;
    }

    setViewDescription(isViewDescription: boolean) {
        this.viewDescription = isViewDescription;
        this.triggerEventRerender();
    }
}
