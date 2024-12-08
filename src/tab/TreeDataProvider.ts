import * as vscode from "vscode";

import { TreeData } from "./TreeData";
import { GroupItem, TabItem, TreeItemType } from "../type/types";
import { getNativeTabByTabItemPath, getNormalizedId } from "../util";

import { Group } from "./Group";
import { Tab } from "./Tab";

export class TreeDataProvider
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private treeData: TreeData = new TreeData();
    // EventEmitter를 정의
    private _onDidChangeTreeData: vscode.EventEmitter<
        vscode.TreeItem | undefined | void
    > = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();

    private treeItemMap: Record<string, vscode.TreeItem> = {};

    readonly onDidChangeTreeData: vscode.Event<
        vscode.TreeItem | undefined | void
    > = this._onDidChangeTreeData.event;

    constructor() {}

    getTreeItem(element: Group | Tab): vscode.TreeItem {
        // Tab 또는 Group 클래스의 toTreeItem 메서드를 활용
        return element.toTreeItem();
    }

    getChildren(element?: Group | Tab): Array<Group | Tab> {
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
}
