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

    private viewCollapsed: boolean;
    private viewDescription: boolean;
    private viewAlias: boolean; //탭 별칭

    private tabsToExpand = new Set<string>();

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.tree = Tree.getInstance("root");
        this.viewCollapsed = false;
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
        const tree = this.tree;
        const jsonTree = Serialize.toJson(tree);
        this.setGlobalState(STORAGE_KEYS.TREE_DATA, jsonTree);
        this.setGlobalState(STORAGE_KEYS.VIEW_COLLAPSED, this.viewCollapsed);
        this.setGlobalState(
            STORAGE_KEYS.VIEW_DESCRIPTION,
            this.viewDescription
        );
        this.setGlobalState(STORAGE_KEYS.VIEW_ALIAS, this.viewAlias);
    }

    private loadData() {
        try {
            const jsonTree = this.getGlobalState<string>(
                STORAGE_KEYS.TREE_DATA
            );
            if (jsonTree) {
                const tree = Serialize.fromJson(jsonTree, this.tree);
                this.tree.setChildren(tree.getChildren());
            }
            const viewCollapsed = this.getGlobalState<boolean>(
                STORAGE_KEYS.VIEW_COLLAPSED
            );
            if (viewCollapsed !== undefined) {
                this.viewCollapsed = viewCollapsed;
            }

            const viewDescription = this.getGlobalState<boolean>(
                STORAGE_KEYS.VIEW_DESCRIPTION
            );
            if (viewDescription !== undefined) {
                this.viewDescription = viewDescription;
            }

            const viewAlias = this.getGlobalState<boolean>(
                STORAGE_KEYS.VIEW_ALIAS
            );
            if (viewAlias !== undefined) {
                this.viewAlias = viewAlias;
            }
        } catch (error) {
            console.error(`Error : loadData() ${error}`);

            this.tree.reset();
        }
    }

    public triggerEventRerender() {
        this.saveData();
        this._onDidChangeTreeData.fire();
    }

    shouldForceExpandTab(tabId: string): boolean {
        return this.tabsToExpand.has(tabId);
    }

    addForceExpandTab(tabId: string): void {
        this.tabsToExpand.add(tabId);
    }

    deleteForceExpandTab(tabId: string): void {
        this.tabsToExpand.delete(tabId);
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
        // Group
        if (element.type === TreeItemType.Group) {
            //접기 펼치기 캐싱 때문에 렌더 할 때 아이디 변경
            //collapsed 상태에 따라 ID 설정
            treeItem.id = `${element.id}_${
                element.collapsed ? "collapsed" : "expanded"
            }`;

            treeItem.collapsibleState = element.collapsed
                ? vscode.TreeItemCollapsibleState.Collapsed //닫힘 1
                : vscode.TreeItemCollapsibleState.Expanded; //열림 2
        }
        // Tab
        else if (
            element.type === TreeItemType.Tab &&
            element.getChildren().length > 0
        ) {
            // Tab이 Line을 가지고 있으면서 접힌 상태가 아니라면 강제로 펼치기
            const hasLines = element.getLines().length > 0;
            if (hasLines) {
                // Tab 펼칠때 타겟 Tab만 펼칠수 있는 꼼수
                const shouldForceExpand = this.shouldForceExpandTab?.(
                    element.id
                );
                if (!element.collapsed || shouldForceExpand) {
                    treeItem.collapsibleState =
                        vscode.TreeItemCollapsibleState.Expanded;

                    // 강제 펼치기가 필요한 경우에만 새로운 ID 생성
                    treeItem.id = shouldForceExpand
                        ? `${element.id}_expanded_${Date.now()}`
                        : `${element.id}`;
                } else {
                    // 접힌 상태일 때는 고정 ID 사용
                    treeItem.id = `${element.id}`;
                    treeItem.collapsibleState =
                        vscode.TreeItemCollapsibleState.Collapsed;
                }
            }
            //line 없음
            else {
                treeItem.collapsibleState =
                    vscode.TreeItemCollapsibleState.None;
            }
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

    getParent(element: Group | Tab | Line): Node | undefined {
        return element.getParentNode();
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

    setviewCollapsed(nodes: (Group | Tab)[], isCollapsed: boolean) {
        // 전체 접기/펼치기 상태 업데이트
        this.viewStateService.setCollapsed(isCollapsed);

        // 각 그룹의 상태 업데이트
        nodes.forEach((node) => {
            if (node?.type === TreeItemType.Group) {
                // Group인 경우만 setCollapsed 호출
                node.setCollapsed(isCollapsed);
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

    moveNode(
        target: Tree | Group | Tab | Line | undefined,
        dropNodeArr: any[]
    ): any {
        if (!dropNodeArr) {
            return;
        }

        let result = {
            status: true,
            message: "",
        };

        let targetGroup: Tree | Group | Tab;
        let targetTab: Tab;
        let targetIndex: number | undefined;

        // 타겟 결정
        if (!target) {
            targetGroup = this.tree;
        } else {
            if (target?.type === TreeItemType.Group) {
                targetGroup = target;
            }
            //드랍한 타겟이 Tab
            else if (target?.type === TreeItemType.Tab) {
                targetGroup = target.getParentNode() as Group;
            } else if (target?.type === TreeItemType.Line) {
                targetGroup = target.getParentNode() as Tab;
                targetTab = target.getParentNode() as Tab;
            }
        }

        //타겟이 존재할 때만 타겟 인덱스 계산
        if (target) {
            const targetGroupParent = target.getParentNode() as Group;
            const targetGroupChildren = targetGroupParent?.getChildren();

            if (targetGroupParent && targetGroupChildren?.length > 0) {
                targetIndex = targetGroupChildren.findIndex(
                    (node) => node.id === target.id
                );
            }
        }

        // 드롭할 노드들 필터링
        const filterDropNodeArr = dropNodeArr
            .map((node: any) => {
                const tempNode = this.tree.findPath(
                    node.split("/").filter(Boolean)
                );

                return tempNode;
            })
            .filter((node: any) => node);

        // 각 노드 이동처리
        filterDropNodeArr.forEach((node) => {
            //자기 자신이 자기 자신 그룹인 경우 넣을 수 없다.
            if (!node || node.id === targetGroup.id) {
                return;
            }

            //node가 tab인데 tree에 넣을 수는 없다.
            if (
                node.type === TreeItemType.Tab &&
                targetGroup.type === TreeItemType.Tree
            ) {
                return;
            }

            // Line 특수 처리
            if (node.type === TreeItemType.Line) {
                // Line인경우 target 다시 조정
                if (targetGroup.type === TreeItemType.Group) {
                    targetTab = target as Tab;
                    targetGroup = target as Tab;
                }

                // Line은 같은 path를 가진 Tab만 가능하다.
                if (targetTab.path !== node.path) {
                    result.message =
                        "Lines can only be moved within the same file.";
                    return;
                }
            }

            //자기자신 못넣음
            //tab은 tree에 붙을 수 없음
            targetGroup.add(node, targetIndex);
        });

        this.triggerEventRerender();

        return result;
    }

    private async restoreGutterIcons() {
        const allTabs = this.getAllTabs() as Tab[];
    }
}
