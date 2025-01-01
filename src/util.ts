import * as vscode from "vscode";
import { NativeTabInput } from "./type/types";

export const getNormalizedId = (nativeTab: vscode.Tab): string => {
    if (nativeTab) {
        const nativeTabInput = nativeTab.input as vscode.TabInputText;
        const uriPath = nativeTabInput.uri.path;
        return uriPath;
    }
    return "";
};

export const getNativeTabs = (): vscode.Tab[] => {
    return vscode.window.tabGroups.all.flatMap((tabGroup) => tabGroup.tabs);
};

export const getNativeTabByTabItemPath = (path: string): vscode.Tab => {
    const currentNativeTabs = getNativeTabs();
    const currentNativeTab = currentNativeTabs.filter(
        (nativeTab) =>
            path === `${(nativeTab.input as NativeTabInput).uri.path}`
    );
    return currentNativeTab[0];
};

export const getFileName = (path: string) => {
    return path.substring(path.lastIndexOf("/") + 1);
};
