import * as vscode from "vscode";

export const globalState = {
    initialize: async (context: vscode.ExtensionContext) => {
        const existingGroups = context.globalState.get<string>("tabGroups");
        if (!existingGroups) {
            await context.globalState.update("tabGroups", "[]");
        }
    },
};
