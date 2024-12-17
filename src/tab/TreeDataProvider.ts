import * as vscode from "vscode";

import { TreeData } from "./TreeData";
import { GroupItem, TabItem, TreeItemType } from "../type/types";
import { getNativeTabByTabItemPath, getNormalizedId } from "../util";

import { Group } from "./Group";
import { Tab } from "./Tab";

export class TreeDataProvider
    implements
        vscode.TreeDataProvider<vscode.TreeItem>,
        vscode.TreeDragAndDropController<Group | Tab>
{
    private treeData: TreeData = new TreeData();

    // EventEmitter를 정의
    private _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined | void
    > = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();

    readonly onDidChangeTreeData: vscode.Event<
        vscode.TreeItem | undefined | void
    > = this._onDidChangeTreeData.event;

    readonly dropMimeTypes: string[] = ["application/vnd.code.tree.tab"];
    readonly dragMimeTypes: string[] = ["application/vnd.code.tree.tab"];

    constructor() {}

    getTreeItem(element: Group | Tab): vscode.TreeItem {
        console.log("getTreeItem 🍟", element);

        const treeItem = element.toTreeItem();
        if (element instanceof Group) {
            treeItem.collapsibleState = element.collapsed
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.Expanded;
        }
        console.log("getTreeItem 🥚", treeItem);
        return treeItem;
    }

    getChildren(element?: Group | Tab): Array<Group | Tab> {
        console.log("getChildren🍕", element);

        if (!element) {
            // 최상위 레벨: 그룹 목록 반환
            return this.treeData.getData();
        }

        if (element instanceof Group) {
            // 그룹의 자식 탭 반환
            return element.children as any;
        }

        // 탭은 자식이 없음
        return [];
    }

    setData(data: Group[]) {
        this.treeData.setData(data);
        this.triggerRerender();
    }

    public triggerRerender() {
        this._onDidChangeTreeData.fire();
    }

    public closeTab(tab: Tab) {
        const updatedData = this.treeData.getData().map((group) => {
            group.children = group.children.filter(
                (child) => child.id !== tab.id
            );
            return group;
        });

        this.setData(updatedData);
        vscode.window.showInformationMessage("탭이 닫혔습니다.");
    }

    public createGroup(groupName: string) {
        this.treeData.createGroup(groupName);
        this.triggerRerender();
        vscode.window.showInformationMessage(`그룹 "${groupName}" 생성 완료!`);
    }

    public deleteGroup(groupId: string) {
        this.treeData.deleteGroup(groupId);
        this.triggerRerender();
    }

    public deleteAllGroup() {
        this.treeData.deleteAllGroup();
        this.triggerRerender();
    }

    public createTabToGroup(groupId: string, uri: vscode.Uri) {
        try {
            // TreeData에 탭 생성 요청
            const success = this.treeData.createTabToGroup(groupId, uri);

            if (success) {
                this.triggerRerender();
                vscode.window.showInformationMessage(
                    "탭이 그룹에 추가되었습니다."
                );
            } else {
                vscode.window.showErrorMessage(
                    `그룹 ID ${groupId}를 찾을 수 없습니다.`
                );
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(
                `탭 추가 중 오류 발생: ${error.message}`
            );
        }
    }

    public updateGroupLabel(targetGroupId: string, newGroupName: string) {
        const result = this.treeData.updateGroupLabel(
            targetGroupId,
            newGroupName
        );
        if (result) {
            //this.triggerRerender();
            vscode.window.showInformationMessage(
                `탭 이름 변경 ${newGroupName}`
            );
        } else {
            vscode.window.showInformationMessage(`탭 이름 변경 실패`);
        }
    }

    async handleDrag(
        source: readonly (Group | Tab)[],
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Promise<void> {
        if (source.some((item) => !(item instanceof Tab))) {
            vscode.window.showInformationMessage(
                `선택아이템에 그룹이 포함 되어있습니다, 탭만 이동 가능합니다.`
            );
            return;
        }

        const tabIds = source.map((tab) => tab.id).join(",");
        dataTransfer.set(
            "application/vnd.code.tree.tab",
            new vscode.DataTransferItem(tabIds)
        );
        console.log("이동할 탭 id", tabIds);
    }

    async handleDrop(
        target: Group | Tab | undefined,
        dataTransfer: vscode.DataTransfer,
        token: vscode.CancellationToken
    ): Promise<void> {
        console.log("target", target);
        console.log("dataTransfer", dataTransfer);
        console.log("token", token);

        const dataTransferItem = dataTransfer.get(
            "application/vnd.code.tree.tab"
        );
        if (!dataTransferItem) {
            console.error("DataTransferItem is undefined.");
            return;
        }

        // DataTransferItem의 값을 비동기적으로 가져오기
        const draggedTabIds = await dataTransferItem.asString();

        if (!draggedTabIds) {
            console.error("No draggedTabIds found.");
            return;
        }

        const tabIds = draggedTabIds.split(",");
        //타겟이 Group
        let groupId: string | undefined | null;
        if (target instanceof Group) {
            groupId = target.id;
        }
        //타겟이 tab
        else if (target instanceof Tab) {
            groupId = target.groupId;
        }

        if (!groupId) {
            return;
        }
        tabIds.forEach((tabId) => {
            const tabItem = this.treeData.getTabById(tabId);
            if (tabItem) {
                console.log();
                this.treeData.moveTabToGroup(tabItem, groupId); // 그룹으로 이동
            }
        });
        this.triggerRerender();
    }

    public collapseAllGroups(isCollapse: boolean) {
        const groups = this.treeData.getData(); // 트리 데이터 가져오기
        groups.forEach((group) => {
            group.setCollapsed(isCollapse); // 그룹의 collapsed 상태 변경
        });

        console.log(
            `[collapseAllGroups] 모든 그룹 ${
                isCollapse ? "접힘" : "펼침"
            } 상태로 설정`
        );

        // 트리 데이터 갱신 (강제로 UI 업데이트)
        this._onDidChangeTreeData.fire(undefined);
    }

    public updateGroupIcon(groupId: string, color: string) {
        const result = this.treeData.updateGroupIcon(groupId, color);

        if (result) {
            this.triggerRerender();
        } else {
            vscode.window.showInformationMessage(`탭 이름 변경 실패`);
        }
    }
}
