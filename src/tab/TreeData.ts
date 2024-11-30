import * as vscode from "vscode";

import { Tab, Group, TreeItemType } from "../types";

export class TreeData {
    private root: Array<Tab | Group> = [];
    private tabMap: Record<string, Tab> = {};
    /**
     * To quickly access group
     */
    private groupMap: Record<string, Group> = {};

    constructor() {
        this.root;
    }

    setState(data: Array<Tab | Group>) {
        this.root = data;
        for (const item of this.root) {
            //type이 TreeItemType.Tab
            if (item.type === TreeItemType.Tab) {
                this.tabMap[item.id] = item;
            } else if (item.type === TreeItemType.Group) {
                this.groupMap[item.id] = item;
            }
        }
    }

    getChildren(element: any) {
        if (!element) {
            return this.root; // 최상위 레벨
        }

        if (element.type === TreeItemType.Group) {
            return (element as Group).children; // 그룹 내부의 탭 반환
        }

        return null; // 탭은 자식이 없음
    }

    getState() {
        return this.root;
    }

    public addGroup(groupName: string) {
        const groupId = `group-${Date.now()}`; // 고유 ID 생성

        const group: Group = {
            type: TreeItemType.Group,
            id: groupId,
            colorId: "chartreuse",
            label: groupName,
            children: [],
            collapsed: true,
        };

        console.log("🎈그룹 newGroup", group);

        this.groupMap[group.id] = group;
        this.root.push(group);
        vscode.window.showInformationMessage(`Group "${groupName}" created!`);
    }

    public addTabToGroup(groupId: string, tab: Tab): void {
        const group = this.groupMap[groupId];
        if (group) {
            group.children.push(tab);
            console.log(`📝 그룹 "${group.label}"에 탭 추가됨:`, tab);
        } else {
            console.error("그룹을 찾을 수 없습니다:", groupId);
        }
    }
}
