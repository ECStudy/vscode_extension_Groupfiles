import * as vscode from "vscode";

export const getNormalizedId = (nativeTab: vscode.Tab): string => {
    if (nativeTab) {
        const nativeTabInput = nativeTab.input as vscode.TabInputText;
        const uriPath = nativeTabInput.uri.path;
        return uriPath;
    }
    return "";
};
