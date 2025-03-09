import * as vscode from "vscode";

export const getFileName = (path: string) => {
    return path.substring(path.lastIndexOf("/") + 1);
};

export const showInputBox = async (
    prompt: string,
    placeHolder: string,
    value?: string
) => {
    const input = await vscode.window.showInputBox({
        prompt,
        placeHolder,
        value,
    });
    if (!input) {
        vscode.window.showErrorMessage(`${placeHolder}을(를) 입력해주세요.`);
        return { input: "", result: false };
    }
    return { input, state: true };
};
