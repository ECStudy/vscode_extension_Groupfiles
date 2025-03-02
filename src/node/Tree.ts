import * as vscode from "vscode";

import { GroupItem, TabItem, TreeItemType } from "../type/types";

import { Group } from "./Group";
import { Tab } from "./Tab";
import { ICreateGroup } from "../type/group";
import { Node } from "./Node";

export class Tree extends Node {
    readonly type = TreeItemType.Tree;
    id: string;

    constructor(id: string) {
        super(id);
        this.id = id;
    }

    createGroup(payload: ICreateGroup) {}

    getGroupMap() {}

    resetTree() {}
}
