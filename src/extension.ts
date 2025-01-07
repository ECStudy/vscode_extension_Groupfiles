import * as vscode from "vscode";

import { TabView } from "./view/TabView";
import { Group } from "./node/Group";
import { Tab } from "./node/Tab";

export function activate(context: vscode.ExtensionContext) {
    /** 글로벌에 있는 context.globalState 데이터 깔끔하게 초기화*/

    // //TODO : provider로 빼기
    // context.subscriptions.push(
    //     vscode.commands.registerCommand("global.state.reset", () => {
    //         // vscode.window.showInformationMessage(
    //         //     "Global State Reset Command Executed"
    //         // );

    //         clearGlobalState(context);
    //     })
    // );

    // // option1 명령 핸들러
    // context.subscriptions.push(
    //     vscode.commands.registerCommand("option1", () => {
    //         vscode.window.showInformationMessage("Option 1 Command Executed");
    //     })
    // );

    context.subscriptions.push(new TabView(context));
}

export function deactivate() {}
