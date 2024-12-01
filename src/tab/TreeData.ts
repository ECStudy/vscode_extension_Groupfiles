import * as vscode from "vscode";

import { TabItem, GroupItem, TreeItemType } from "../type/types";

import { v4 as uuidv4 } from "uuid";

export class TreeData {
    private root: Array<TabItem | GroupItem> = [];
    private tabMap: Record<string, TabItem> = {};
    private groupMap: Record<string, GroupItem> = {};

    constructor() {
        this.root;
    }

    getData(): Array<TabItem | GroupItem> {
        return this.root;
    }

    setData(data: Array<TabItem | GroupItem>) {
        this.root = data;

        //빠른 처리를 위해서 map에 각각 저장
        for (const item of this.root) {
            //TreeItemType.Tab
            if (item.type === TreeItemType.Tab) {
                this.tabMap[item.id] = item;
            }
            //TreeItemType.Group
            else if (item.type === TreeItemType.Group) {
                this.groupMap[item.id] = item;
            }
        }
    }

    getChildren(element?: TabItem | GroupItem) {
        if (!element) {
            return this.root; // 최상위 레벨
        }

        if (element.type === TreeItemType.Group) {
            return element.children; // 그룹 내부의 탭 반환
        }

        return null; // 탭은 자식이 없음
    }

    createGroup(groupName: string) {
        const groupId = `group-${uuidv4()}`; // 고유 ID 생성

        const newGroup: GroupItem = {
            type: TreeItemType.Group,
            id: groupId,
            colorId: "chartreuse",
            label: groupName,
            children: [],
            collapsed: true,
        };

        this.groupMap[newGroup.id] = newGroup;
        this.root.push(newGroup);
        vscode.window.showInformationMessage(`Group "${groupName}" 생성!`);
    }
}
