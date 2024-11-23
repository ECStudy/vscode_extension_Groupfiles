import * as vscode from "vscode";

import { TreeData } from "./TreeData";
import { Group, Tab } from "../types";
import { getNormalizedId } from "../util";

export class TreeDataManager
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
    constructor() {}

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): any {
        return element;
    }
}
