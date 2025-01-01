import * as vscode from "vscode";
import { Node } from "../node/Node";

export interface ICreateGroup {
    label: string;
    //parentId: string;
    uri?: vscode.Uri;
    group?: Node;
}
