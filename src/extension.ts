import * as vscode from "vscode";

import { TabView } from "./view/TabView";
import { Group } from "./node/Group";
import { Tab } from "./node/Tab";

export function activate(context: vscode.ExtensionContext) {
    //context.globalState 지우기 기능
    //clearGlobalState(context);
    context.subscriptions.push(new TabView(context));
}

export function deactivate() {}

export function clearGlobalState(context: vscode.ExtensionContext) {
    console.log("Global State가 초기화되었습니다.");

    context.globalState.keys().forEach((key) => {
        context.globalState.update(key, undefined); // 키 값을 undefined로 설정하여 제거
    });
}
