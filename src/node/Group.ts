import * as vscode from "vscode";
import * as path from "path";

import { RenderPayload, TreeItemType } from "../types/types";
import { Node } from "./Node";

import { groupIconPaths } from "../assets";

export class Group extends Node {
    readonly type = TreeItemType.Group;
    // 그룹 이름
    label: string;
    // 컬러코드
    color: string;
    // 접기 펼치기 여부
    collapsed: boolean;
    // 경로
    path: string;
    description?: string;

    constructor(id: string, label: string, payload?: any) {
        super(id);
        this.label = label;
        this.color = "default";
        this.collapsed = false; // 기본적으로 열림 상태
        this.path = "";
        this.description = payload?.description || "";
    }

    render(
        context: vscode.ExtensionContext,
        payload?: RenderPayload
    ): vscode.TreeItem {
        const item = new vscode.TreeItem(
            this.label,
            this.collapsed
                ? vscode.TreeItemCollapsibleState.Collapsed //닫힘 1
                : vscode.TreeItemCollapsibleState.Expanded //열림 2
        );

        item.id = this.id;
        item.contextValue = "group";

        const iconPath =
            groupIconPaths[this.color] || groupIconPaths["default"];
        item.iconPath = {
            light: path.join(context.extensionPath, iconPath),
            dark: path.join(context.extensionPath, iconPath),
        };

        item.tooltip = this.getPath() + this.label; //마우스 오버하면 그룹 경로 표기

        if (
            payload?.viewDescription &&
            this.description &&
            this.description.trim() !== ""
        ) {
            item.description = this.description;
        }

        return item;
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

    setUpdateCollapsed(collapsed: boolean) {
        //현재 노드 collapsed 업데이트
        this.setCollapsed(collapsed);
        //부모 노드 collapsed 업데이트
        const parentNode = this.getParentNode() as Group;
        if (parentNode && parentNode.type === TreeItemType.Group) {
            parentNode.setUpdateCollapsed(collapsed);
        }
    }

    setDescription(description?: string) {
        this.description = description;
    }
}
