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

export class Tab extends Node implements TabItem {
    readonly type = TreeItemType.Tab;
    id: string;
    path: string;
    uri: vscode.Uri;
    label?: string;
    description?: string;
    workspaceUri?: any;

    constructor(id: string, nativeTab: any, payload?: any) {
        super(id);
        this.id = id;
        this.path = (nativeTab.input as NativeTabInput)?.uri?.path;
        this.uri = (nativeTab.input as NativeTabInput)?.uri;
        this.label = payload?.label || "";
        this.description = payload?.description || "";
        this.workspaceUri = payload?.workspaceUri; //저장시점의 워크스페이스를 저장한다.
    }

    render(
        context: vscode.ExtensionContext,
        payload?: RenderPayload
    ): vscode.TreeItem {
        const item = new vscode.TreeItem(
            this.uri,
            vscode.TreeItemCollapsibleState.None
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
}
