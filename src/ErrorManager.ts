import * as vscode from "vscode";

export class ErrorManager {
    private static logError(error: any, message: string) {
        console.error(message, error);
    }

    /**
     * 비동기 함수에서 발생하는 에러를 처리하는 래퍼 함수
     * @param fn - 실행할 비동기 함수
     * @param errorMessage - 에러 발생 시 출력할 메시지
     * @returns 비동기 함수의 실행 결과 또는 undefined
     */
    public static async asyncErrorLogging<T>(
        fn: () => Promise<T>,
        erorrMessage: string
    ): Promise<T | undefined> {
        try {
            return await fn();
        } catch (error) {
            this.logError(error, erorrMessage);
            return undefined;
        }
    }

    /**
     * 동기 함수에서 발생하는 에러를 처리하는 래퍼 함수
     * @param fn - 실행할 동기 함수
     * @param errorMessage - 에러 발생 시 출력할 메시지
     */
    public static syncErrorLogging<T>(
        fn: () => T,
        erorrMessage: string
    ): T | undefined {
        try {
            return fn();
        } catch (error) {
            this.logError(error, erorrMessage);
            return undefined;
        }
    }
}
