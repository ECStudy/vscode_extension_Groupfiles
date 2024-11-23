import * as vscode from "vscode";

import { Tab, Group, TreeItemType } from "../types";

export class TreeData {
    private root: Array<Tab | Group> = [];
    private tabMap: Record<string, Tab> = {};

    constructor() {
        this.root;
    }

    setData(data: any) {
        console.log();

        this.root = data;
    }

    getTreeRootData() {
        return this.root;
    }

    getChildren(element?: Tab | Group): Array<Tab | Group> | null {
        if (!element) {
            return this.root;
        }
        if (element.type === TreeItemType.Tab) {
            return null;
        }
        return element.children;
    }

    /**
     * onDidChangeTabs(e.opened) 통해서 열린 tab 저장
     * @param tabId
     */
    appendTab(tabId: string) {
        if (!this.tabMap[tabId]) {
            this.tabMap[tabId] = {
                id: tabId,
                type: TreeItemType.Tab,
                groupId: null,
            };

            //[{key : 전체 path : {id, type, groupId}}, {}, {}]
            this.root.push(this.tabMap[tabId]);
        }

        console.log("root-->", this.root);
        console.log("this.tabMap-->", this.tabMap);
    }

    deleteTab(tabId: string) {
        const tab = this.tabMap[tabId];
        delete this.tabMap[tabId];

        console.log("root-->", this.tabMap);
    }

    public getTab(tabId: string): Tab | undefined {
        return this.tabMap[tabId];
    }
}
