interface ICommandManager {
    dispose(): void;
}
export class CommandManager {
    private store = new Set<ICommandManager>();

    /**
     * command 정보 받아와서 store 저장
     * @param dispose
     */
    protected registerCommand(dispose: any): void {
        this.store.add(dispose);
    }

    /**
     * Tabs, BookMark 인스턴스 생성 시 즉시 실행
     * registerCommand 통해서 등록한 store에서 꺼내서 command 정보 등록
     */
    public dispose(): void {
        this.store.forEach((disposable) => disposable.dispose());
        this.store.clear();
    }
}
