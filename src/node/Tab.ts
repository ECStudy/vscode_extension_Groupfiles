import * as vscode from "vscode";
import * as path from "path";

import { v4 as uuidv4 } from "uuid";

import { NativeTabInput, TabItem, TreeItemType } from "../type/types";

import { getFileName } from "../util";
import { Node } from "./Node";

export class Tab extends Node implements TabItem {
    readonly type = TreeItemType.Tab;
    id: string;
    path: string;
    uri: vscode.Uri;

    constructor(
        id: string,
        nativeTab: vscode.Tab | { input: { uri: vscode.Uri } }
    ) {
        super(id);
        this.id = id;
        this.path = (nativeTab.input as NativeTabInput)?.uri?.path;
        this.uri = (nativeTab.input as NativeTabInput)?.uri;
    }

    render(): vscode.TreeItem {
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
}
