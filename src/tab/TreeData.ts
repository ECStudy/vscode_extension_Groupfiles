import * as vscode from "vscode";

import { Tab, Group, TreeItemType } from "../types";

export class TreeData {
    private root: Array<Tab | Group> = [];
    private tabMap: Record<string, Tab> = {};

    constructor() {
        this.root;
    }

    setState(data: Array<Tab | Group>) {
        this.root = data;
        for (const item of this.root) {
            //type이 TreeItemType.Tab
            if (item.type === TreeItemType.Tab) {
                this.tabMap[item.id] = item;
            } else {
                //TreeItemType/Group
                //그룹인 경우가 들어올 예정
            }
        }
    }

    getChildren(element: any) {
        if (!element) {
            return this.root;
        }
    }

    getState() {
        return this.root;
    }
}
