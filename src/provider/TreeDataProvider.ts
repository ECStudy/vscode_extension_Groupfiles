import * as vscode from "vscode";

import { TreeItemType } from "../types/types";

import { Serialize } from "../utils/Serialize";

import { STORAGE_KEYS, StoreageManager } from "../store/StorageManager";

import { Node } from "../models/Node";
import { Tree } from "../models/Tree";
import { Group } from "../models/Group";
import { Tab } from "../models/Tab";
import { Line } from "../models/Line";
import { TreeViewStateService } from "../services/TreeViewStateService";

export class TreeDataProvider
    implements
        vscode.TreeDataProvider<vscode.TreeItem>,
        vscode.TreeDragAndDropController<Group | Tab>
{
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

    private static instance: TreeDataProvider | null = null;

    private storageManager: StoreageManager;
    private viewStateService: TreeViewStateService;

    private tree: Tree;

    private viewCollapse: boolean;
    private viewDescription: boolean;
    private viewAlias: boolean; //탭 별칭

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.tree = Tree.getInstance("root");
        this.viewCollapse = false;
        this.viewDescription = true;
        this.viewAlias = true; //탭 별칭

        this.storageManager = StoreageManager.getInstance(this.context);

        this.viewStateService = new TreeViewStateService(
            () => this.triggerEventRerender(),
            this.storageManager
        );
        this.viewStateService.initialize();
        this.loadData();
    }

    public static getInstance(
        context: vscode.ExtensionContext
    ): TreeDataProvider {
        if (!TreeDataProvider.instance) {
            TreeDataProvider.instance = new TreeDataProvider(context);
        }

        return TreeDataProvider.instance;
    }

    public getGlobalState<T>(key: STORAGE_KEYS) {
        return this.storageManager.get<T>(key);
    }

    public setGlobalState(key: STORAGE_KEYS, data: any) {
        this.storageManager.set(key, data);
    }

    public saveData() {
        // const tree = this.tree;
        // const jsonTree = Serialize.toJson(tree);
        // this.setGlobalState(STORAGE_KEYS.TREE_DATA, jsonTree);
        // this.setGlobalState(STORAGE_KEYS.VIEW_COLLAPSE, this.viewCollapse);
        // this.setGlobalState(
        //     STORAGE_KEYS.VIEW_DESCRIPTION,
        //     this.viewDescription
        // );
        // this.setGlobalState(STORAGE_KEYS.VIEW_ALIAS, this.viewAlias);
    }

    private loadData() {
        // const jsonTree = this.getGlobalState<string>(STORAGE_KEYS.TREE_DATA);
        // if (jsonTree) {
        //     const tree = Serialize.fromJson(jsonTree, this.tree);
        //     this.tree.setChildren(tree.getChildren());
        // }
        // const viewCollapse = this.getGlobalState<boolean>(
        //     STORAGE_KEYS.VIEW_COLLAPSE
        // );
        // if (viewCollapse !== undefined) {
        //     this.viewCollapse = viewCollapse;
        // }
    }

    public triggerEventRerender() {
        this.saveData();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Group | Tab | Line): vscode.TreeItem {
        const itemPayload = {
            viewDescription: this.viewStateService.getDescription(),
            viewAlias: this.viewStateService.getAlias(),
        };

        // Line 타입 확인 추가
        if (element.type === TreeItemType.Line) {
            return element.render(this.context, itemPayload);
        }

        const treeItem = element.render(this.context, itemPayload);
        if (element.type === TreeItemType.Group) {
            //접기 펼치기 캐싱 때문에 렌더 할 때 아이디 변경
            treeItem.id = `${element.id}_${
                element.collapsed ? "collapsed" : "expanded"
            }`;

            treeItem.collapsibleState = element.collapsed
                ? vscode.TreeItemCollapsibleState.Collapsed //닫힘 1
                : vscode.TreeItemCollapsibleState.Expanded; //열림 2
        } else if (
            element.type === TreeItemType.Tab &&
            element.getChildren().length > 0
        ) {
            // Tab에 자식이 있으면 확장 가능하도록 설정
            treeItem.collapsibleState =
                vscode.TreeItemCollapsibleState.Expanded;
        }

        return treeItem;
    }

    getChildren(element?: Group | Tab | Line): (Group | Tab | Line)[] {
        if (element instanceof Line) {
            return [];
        }

        const target = element ?? this.tree;
        return target.getChildren();
    }

    getTree() {
        return this.tree;
    }

    getGroups() {
        return this.tree.getAllGroups();
    }

    getAllTabs(): Node[] {
        return this.tree.getAllTabs();
    }

    setViewCollapsed(nodes: (Group | Tab)[], isCollapse: boolean) {
        // 전체 접기/펼치기 상태 업데이트
        this.viewStateService.setCollapse(isCollapse);

        // 각 그룹의 상태 업데이트
        nodes.forEach((node) => {
            if (node?.type === TreeItemType.Group) {
                // Group인 경우만 setCollapsed 호출
                node.setCollapsed(isCollapse);
            }
        });

        this.triggerEventRerender();
    }

    setViewDescription(state: boolean) {
        this.viewStateService.setDescription(state);
    }

    setViewAlias(state: boolean) {
        this.viewStateService.setAlias(state);
    }

    moveNode(target: any, dropNodeArr: any[]) {
        if (!dropNodeArr) {
            return;
        }

        let targetGroup: Tree | Group;
        let targetIndex: number | undefined;

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

        const targetGroupParent = target.getParentNode() as Group;
        const targetGroupChildren = targetGroupParent.getChildren();

        if (targetGroupChildren.length > 0) {
            targetIndex = targetGroupChildren.findIndex(
                (node) => node.id === target.id
            );
        }

        filterDropNodeArr.forEach((node) => {
            if (node.type === TreeItemType.Line) {
                return;
            }

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
            targetGroup.add(node, targetIndex);
        });
        this.triggerEventRerender();
    }
}
