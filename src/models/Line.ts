import * as vscode from "vscode";

import { NativeTabInput, RenderPayload, TreeItemType } from "../types/types";

import { Node } from "./Node";

export class Line extends Node {
    readonly type = TreeItemType.Line;
    path: string;
    uri: vscode.Uri;
    label?: string;
    lineText?: string;
    line: number;
    //주석
    description?: string;

    constructor(id: string, nativeTab: any, payload?: any) {
        super(id);
        this.path = (nativeTab.input as NativeTabInput)?.uri?.path;
        this.uri = (nativeTab.input as NativeTabInput)?.uri;
        this.label = payload?.label || "";
        this.line = payload?.line;
        this.lineText = payload.lineText;
        this.description = payload?.description || "";
    }

    render(
        context: vscode.ExtensionContext,
        payload?: RenderPayload
    ): vscode.TreeItem {
        const item = new vscode.TreeItem(
            `${this.lineText} ${this.line + 1}`,
            vscode.TreeItemCollapsibleState.None
        );

        item.id = this.id;
        item.contextValue = "line";
        item.iconPath = new vscode.ThemeIcon("bookmark");

        const tempLine = new vscode.Range(this.line, 0, this.line, 100);

        item.command = {
            command: "vscode.open",
            title: "Go to Line",
            arguments: [
                this.uri,
                {
                    selection: new vscode.Range(this.line, 0, this.line, 100),
                },
            ],
        };

        item.tooltip = `${this.path}:${this.line + 1}`;

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

    setLabel(label?: string) {
        this.label = label;
    }

    setDescription(description?: string) {
        this.description = description;
    }
}
