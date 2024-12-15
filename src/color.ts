import * as vscode from "vscode";

export const colorPalette: string[] = [
    "#1A73E8",
    "#D93025",
    "#F9AB00",
    "#188038",
    "#D01884",
    "#A142F4",
    "#007B83",
    "#FA903E",
];

// 색상 배열을 무작위로 섞는 유틸리티 함수
const getRandomColor = (): string => {
    const index = Math.floor(Math.random() * colorPalette.length);
    return colorPalette[index];
};

export const createColorGroupIcon = (): vscode.Uri => {
    const color = getRandomColor();
    const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="${color}">
            <path fill="${color}" fill-rule="evenodd" d="M1.5 1h2v1H2v12h1.5v1h-2l-.5-.5v-13zm6 6h-2L5 6.5v-2l.5-.5h2l.5.5v2zM6 6h1V5H6zm7.5 1h-3l-.5-.5v-3l.5-.5h3l.5.5v3zM11 6h2V4h-2zm-3.5 6h-2l-.5-.5v-2l.5-.5h2l.5.5v2zM6 11h1v-1H6zm7.5 2h-3l-.5-.5v-3l.5-.5h3l.5.5v3zM11 12h2v-2h-2zm-1-2H8v1h2zm0-5H8v1h2z" clip-rule="evenodd"/>
        </svg>
    `;
    const encodedSvg = Buffer.from(svgContent).toString("base64");
    return vscode.Uri.parse(`data:image/svg+xml;base64,${encodedSvg}`);
};
