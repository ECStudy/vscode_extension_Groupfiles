export enum Command {
    //추가
    CREATE_GROUP = "create.group",
    CREATE_GROUP_TAB = "create.group.tab",
    CREATE_GROUP_GROUP = "create.group.group",

    //제거
    DELET_TAB = "delete.tab",
    DELETE_GROUP = "delete.group",
    DELET_All = "delete.all",

    //업데이트
    UPDATE_GROUP_LABEL = "update.group.label",
    UPDATE_GROUP_COLOR = "update.group.color",
    UPDATE_GROUP_DESCRIPTION = "update.group.description",

    UPDATE_TAB_LABEL = "update.tab.label",
    UPDATE_TAB_DESCRIPTION = "update.tab.description",
}
