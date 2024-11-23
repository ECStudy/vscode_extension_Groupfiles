import * as vscode from "vscode";

import { CommandManager } from "./CommandManager";

import { TreeDataManager } from "./tab/TreeDataManager";
import { TabsGroupView } from "./enums";
import { getNormalizedId } from "./util";
import { Group, Tab, TreeItemType } from "./types";

export class TabView extends CommandManager {
    constructor() {
        super();
    }
}
