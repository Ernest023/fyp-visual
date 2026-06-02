"use client";

import dynamic from "next/dynamic";
import React from "react";
//npm install react-plotly.js plotly.js
//npm install -D @types/react-plotly.js @types/plotly.js
const Plot: any = dynamic(() => import("react-plotly.js"), { ssr: false });

// StemTraces for discrete
export function makeStemTraces(x: number[], y: Array<number | null>, name: string, color: string) {
  const xs: (number | null)[] = [];
  const ys: (number | null)[] = [];

  const mx: number[] = [];
  const my: number[] = [];

  for (let i = 0; i < x.length; i++) {
    const yi = y[i];
    if (yi === null || Number.isNaN(yi)) continue;

    xs.push(x[i], x[i], null);
    ys.push(0, yi, null);

    mx.push(x[i]);
    my.push(yi);
  }

  const stems = {
    x: xs,
    y: ys,
    type: "scatter",
    mode: "lines",
    name: `${name} stems`,
    showlegend: false,
    line: { color, width: 2 },
    hoverinfo: "skip",
  };

  const markers = {
    x: mx,
    y: my,
    type: "scatter",
    mode: "markers",
    name,
    marker: { color, size: 7 },
  };

  return [stems, markers];
}

export default function SignalPlot({
  title,
  subtitle,
  traces,
  height,
  shapes = [],
  xLabel,
  yLabel,
  xRange,
  yRange,
  compact = false,
  compactM = false,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  traces: any[];
  height: number;
  shapes?: any[];
  xLabel?: string;
  yLabel?: string;
  xRange?: [number, number];
  yRange?: [number, number];
  compact?: boolean;
  compactM?: boolean;
}) {
  const pad = 8;
  const titleH = subtitle ? 44 : 26;
  const gap = 8;

  const plotHeight = Math.max(160, height - pad * 2 - titleH - gap);

  const axisColor = "rgba(231, 231, 231, 0.85)"; // axis line + tick labels
  const gridColor = "rgba(0,0,0,0.18)"; // grid lines
  const zeroColor = "rgba(0, 0, 0, 0.38)"; // x=0 / y=0 line

  return (
    <div
      style={{
        height,
        border: "1px solid rgba(255,255,255,0.35)",
        borderRadius: 14,
        padding: pad,
        boxSizing: "border-box",
        background: "rgba(0,0,0,0.12)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontWeight: 850, fontSize: compact ? 14 : 18 }}>{title}</div>

        {subtitle ? (
          <div
            style={{
              marginTop: 2,
              fontWeight: 650,
              fontSize: 13,
              opacity: 0.92,
              whiteSpace: "nowrap",
              fontFamily: "ui-serif, Times New Roman, serif",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <div style={{ height: gap }} />

      <Plot
        data={traces}
        layout={{
          height: plotHeight,
          margin: {
            l: compact ? 60 : 80,
            r: compact ? 8 : 18,
            t: 10,
            b: compact ? 42 : compactM ? 48 + 30 : 48 + 10,
          },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "white",

          xaxis: {
            range: xRange,

            zeroline: true,
            zerolinecolor: zeroColor,
            zerolinewidth: 1,

            gridcolor: gridColor,
            gridwidth: 1,

            linecolor: axisColor,
            linewidth: 1,
            mirror: true,

            ticks: "outside",
            tickcolor: axisColor,
            tickfont: { color: axisColor, size: 13 },

            title: {
              text: xLabel,
              standoff: 4,
              font: { color: axisColor, size: 14 },
            },
          },

          yaxis: {
            range: yRange,

            zeroline: true,
            zerolinecolor: zeroColor,
            zerolinewidth: 1,

            gridcolor: gridColor,
            gridwidth: 1,

            linecolor: axisColor,
            linewidth: 1,
            mirror: true,

            ticks: "outside",
            tickcolor: axisColor,
            tickfont: { color: axisColor, size: 13 },

            title: yLabel
              ? {
                  text: yLabel,
                  font: { color: axisColor, size: 14 },
                  standoff: 20,
                }
              : undefined,
          },

          legend: {
            x: 0.99,
            y: 0.99,
            xanchor: "right",
            yanchor: "top",
            bgcolor: "rgba(255,255,255,0.80)",
            bordercolor: "rgba(0,0,0,0.15)",
            borderwidth: 1,
          },

          shapes,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%" }}
      />
    </div>
  );
}

