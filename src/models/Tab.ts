import * as vscode from "vscode";
import * as path from "path";

import { v4 as uuidv4 } from "uuid";

import {
    NativeTabInput,
    RenderPayload,
    TabItem,
    TreeItemType,
} from "../types/types";

import { getFileName } from "../utils/util";
import { Node } from "./Node";
import { Line } from "./Line";

export class Tab extends Node implements TabItem {
    readonly type = TreeItemType.Tab;
    path: string;
    uri: vscode.Uri;
    //가칭
    label?: string;
    //주석
    description?: string;
    workspaceUri?: any;
    // 접기 펼치기 여부
    collapsed: boolean;

    constructor(id: string, nativeTab: any, payload?: any) {
        super(id);
        this.path = (nativeTab.input as NativeTabInput)?.uri?.path;
        this.uri = (nativeTab.input as NativeTabInput)?.uri;
        this.label = payload?.label || "";
        this.description = payload?.description || "";
        this.workspaceUri = payload?.workspaceUri; //저장시점의 워크스페이스를 저장한다.

        this.collapsed = false;
    }

    render(
        context: vscode.ExtensionContext,
        payload?: RenderPayload
    ): vscode.TreeItem {
        const item = new vscode.TreeItem(
            this.uri,
            vscode.TreeItemCollapsibleState.None //열림/닫힘 없음
        );
        item.id = this.id;
        item.contextValue = "tab";
        item.iconPath = vscode.ThemeIcon.File;
        item.command = {
            command: "vscode.open",
            title: "Open Tab",
            arguments: [this.uri],
        };
        if (payload?.viewAlias && this.label && this.label.trim() !== "") {
            item.label = this.label;
        }
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
        return getFileName(this.path);
    }

    getWorkspace(): any {
        return this.workspaceUri;
    }

    remove(item: Tab): void {
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

    setLabel(label?: string) {
        this.label = label;
    }

    setDescription(description?: string) {
        this.description = description;
    }

    getLines(): Line[] {
        return this.getChildren().filter(
            (child) => child instanceof Line
        ) as Line[];
    }

    getTargetLine(lineNumber: number): Line[] {
        const lines = this.getChildren().filter(
            (child) =>
                child.type === TreeItemType.Line && child.line === lineNumber
        );
        return lines;
    }

    addLine(lineNode: Line) {
        this.add(lineNode);
    }

    removeLineByLineNumber(lineNumber: number): void {
        const updated = this.getChildren().filter((child) => {
            return !(
                child.type === TreeItemType.Line && child.line === lineNumber
            );
        });
        this.setChildren(updated);
    }

    setCollapsed(collapsed: boolean) {
        this.collapsed = collapsed;
    }

    //@TODO GROUP이랑 올림
    setUpdateCollapsed(collapsed: boolean) {
        //현재 노드 collapsed 업데이트
        this.setCollapsed(collapsed);
        //부모 노드 collapsed 업데이트
        const parentNode = this.getParentNode() as Tab;
        if (parentNode && parentNode.type === TreeItemType.Tab) {
            parentNode.setUpdateCollapsed(collapsed);
        }
    }
}
