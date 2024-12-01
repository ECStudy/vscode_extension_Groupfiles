import * as vscode from "vscode";

import { Tab, Group, TreeItemType } from "../type/types";

import { v4 as uuidv4 } from "uuid";

export class TreeData {
    private root: Array<Tab | Group> = [];
    private tabMap: Record<string, Tab> = {};
    private groupMap: Record<string, Group> = {};

    constructor() {
        this.root;
    }

    setState(data: Array<Tab | Group>) {}

    getChildren(element: any) {}

    getState() {}

    public addGroup(groupName: string) {}

    public addTabToGroup(groupId: string, tab: Tab): void {}
}
