import * as vscode from "vscode";

export enum STORAGE_KEYS {
    TREE_DATA = "treeData",
    VIEW_COLLAPSE = "viewCollapse",
    VIEW_DESCRIPTION = "viewDescription",
    VIEW_ALIAS = "viewAlias",
}

export class StoreageManager {
    private context: vscode.ExtensionContext;

    constructor(contex: vscode.ExtensionContext) {
        this.context = contex;
    }

    get<T>(key: STORAGE_KEYS): T | undefined {
        const jsonData = this.context.globalState.get(
            "extensionState"
        ) as string;

        if (jsonData) {
            const globalStateState: Record<STORAGE_KEYS, any> =
                JSON.parse(jsonData);
            return globalStateState[key] as T;
        }
    }

    set(key: STORAGE_KEYS, value: any): void {
        const jsonData = this.context.globalState.get(
            "extensionState"
        ) as string;

        const globalStateState: Record<STORAGE_KEYS, any> = jsonData
            ? JSON.parse(jsonData)
            : ({} as Record<STORAGE_KEYS, any>);

        globalStateState[key] = value;

        this.context.globalState.update(
            "extensionState",
            JSON.stringify(globalStateState)
        );
    }
}
