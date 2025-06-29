import * as vscode from "vscode";

import {
    CREATE_TYPE,
    ICreateGroup,
    IUpdateGroup,
    IUpdateTab,
} from "../types/group";

import { UpdateAction } from "../types/enums";
import { TreeItemType } from "../types/types";

import { Serialize } from "../utils/Serialize";

import { STORAGE_KEYS, StoreageManager } from "../store/StorageManager";

import { Tree } from "../node/Tree";
import { Group } from "../node/Group";
import { Tab } from "../node/Tab";
import { Node } from "../node/Node";
import { CreateFactory } from "../node/CreateFactory";
import { Line } from "../node/Line";

export class TreeDataProvider
    implements
        vscode.TreeDataProvider<vscode.TreeItem>,
        vscode.TreeDragAndDropController<Group | Tab>
{
    private static instance: TreeDataProvider | null = null;
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
    private viewAlias: boolean; //탭 별칭

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.tree = Tree.getInstance("root");
        this.viewCollapse = false;
        this.viewDescription = true;
        this.viewAlias = true; //탭 별칭

        this.storageManager = StoreageManager.getInstance(this.context);

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

    public saveData() {
        // const tree = this.tree;
        // const jsonTree = Serialize.toJson(tree);
        // this.storageManager.set(STORAGE_KEYS.TREE_DATA, jsonTree);
        // this.storageManager.set(STORAGE_KEYS.VIEW_COLLAPSE, this.viewCollapse);
        // this.storageManager.set(
        //     STORAGE_KEYS.VIEW_DESCRIPTION,
        //     this.viewDescription
        // );
        // this.storageManager.set(STORAGE_KEYS.VIEW_ALIAS, this.viewAlias);
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
            viewDescription: this.viewDescription,
            viewAlias: this.viewAlias,
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

    setViewCollapsed(nodes: (Group | Tab)[], isCollapse: boolean) {
        // 전체 접기/펼치기 상태 업데이트
        this.viewCollapse = isCollapse;

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
        this.viewDescription = state;
        this.triggerEventRerender();
    }

    setViewAlias(state: boolean) {
        this.viewAlias = state;
        this.triggerEventRerender();
    }

    // 공통된 Tab 생성 로직을 처리하는 함수
    private async createTabForGroup(
        group: Group,
        uri: vscode.Uri,
        payload: any
    ) {
        const tab = await CreateFactory.createTab(uri, payload);
        if (tab) {
            group.add(tab);
            // 그룹 상태 업데이트
            if (typeof group.setUpdateCollapsed === "function") {
                group.setUpdateCollapsed(false);
            }
        }
    }

    async createGroup(payload: ICreateGroup) {
        let newGroup;
        //그룹 신규 생성
        if (payload.createType === CREATE_TYPE.NEW) {
            //그룹 생성
            if (payload?.label) {
                const group = CreateFactory.createGroup(payload.label);
                this.tree.add(group);

                //탭 있는 경우 탭 생성
                if (payload?.uris) {
                    for (const uri of payload.uris || []) {
                        await this.createTabForGroup(group, uri, payload);
                    }
                }

                newGroup = group;
            }
        }

        //그룹이 이미 있는 경우
        else if (payload.createType === CREATE_TYPE.PREV) {
            if (payload?.group && payload?.uris) {
                const group = payload?.group;
                for (const uri of payload.uris || []) {
                    await this.createTabForGroup(group, uri, payload);
                }
                newGroup = group;
            }
        }

        this.triggerEventRerender();
        return newGroup;
    }

    createGroupAndGroup(payload: ICreateGroup) {
        //그룹에서 그룹 생성
        if (payload?.label) {
            const group = CreateFactory.createGroup(payload.label);
            payload?.group?.add(group);
        }

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

    async setLine(payload: {
        tab?: Tab; //tab 무조건 있을거임, 있게 바꿔야함
        createInfo: {
            uri: any;
            line: any;
            character: any;
            cursorPosition: any;
        };
    }) {
        const { tab, createInfo } = payload;

        const lineNode = await CreateFactory.createLine(createInfo.uri, {
            line: createInfo.line,
        });

        if (lineNode) {
            tab?.add(lineNode);
            this.triggerEventRerender();
        }
    }

    removeLine(tab: Tab, line: number) {
        tab.removeLineByLineNumber(line);
        this.triggerEventRerender();
    }

    getAllTabs(): Node[] {
        return this.tree.getAllTabs();
    }
}
