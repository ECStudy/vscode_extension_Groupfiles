import * as vscode from "vscode";

export interface ICreateGroup {
    label: string;
    parentId: string;
    uri?: vscode.Uri;
}
