import * as vscode from "vscode";

import { TabView } from "./view/TabView";

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(new TabView(context));
    openStartupFiles();
}

function openStartupFiles() {
    const openFiles = vscode.workspace
        .getConfiguration()
        .get<string[]>("openFilesAtStartup");

    if (openFiles && Array.isArray(openFiles)) {
        openFiles.forEach(async (filePath) => {
            const fileUri = vscode.Uri.file(filePath);
            try {
                await vscode.commands.executeCommand("vscode.open", fileUri);
            } catch (error) {
                console.error(`Failed to open file: ${filePath}`, error);
            }
        });
    }
}

export function deactivate() {}
