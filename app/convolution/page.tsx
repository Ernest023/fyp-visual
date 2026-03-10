"use client";


import { Griffy } from "next/font/google";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

const gapBottom = 10

function ButtonToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 30,
        padding: "0 10px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.35)",
        background: active ? "rgba(255,255,255,0.12)" : "transparent",
        color: "white",
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export default function ConvolutionPage() {
    type TimeMode = "continuous" | "discrete";
    type SourceMode = "preset" | "expression" | "draw";

    // ===== time mode ===== isDiscrete default at continuous
    const [timeMode, setTimeMode] = useState<TimeMode>("continuous");
    const isDiscrete = timeMode === "discrete";

    // X and H Panel source Letters
    const varLetter = isDiscrete ? "[n]" : "[t]";

    // ===== x source + h source ===== sources is default at preset
    const [xSource, setXSource] = useState<SourceMode>("preset");
    const [hSource, setHSource] = useState<SourceMode>("preset");

    return (
    <main
        style={{
        height: "100vh",
        padding: "10px 12px 40px 12px",
        boxSizing: "border-box",
        overflow: "hidden",
        backgroundColor: "#000000",
        color: "#ffffff",
        }}
    >

    {/* Header; 3 column; 1fr at back to center title */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: gapBottom}}>
        {/* Back Link */}
        <div>
        <Link
            href="/"
            style = {{
                display: "inline-block",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 10,
                padding: "5px 10px",
                fontWeight: 650,
                fontSize: 13,
            }}
        >
            ← Back
        </Link>
        </div>
        {/* Title */}
        <h1 style={{ fontSize: 22, fontWeight: 750, margin: 0, justifySelf:"center"}}>Convolution Canvas (Interactive)</h1>
    </div>
    {/* End of header */}

    {/* Control Panel */}
    <div
        style={{
            border: "1px solid rgba(255,255,255,0.35)",
            borderRadius: 12,
            padding: 10,
            boxSizing: "border-box",
            marginBottom: gapBottom,
            background: "rgba(0,0,0,0.12)",
            }}
    >
        {/* Time Mode Buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: gapBottom}}>
            <ButtonToggle label="Continuous-time" active={!isDiscrete} onClick={() => setTimeMode("continuous")} />
            <ButtonToggle label="Discrete-time" active={isDiscrete} onClick={() => setTimeMode("discrete")} />
        </div>

        {/* X and H Panels */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap:12}}>
            {/* X Panel */}
            <div>
                <div style={{ fontWeight:850, display:"flex", alignItems:"center", gap:8, marginBottom:gapBottom}}>
                <span>x{varLetter} source:</span>
                <ButtonToggle label="Preset" active={xSource === "preset"} onClick={() => setXSource("preset")} />
                <ButtonToggle label="Expression" active={xSource === "expression"} onClick={() => setXSource("expression")} />
                <ButtonToggle label="Draw" active={xSource === "draw"} onClick={() => setXSource("draw")} />
                </div>
            </div>
            {/* End of X Panel */}
            {/* H Panel */}
            <div>
                <div style={{ fontWeight:850, display:"flex", alignItems:"center", gap:8, marginBottom:gapBottom}}>
                <span>h{varLetter} source:</span>
                <ButtonToggle label="Preset" active={hSource === "preset"} onClick={() => setHSource("preset")} />
                <ButtonToggle label="Expression" active={hSource === "expression"} onClick={() => setHSource("expression")} />
                <ButtonToggle label="Draw" active={hSource === "draw"} onClick={() => setHSource("draw")} />
                </div>
            </div>
            {/* End of H Panel */}
        </div>

    </div>
    {/* End of Control Panel */}

    {/* Signal Plot input X and H overlap */}
    <div>

    </div>
    {/* End of Signal Plot input X and H overlap */}

    {/* Signal Plot output convolution */}
    <div>

    </div>
    {/* End of Signal Plot output convolution */}

    </main>
    );
}