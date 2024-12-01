import { EXTENSION_ID, TAB_VIEW, BOOKMARK_VIEW, ACTION } from "./enums";

//tabview.
export const TabViewRefresh = `${EXTENSION_ID}.${TAB_VIEW}.refresh` as const;

//CRUD - tab
export const TabViewCreateTab =
    `${EXTENSION_ID}.${TAB_VIEW}.${ACTION.CREATE}.tab` as const;
export const TabViewDeleteTab =
    `${EXTENSION_ID}.${TAB_VIEW}.delete.tab` as const;

//CRUD - group
export const TabViewCreateGroup =
    `${EXTENSION_ID}.${TAB_VIEW}.${ACTION.CREATE}.group` as const;
export const TabViewDeleteGroup =
    `${EXTENSION_ID}.${TAB_VIEW}.delete.group` as const;

//Open
export const TabViewOpenAll =
    `${EXTENSION_ID}.${TAB_VIEW}.${ACTION.OPEN}.all` as const;
export const TabViewOpenTab =
    `${EXTENSION_ID}.${TAB_VIEW}.${ACTION.OPEN}.tab` as const;
export const TabViewOpenGroup =
    `${EXTENSION_ID}.${TAB_VIEW}.${ACTION.OPEN}.group` as const;

//close
export const TabViewCloseTab = `${EXTENSION_ID}.${TAB_VIEW}.${ACTION.CLOSE}.tab`;
