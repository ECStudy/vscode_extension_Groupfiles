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
}
