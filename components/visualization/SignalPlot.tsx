"use client";

import dynamic from "next/dynamic";
import React, { useLayoutEffect, useRef, useState } from "react";
import type { Data, Layout } from "plotly.js";
import { theme } from "@/styles/theme";
//npm install react-plotly.js plotly.js
//npm install -D @types/react-plotly.js @types/plotly.js
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Pages assemble some traces dynamically. This keeps their plain trace
// objects type-safe without leaking `any` through the shared component.
type PlotTrace = Data | Record<string, unknown>;
type PlotShape = NonNullable<Layout["shapes"]>[number] | Record<string, unknown>;

// StemTraces for discrete
export function makeStemTraces(x: number[], y: Array<number | null>, name: string, color: string): Data[] {
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
    type: "scatter" as const,
    mode: "lines" as const,
    name: `${name} stems`,
    showlegend: false,
    line: { color, width: 2 },
    hoverinfo: "skip" as const,
  };

  const markers = {
    x: mx,
    y: my,
    type: "scatter" as const,
    mode: "markers" as const,
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
  traces: PlotTrace[];
  height: number;
  shapes?: PlotShape[];
  xLabel?: string;
  yLabel?: string;
  xRange?: [number, number];
  yRange?: [number, number];
  compact?: boolean;
  compactM?: boolean;
}) {
  const pad = 8;
  const gap = 8;
  const headerRef = useRef<HTMLDivElement>(null);
  const [titleH, setTitleH] = useState(subtitle ? 44 : 26);

  // Wrapped subtitles can occupy more than one line. Measure the heading so
  // the Plotly canvas always begins below it instead of being overlapped.
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateTitleHeight = () => {
      setTitleH(Math.ceil(header.getBoundingClientRect().height));
    };

    updateTitleHeight();
    const observer = new ResizeObserver(updateTitleHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [subtitle, compact]);

  const plotHeight = Math.max(160, height - pad * 2 - titleH - gap);

  const axisColor = theme.colors.plotAxis;
  const gridColor = theme.colors.gridLine;
  const zeroColor = theme.colors.zeroLine;

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
      <div ref={headerRef} style={{ lineHeight: 1.2, minWidth: 0 }}>
        <div style={{ fontWeight: 850, fontSize: compact ? 14 : 16 }}>{title}</div>

        {subtitle ? (
          <div
            style={{
              marginTop: 2,
              fontWeight: 650,
              fontSize: compact ? 11 : 13,
              opacity: 0.92,
              whiteSpace: "normal",
              overflowWrap: "anywhere",
              minWidth: 0,
              fontFamily: "ui-serif, Times New Roman, serif",
            }}
            className="responsive-math-text"
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <div style={{ height: gap }} />

      <Plot
        data={traces as Data[]}
        layout={{
          height: plotHeight,
          margin: {
            l: compact ? 50 : 80,
            r: compact ? 8 : 18,
            t: 10,
            b: compact ? 42 : compactM ? 48 + 30 : 48 + 10,
          },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "white",

          xaxis: {
            range: xRange,
            fixedrange: true,

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
            fixedrange: true,

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
                  standoff: 10,
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

          shapes: shapes as Layout["shapes"],
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%" }}
      />
    </div>
  );
}
