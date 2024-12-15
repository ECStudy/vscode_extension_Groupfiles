import * as vscode from "vscode";

import { TabItem } from "../type/types";

import { Group } from "./Group";
import { Tab } from "./Tab";

export class TreeData {
    private root: Array<Group> = [];
    private tabMap: Record<string, TabItem> = {};
    private groupMap: Record<string, Group> = {};

    getData(): Array<Group> {
        return this.root;
    }

    setData(groups: Array<Group>) {
        this.root = groups;
        this.tabMap = {};
        this.groupMap = {};

        groups.forEach((group) => {
            this.groupMap[group.id] = group;
            group.children.forEach((tab) => {
                this.tabMap[tab.id] = tab;
            });
        });
    }

    createGroup(label: string): Group {
        const group = new Group(label);
        this.root.push(group);
        this.groupMap[group.id] = group;
        return group;
    }

    createTabToGroup(groupId: string, uri: vscode.Uri): boolean {
        const group = this.groupMap[groupId];
        if (!group) {
            console.error(`Group with ID ${groupId} not found.`);
            return false;
        }

        const nativeTab: vscode.Tab = {
            input: { uri },
            label: uri.path.split("/").pop() || "Unknown",
        } as vscode.Tab;

        const tab = new Tab(nativeTab, groupId);
        group.addTab(tab);
        this.tabMap[tab.id] = tab;
        return true;
    }

    deleteGroup(targetGroupId: string) {
        if (!targetGroupId) {
            console.error(`Group with ID ${targetGroupId} not found.`);
            return false;
        }

        this.root = this.root.filter((group) => group.id !== targetGroupId);
        delete this.groupMap[targetGroupId];

        return true;
    }

    updateGroupLabel(targetGroupId: string, newGroupName: string) {
        const group = this.groupMap[targetGroupId];
        if (!group) {
            return false;
        }

        group.setLabel(newGroupName); // 그룹 이름 변경
        return true;
    }

    getTabById(tabId: string): TabItem {
        return this.tabMap[tabId];
    }

    moveTabToGroup(tabItem: TabItem, targetGroupId: string) {
        const tab = this.tabMap[tabItem.id];
        if (!tab) {
            console.error(`Tab with ID ${tabItem.id} not found.`);
            return;
        }

        const currentGroup = this.root.find((group) =>
            group.children.some((child) => child.id === tabItem.id)
        );

        if (currentGroup) {
            currentGroup.children = currentGroup.children.filter(
                (child) => child.id !== tabItem.id
            );
        }
        const targetGroup = this.groupMap[targetGroupId];
        targetGroup.addTab(tab);
    }
}
