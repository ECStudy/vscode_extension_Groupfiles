import exp from "constants";

export const EXTENSION_ID = "tab-and-bookmark" as const;
export const TAB_VIEW = "tabview" as const;
export const BOOKMARK_VIEW = "bookmartview" as const;

export enum ACTION {
    CREATE = "create",
    CLOSE = "close",
    OPEN = "open",
}
