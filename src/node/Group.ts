import * as vscode from "vscode";
import * as path from "path";

import { v4 as uuidv4 } from "uuid";

import { TabItem, TreeItemType } from "../type/types";
import { Node } from "./Node";

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

export class Group extends Node {
    readonly type = TreeItemType.Group;
    // 고유 id
    id: string;
    // 그룹 이름
    label: string;
    // 컬러코드
    color: string;
    // 접기 펼치기 여부
    collapsed: boolean;
    // 경로
    path: string;

    constructor(id: string, label: string) {
        super(id);
        this.id = id;
        this.label = label;
        this.color = "default";
        this.collapsed = false; // 기본적으로 열림 상태
        this.path = "";
    }

    render(context: vscode.ExtensionContext): vscode.TreeItem {
        //console.log("render Group : this --->", this);
        //console.log("render Group : context", context);

        console.log("🩳🩳🩳🩳 collapsed stage", this.collapsed);

        const groupItem = new vscode.TreeItem(
            this.label,
            this.collapsed
                ? vscode.TreeItemCollapsibleState.Collapsed //닫힘 1
                : vscode.TreeItemCollapsibleState.Expanded //열림 2
        );

        groupItem.id = this.id;
        groupItem.contextValue = "group";

        const iconPath =
            groupIconPaths[this.color] || groupIconPaths["default"];
        groupItem.iconPath = {
            light: path.join(context.extensionPath, iconPath),
            dark: path.join(context.extensionPath, iconPath),
        };

        // groupItem.collapsibleState = this.collapsed
        //     ? vscode.TreeItemCollapsibleState.Collapsed
        //     : vscode.TreeItemCollapsibleState.Expanded;

        return groupItem;
    }

    getLabel(): string {
        return this.label;
    }

    setLabel(label: string) {
        this.label = label;
    }

    setColor(color: string) {
        this.color = color;
    }

    //TODO. Tab과 로직이 동일함, 함께 가는 방법 고안
    remove(item: Group): void {
        const targetId = item.id;
        const parentNode = item.getParentNode();
        const parentNodeChildren = parentNode?.getChildren();

        if (parentNodeChildren?.length) {
            const removedChildren = parentNodeChildren?.filter(
                (group) => group.id !== targetId
            );

            parentNode?.setChildren(removedChildren);
        }
    }

    setCollapsed(collapsed: boolean) {
        this.collapsed = collapsed;
    }
}
