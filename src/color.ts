import * as vscode from "vscode";

export const colorPalette: any = [
    { label: "#1A73E8", description: "Blue" },
    { label: "#D93025", description: "Red" },
    { label: "#F9AB00", description: "Yellow" },
    { label: "#188038", description: "Green" },
    { label: "#D01884", description: "Pink" },
    { label: "#A142F4", description: "Purple" },
    { label: "#007B83", description: "Teal" },
    { label: "#FA903E", description: "Orange" },
];

// 색상 배열을 무작위로 섞는 유틸리티 함수
const getRandomColor = (): any => {
    const index = Math.floor(Math.random() * colorPalette.length);
    return colorPalette[index];
};

export const createColorGroupIcon = (color?: string): vscode.Uri => {
    const pickColor = color || getRandomColor().label;
    const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="${pickColor}">
            <path fill="${pickColor}" fill-rule="evenodd" d="M1.5 1h2v1H2v12h1.5v1h-2l-.5-.5v-13zm6 6h-2L5 6.5v-2l.5-.5h2l.5.5v2zM6 6h1V5H6zm7.5 1h-3l-.5-.5v-3l.5-.5h3l.5.5v3zM11 6h2V4h-2zm-3.5 6h-2l-.5-.5v-2l.5-.5h2l.5.5v2zM6 11h1v-1H6zm7.5 2h-3l-.5-.5v-3l.5-.5h3l.5.5v3zM11 12h2v-2h-2zm-1-2H8v1h2zm0-5H8v1h2z" clip-rule="evenodd"/>
        </svg>
    `;
    const encodedSvg = Buffer.from(svgContent).toString("base64");
    return vscode.Uri.parse(`data:image/svg+xml;base64,${encodedSvg}`);
};
