import * as vscode from "vscode";
import { Node } from "../node/Node";
import { Group } from "../node/Group";

export interface ICreateGroup {
    label?: string;
    uri?: vscode.Uri;
    group?: Node;
}
