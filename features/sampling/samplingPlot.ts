import type { Data } from "plotly.js";

export type Impulse = {
    x: number;
    height: number;
};

// Builds textbook-style impulse stems and triangular frequency markers.
export function makeImpulseTraces(
    impulses: Impulse[],
    name: string,
    color: string,
    showLegend = true
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
            line: { color, width: 2.5 },
            hoverinfo: "skip",
        },
        {
            x: markerX,
            y: markerY,
            type: "scatter",
            mode: "markers",
            name,
            showlegend: showLegend,
            marker: { color, size: 12, symbol: "triangle-up" },
            hovertemplate:
                "Frequency: %{x:.2f} Hz<br>Magnitude: %{y:.2f}<extra></extra>",
        },
    ];
}
