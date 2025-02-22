import * as vscode from "vscode";
import * as path from "path";

import { v4 as uuidv4 } from "uuid";

import {
    NativeTabInput,
    RenderPayload,
    TabItem,
    TreeItemType,
} from "../type/types";

import { getFileName } from "../util";
import { Node } from "./Node";

export class Tab extends Node implements TabItem {
    readonly type = TreeItemType.Tab;
    id: string;
    path: string;
    uri: vscode.Uri;
    label?: string;
    description?: string;

    constructor(id: string, nativeTab: any, arg?: any) {
        super(id);
        this.id = id;
        this.path = (nativeTab.input as NativeTabInput)?.uri?.path;
        this.uri = (nativeTab.input as NativeTabInput)?.uri;
        this.label = arg?.label || "";
        this.description = arg?.description || "";
    }

    render(
        context: vscode.ExtensionContext,
        payload?: RenderPayload
    ): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            this.uri,
            vscode.TreeItemCollapsibleState.None
        );
        treeItem.id = this.id;
        treeItem.contextValue = "tab";
        treeItem.iconPath = vscode.ThemeIcon.File;
        treeItem.command = {
            command: "vscode.open",
            title: "Open Tab",
            arguments: [this.uri],
        };
        if (this.label && this.label.trim() !== "") {
            treeItem.label = this.label;
        }
        if (
            payload?.viewDescription &&
            this.description &&
            this.description.trim() !== ""
        ) {
            treeItem.description = this.description;
        }

        return treeItem;
    }

    getLabel(): string {
        return getFileName(this.path);
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
