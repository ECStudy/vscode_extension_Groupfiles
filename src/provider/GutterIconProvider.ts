import * as vscode from "vscode";
import {
    FileUriString,
    GetterLineInfo,
    GutterDecorationMap,
} from "../types/types";

export class GutterIconProvider {
    private static instance: GutterIconProvider | null = null;
    private lineMarkerDecoration: vscode.TextEditorDecorationType;
    private decorationRanges: GutterDecorationMap = new Map(); // URI 별로 범위 저장

    constructor(context: any) {
        // 데코레이션 타입 초기화
        this.lineMarkerDecoration =
            vscode.window.createTextEditorDecorationType({
                gutterIconPath: context.asAbsolutePath(
                    "images/group_icon_blue.svg"
                ), // 실제 경로로 수정
                gutterIconSize: "contain",
            });

        // 에디터 변경 이벤트 구독하여 데코레이션 유지
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                this.updateDecorations(editor);
            }
        });

        // 문서 변경 이벤트 구독하여 데코레이션 유지
        vscode.workspace.onDidChangeTextDocument((event) => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === event.document) {
                this.updateDecorations(editor);
            }
        });
    }

    public static getInstance(
        context: vscode.ExtensionContext
    ): GutterIconProvider {
        if (!GutterIconProvider.instance) {
            GutterIconProvider.instance = new GutterIconProvider(context);
        }

        return GutterIconProvider.instance;
    }

    /**
     * 아이콘 svg, 아이콘 사이즈 반환
     * @returns
     */
    public getLineMarkerDecoration(): vscode.TextEditorDecorationType {
        return this.lineMarkerDecoration;
    }

    get(uri: FileUriString) {
        return this.decorationRanges.get(uri);
    }

    set(uri: FileUriString, infos: GetterLineInfo[]) {
        this.decorationRanges.set(uri, [...infos]);
    }

    // 에디터 변경 시 데코레이션 업데이트
    updateDecorations(editor: vscode.TextEditor) {
        const uri = editor.document.uri.toString();
        const ranges = this.decorationRanges.get(uri) || [];

        if (ranges.length > 0) {
            editor.setDecorations(this.lineMarkerDecoration, ranges);
        }
    }
}

// 데이터 구조
// "file:///abc.ts" => [
//      line: 10,
//      lineId: 'line_74af64cf-5413-419f-ad1a-5020e73c6d72' },
//      range: ...,
//      tabId: 'tab_0e944ca1-007e-4c2e-a1fc-84d968bf9629',
//      uri:...,
// ]
