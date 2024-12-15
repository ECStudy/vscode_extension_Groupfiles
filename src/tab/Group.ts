import * as vscode from "vscode";

import { v4 as uuidv4 } from "uuid";

import { TabItem, TreeItemType } from "../type/types";
import { createColorGroupIcon } from "../color";

export class Group {
    readonly type = TreeItemType.Group;
    id: string;
    label: string;
    colorId: string;
    collapsed: boolean;
    children: TabItem[] = [];

    constructor(label: string, colorId = "chartreuse") {
        this.id = `group_${uuidv4()}`;
        this.label = label;
        this.colorId = colorId;
        this.collapsed = false;
    }

    toTreeItem(): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            this.label,
            this.collapsed
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.Expanded
        );
        treeItem.contextValue = "group";
        treeItem.iconPath = createColorGroupIcon();
        return treeItem;
    }

    addTab(tab: TabItem) {
        const isInTab = this.children.some((item) => item.path === tab.path);

        //동일한게 있는지 체크
        if (isInTab) {
            vscode.window.showInformationMessage(
                "그룹 내부에 동일한 탭이 존재합니다."
            );
            return;
        }

        this.children.push(tab);
    }

    setLabel(newLabel: string) {
        this.label = newLabel;
    }
}
