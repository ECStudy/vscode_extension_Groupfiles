import * as vscode from "vscode";

export const registerCommandCheckContextMenu = ({
    trueCommand,
    falseCommand,
    whenCondition,
    trueCallback,
    falseCallback,
}: {
    trueCommand: string;
    falseCommand: string;
    whenCondition: string;
    trueCallback: () => void;
    falseCallback: () => void;
}) => {
    const setContext = (state: boolean) => {
        vscode.commands.executeCommand("setContext", whenCondition, state);
    };

    vscode.commands.registerCommand(trueCommand, () => {
        setContext(true);
        trueCallback();
    });

    vscode.commands.registerCommand(falseCommand, () => {
        setContext(false);
        falseCallback();
    });
    setContext(false);
};
