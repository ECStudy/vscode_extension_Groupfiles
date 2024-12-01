import { TabView, BookmartView } from "./enums";

//tabView.
export const TabViewRefresh = `${TabView}.refresh` as const;

//CRUD - tab
export const TabViewCreateTab = `${TabView}.create.tab` as const;
export const TabViewDeleteTab = `${TabView}.delete.tab` as const;

//CRUD - group
export const TabViewCreateGroup = `${TabView}.create.group` as const;
export const TabViewDeleteGroup = `${TabView}.delete.group` as const;

//Open
export const TabViewOpenAll = `${TabView}.open.all` as const;
export const TabViewOpenTab = `${TabView}.open.tab` as const;
export const TabViewOpenGroup = `${TabView}.open.group` as const;
