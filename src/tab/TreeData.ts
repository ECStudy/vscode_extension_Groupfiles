import * as vscode from "vscode";

import { Tab, Group, TreeItemType } from "../types";

export class TreeData {
    private root: Array<Tab | Group> = [];
    private tabMap: Record<string, Tab> = {};

    constructor() {
        this.root;
    }
}
