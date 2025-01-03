//tabview.
export const TabViewRefresh = `tab-and-bookmark.tabview.refresh` as const;

//CRUD - tab
export const TabViewCreateTab = `tab-and-bookmark.tabview.create.tab` as const;
export const TabViewDeleteTab = `tab-and-bookmark.tabview.delete.tab` as const;

export const TabViewCreateTabToGroup =
    `tab-and-bookmark.tabview.create.TabToGroup` as const;
export const TabViewCreateTabToGroupContext =
    `tab-and-bookmark.tabview.create.TabToGroupContext` as const;

//CRUD - group
export const TabViewCreateGroup =
    `tab-and-bookmark.tabview.create.group` as const;
export const TabViewDeleteGroup =
    `tab-and-bookmark.tabview.delete.group` as const;

//Open
export const TabViewOpenAll = `tab-and-bookmark.tabview.open.all` as const;
export const TabViewOpenTab = `tab-and-bookmark.tabview.open.tab` as const;
export const TabViewOpenGroup = `tab-and-bookmark.tabview.open.group` as const;

//close
export const TabViewCloseTab = `tab-and-bookmark.tabview.close.tab`;

export const tab1 = "tab-and-bookmark.tabview.create.TabToNewGroup";
export const tab2 = "tab-and-bookmark.tabview.delete.group";
export const tab3 = "tab-and-bookmark.tabview.delete.allgroup";
export const tab4 = "tab-and-bookmark.tabview.update.group";
export const tab5 = "tab-and-bookmark.tabview.open.group";
export const tab6 = "tab-and-bookmark.tabview.open.newWorkSpace";
export const tab7 = "tab-and-bookmark.tabview.fold.group";
export const tab8 = "tab-and-bookmark.tabview.unfold.group";
export const tab9 = "tab-and-bookmark.tabview.update.groupicon";
export const tab10 = "workbench.action.closeActiveEditor";

const temp = `

view.fold
view.unfold

create.tab
create.tab.new-group
create.tab.new-group.context
create.tab.prev-group
create.tab.prev-group.context
create.group
create.group.in-group

create.tab.group-group

open.tab
open.group
open.group.new-workspace

update.group
update.group.label
update.group.icon

delete.tab
delete.tab.all
delete.group
delete.group.all

`;
