export const getFileName = (path: string) => {
    return path.substring(path.lastIndexOf("/") + 1);
};
