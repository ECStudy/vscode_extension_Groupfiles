import * as vscode from "vscode";
import * as path from "path";

import { v4 as uuidv4 } from "uuid";

import { TabItem, TreeItemType } from "../type/types";

const groupIconPaths: { [key: string]: string } = {
    default: "images/group_icon_default.svg",
    red: "images/group_icon_red.svg",
    blue: "images/group_icon_blue.svg",
    yellow: "images/group_icon_yellow.svg",
    pink: "images/group_icon_black.svg",
    green: "images/group_icon_green.svg",
    purple: "images/group_icon_purple.svg",
    orange: "images/group_icon_orange.svg",
};

export class Group {
    readonly type = TreeItemType.Group;
    id: string;
    label: string;
    colorId: string;
    collapsed: boolean;
    children: TabItem[] = [];

    constructor(label: string, colorId: string = "default") {
        this.id = `group_${uuidv4()}`;
        this.label = label;
        this.colorId = colorId;
        this.collapsed = false; // 기본적으로 열림 상태
    }

    toTreeItem(context: vscode.ExtensionContext): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            this.label,
            this.collapsed
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.Expanded
        );

        treeItem.id = this.id;
        treeItem.contextValue = "group";

        const iconPath =
            groupIconPaths[this.colorId] || groupIconPaths["default"];
        treeItem.iconPath = {
            light: path.join(context.extensionPath, iconPath),
            dark: path.join(context.extensionPath, iconPath),
        };

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

    setColor(newColor: string) {
        this.colorId = newColor; // 색상 ID 갱신
    }

    setCollapsed(isCollapsed: boolean) {
        this.collapsed = isCollapsed;
    }
}
