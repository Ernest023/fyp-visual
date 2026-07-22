import type { Data } from "plotly.js";
import { theme } from "@/styles/theme";

// Builds Plotly stem and marker traces for Fourier-domain impulses.
export function makeImpulseTraces(
    impulses: { x: number; height: number; label?: string }[],
    name: string,
    color: string = theme.colors.outputSignal
): Data[] {
    const stemX: Array<number | null> = [];
    const stemY: Array<number | null> = [];
    const markerX: number[] = [];
    const markerY: number[] = [];

    impulses.forEach((impulse) => {
        stemX.push(impulse.x, impulse.x, null);
        stemY.push(0, impulse.height, null);
        markerX.push(impulse.x);
        markerY.push(impulse.height);
    });

    return [
        {
            x: stemX,
            y: stemY,
            type: "scatter",
            mode: "lines",
            name: `${name} stems`,
            showlegend: false,
            line: { color, width: 3 },
            hoverinfo: "skip",
        },
        {
            x: markerX,
            y: markerY,
            type: "scatter",
            mode: "markers",
            name,
            showlegend: false,
            marker: { color, size: 14, symbol: "triangle-up" },
        },
    ];
}
