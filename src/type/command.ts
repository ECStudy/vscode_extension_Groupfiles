import { TAB_VIEW, BOOKMARK_VIEW } from "./enums";

//tabView.
export const TabViewRefresh = `${TAB_VIEW}.refresh` as const;

//CRUD - tab
export const TabViewCreateTab = `${TAB_VIEW}.create.tab` as const;
export const TabViewDeleteTab = `${TAB_VIEW}.delete.tab` as const;

//CRUD - group
export const TabViewCreateGroup = `${TAB_VIEW}.create.group` as const;
export const TabViewDeleteGroup = `${TAB_VIEW}.delete.group` as const;

//Open
export const TabViewOpenAll = `${TAB_VIEW}.open.all` as const;
export const TabViewOpenTab = `${TAB_VIEW}.open.tab` as const;
export const TabViewOpenGroup = `${TAB_VIEW}.open.group` as const;
