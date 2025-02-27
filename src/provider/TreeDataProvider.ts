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
import { EventHandler } from "../EventHandler";
import { Node } from "../node/Node";
import { UpdateAction } from "../type/enums";
import { v4 as uuidv4 } from "uuid";
import { Serialize } from "../Serialize";
import { TreeItemType } from "../type/types";
import { STORAGE_KEYS, StoreageManager } from "../StorageManager";
import { ErrorManager } from "../ErrorManager";

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
        ErrorManager.syncErrorLogging(() => {
            const tree = this.tree.getTree();
            const serializedTree = Serialize.toJson(tree);

            console.log("🎈saveData tree", tree);
            console.log("🎈saveData serializedTree", serializedTree);

            this.storageManager.set(STORAGE_KEYS.TREE_DATA, serializedTree);
            this.storageManager.set(
                STORAGE_KEYS.VIEW_COLLAPSE,
                this.viewCollapse
            );
            this.storageManager.set(
                STORAGE_KEYS.VIEW_DESCRIPTION,
                this.viewDescription
            );
        }, "saveData");
    }

    private loadData() {
        ErrorManager.syncErrorLogging(() => {
            const jsonTreeData = this.getGlobalState<string>(
                STORAGE_KEYS.TREE_DATA
            );

            console.log("🎈 loadData tree", jsonTreeData);

            if (jsonTreeData) {
                const treeClass = Serialize.fromJson(jsonTreeData);
                console.log("🎈 loadData treeClass", treeClass);
                this.tree.setChildren(treeClass.getChildren());
            }

            const viewCollapse = this.getGlobalState<boolean>(
                STORAGE_KEYS.VIEW_COLLAPSE
            );
            if (viewCollapse !== undefined) {
                this.viewCollapse = viewCollapse;
            }
        }, "loadData");
    }

    public restoreData(jsonTreeData: string, target?: Group) {
        ErrorManager.syncErrorLogging(() => {
            if (jsonTreeData) {
                const treeClass = Serialize.fromJson(jsonTreeData);

                if (!target) {
                    this.tree.setChildren(treeClass.getChildren());
                } else {
                    target.setChildren(treeClass.getChildren());
                }

                this.triggerEventRerender();
            }
        }, "restoreData");
    }

    public triggerEventRerender() {
        ErrorManager.syncErrorLogging(() => {
            this.saveData();
            this._onDidChangeTreeData.fire();
        }, "triggerEventRerender");
    }

    getTreeItem(element: Group | Tab): vscode.TreeItem {
        return ErrorManager.syncErrorLogging(() => {
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
        }, "getTreeItem")!;
    }

    getChildren(element?: Group | Tab): Group[] {
        return ErrorManager.syncErrorLogging(() => {
            if (element instanceof Tab) {
                return [];
            }

            const target = element ?? this.tree;
            return target.getChildren();
        }, "getChildren")!;
    }

    getGroups(): Node[] {
        return ErrorManager.syncErrorLogging(() => {
            return this.tree.getAllGroups();
        }, "getGroups")!;
    }

    getAllParent(): Node[] {
        return ErrorManager.syncErrorLogging(() => {
            const parent = this.tree.getAllGroups();
            //드래그앤 드랍이 가능한 부모를 위해서 tree 추가
            parent.push(this.tree);
            return parent;
        }, "getAllParent")!;
    }

    // getGroupById(parentList: Node[], id: string): Node | undefined {
    //     const result = ErrorManager.syncErrorLogging(() => {
    //         for (const parent of parentList) {
    //             if (parent.id === id) {
    //                 return parent;
    //             }

    //             // 자식 노드 재귀 탐색
    //             const childResult = this.getGroupById(parent.getChildren(), id);
    //             if (childResult) {
    //                 return childResult;
    //             }
    //         }

    //         return undefined; // 결과를 찾지 못하면 undefined 반환
    //     }, "Error while searching for group by ID");

    //     // 반환값이 undefined일 수 있기 때문에 null 체크를 진행
    //     if (result === undefined) {
    //         // undefined 처리
    //         console.error("Group not found for ID:", id);
    //     }

    //     return result; // 결과 반환
    // }
    /**
     * 그룹 생성
     */
    async createGroup(payload: ICreateGroup): Promise<void> {
        await ErrorManager.asyncErrorLogging(async () => {
            //그룹 신규 생성
            if (payload.createType === CREATE_TYPE.NEW) {
                //그룹 생성
                if (payload?.label) {
                    const group = new Group(
                        `group_${uuidv4()}`,
                        payload?.label
                    );
                    this.tree.add(group);

                    //탭 있는 경우 탭 생성
                    if (payload?.uris) {
                        for (const uri of payload.uris || []) {
                            const stat = await vscode.workspace.fs.stat(uri);
                            //다중 선택해도 파일만 Tab 생성
                            if (stat.type === vscode.FileType.File) {
                                const nativeTab: vscode.Tab = {
                                    input: { uri },
                                    label:
                                        uri.path.split("/").pop() || "Unknown",
                                } as vscode.Tab;

                                const tab = new Tab(
                                    `tab_${uuidv4()}`,
                                    nativeTab
                                );
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

            console.log("🎈트리", this.tree);
            this.triggerEventRerender();
        }, "createGroup");
    }

    createGroupAndGroup(payload: ICreateGroup): void {
        ErrorManager.syncErrorLogging(() => {
            //그룹에서 그룹 생성
            if (payload?.label) {
                const group = new Group(`group_${uuidv4()}`, payload?.label);
                payload?.group?.add(group);
            }

            this.triggerEventRerender();
        }, "createGroupAndGroup");
    }

    resetAll(): void {
        ErrorManager.syncErrorLogging(() => {
            const children = [...this.tree.getChildren()];
            this.tree.reset();
            this.triggerEventRerender();
            return children;
        }, "resetAll");
    }

    remove(node: Node) {
        ErrorManager.syncErrorLogging(() => {
            node.remove(node);
            this.triggerEventRerender();
        }, "remove");
    }

    updateGroup(payload: IUpdateGroup): void {
        ErrorManager.syncErrorLogging(() => {
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
        }, "updateGroup");
    }

    updateTab(payload: IUpdateTab): void {
        ErrorManager.syncErrorLogging(() => {
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
        }, "updateTab");
    }

    setCollapsed(node: any, isCollapse: boolean): void {
        ErrorManager.syncErrorLogging(() => {
            // 전체 접기/펼치기 상태 업데이트
            this.viewCollapse = isCollapse;

            // 각 그룹의 상태 업데이트
            node.forEach((group: Group) => {
                group.setCollapsed(isCollapse);
            });

            this.triggerEventRerender();
        }, "setCollapsed");
    }

    moveNode(target: any, dropNodeArr: any[]): void {
        ErrorManager.syncErrorLogging(() => {
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

            const allGroups = this.getAllParent();
            const nodes = dropNodeArr
                .map((node: any) => {
                    const tempNode = this.tree.findPath(
                        node.split("/").filter(Boolean)
                    );

                    return tempNode;
                })
                .filter((node: any) => node);

            nodes.forEach((node) => {
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

                targetGroup.add(node);
            });

            this.triggerEventRerender();
        }, "moveNode");
    }

    getTree(): Tree {
        return ErrorManager.syncErrorLogging(() => {
            return this.tree;
        }, "getTree")!;
    }

    setViewDescription(isViewDescription: boolean) {
        ErrorManager.syncErrorLogging(() => {
            this.viewDescription = isViewDescription;
            this.triggerEventRerender();
        }, "setViewDescription")!;
    }
}
