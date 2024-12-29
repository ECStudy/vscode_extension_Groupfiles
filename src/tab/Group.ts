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
    // 고유 id
    id: string;
    // 그룹 이름
    label: string;
    // 컬러코드
    colorId: string;
    // 접기 펼치기 여부
    collapsed: boolean;
    // 자식
    children: Group[] = [];
    // 부모 ID
    parentId: string;
    // 부모 라벨
    parentLabel: string;
    // 자식 목록
    childrenList: string[];
    // 경로
    path: string;

    constructor(
        label: string,
        parentId: string,
        parentLabel: string,
        colorId: string = "default"
    ) {
        this.id = `group_${uuidv4()}`;
        this.label = label;
        this.colorId = colorId;
        this.collapsed = false; // 기본적으로 열림 상태
        this.parentId = parentId;
        this.parentLabel = parentLabel;
        this.childrenList = [];
        this.path = this.createPath();
    }

    createPath() {
        return `${this.parentLabel}/${this.label}`;
    }

    render(context: vscode.ExtensionContext): vscode.TreeItem {
        console.log("render Group : this --->", this);
        console.log("render Group : context", context);

        const groupItem = new vscode.TreeItem(
            this.label,
            this.collapsed
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.Expanded
        );

        groupItem.id = this.id;
        groupItem.contextValue = "group";

        const iconPath =
            groupIconPaths[this.colorId] || groupIconPaths["default"];
        groupItem.iconPath = {
            light: path.join(context.extensionPath, iconPath),
            dark: path.join(context.extensionPath, iconPath),
        };

        return groupItem;
    }
}
