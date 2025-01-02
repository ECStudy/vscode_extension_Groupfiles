import * as vscode from "vscode";

import { GroupItem, TabItem } from "../type/types";

import { Group } from "./Group";
import { Tab } from "./Tab";
import { ICreateGroup } from "../type/group";
import { Node } from "./Node";

export class Tree extends Node {
    getTree() {
        //return this.root;
    }

    createGroup(payload: ICreateGroup) {}

    getGroupMap() {}

    resetTree() {}
}
