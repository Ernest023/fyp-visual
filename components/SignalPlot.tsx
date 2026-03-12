"use client";

import dynamic from "next/dynamic";
import React from "react";
//npm install react-plotly.js plotly.js
//npm install -D @types/react-plotly.js @types/plotly.js
const Plot: any = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SignalPlot({
  title,
  subtitle,
  traces,
  height,
  shapes = [],
  xLabel,
  yLabel,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  traces: any[];
  height: number;
  shapes?: any[];
  xLabel?: string;
  yLabel?: string;
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
        <div style={{ fontWeight: 850, fontSize: 18 }}>{title}</div>

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
          margin: { l: 60, r: 18, t: 10, b: 48 + 10 },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "white",

          xaxis: {
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