"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// useEffect Accepts a function that contains imperative, possibly effectful code.
// useMemo will only recompute the memoized value when one of the deps has changed.
// useRef returns a mutable ref object whose .current property is initialized to the passed argument (initialValue). The returned object will persist for the full lifetime of the component.
// useState Returns a stateful value, and a function to update it.

type DrawSignalCanvasProps = {
  // tau: x-axis , samples: y-axis
  tau: number[];
  samples: number[];
  onChange: (next: number[]) => void;

  yMin?: number;
  yMax?: number;
  height?: number;
  discrete?: boolean;
};

export default function DrawSignalCanvas({
  tau,
  samples,
  onChange,
  yMin = -1,
  yMax = 1,
  height = 140,
  discrete = false,
}: DrawSignalCanvasProps) {
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Track previous point (for filling indices while dragging)
  const lastIdxRef = useRef<number | null>(null);
  const lastValRef = useRef<number | null>(null);

  const tMin = useMemo(() => tau[0], [tau]);
  const tMax = useMemo(() => tau[tau.length - 1], [tau]);

  // Round off small decimal and return as string
  function fmt(n: number) {
    const nearInt = Math.abs(n - Math.round(n)) < 1e-9;
    if (nearInt) return String(Math.round(n));
    return n.toFixed(Math.abs(n) >= 10 ? 0 : 1);
  }

  // [tMin, tMax] dependencies array, compute only if these changes
  const xLabels = useMemo(() => ({ left: fmt(tMin), mid: fmt(0), right: fmt(tMax) }), [tMin, tMax]);

  const yLabels = useMemo(() => {
    const showZero = yMin < 0 && yMax > 0;
    return { top: fmt(yMax), mid: fmt(0), bot: fmt(yMin), showZero };
  }, [yMin, yMax]);

  // converts an x-axis signal value t into a pixel x-position on the canvas
  function tauToX(t: number, w: number) {
    return ((t - tMin) / (tMax - tMin)) * w;
  }
  // converts a y-value into a canvas y-pixel. in math graphs, larger y means higher up. But on a screen, larger y means lower down
  function valueToY(v: number, h: number) {
    const u = (v - yMin) / (yMax - yMin);
    return (1 - u) * h;
  }
  // converts a pixel x-position back into the nearest index in the tau array
  function xToNearestIndex(px: number, w: number) {
    if (tau.length <= 1) return 0;
    const u = px / w;
    const idx = Math.round(u * (tau.length - 1));
    return Math.max(0, Math.min(tau.length - 1, idx));
  }

  function redraw() {
    // check if canva exist
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Get the 2D drawing engine for the canvas to draw draw lines, text, circles and check if context exist
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.clientWidth; // current displayed width of the canvas
    const h = height;
    // set the actual drawing surface size
    canvas.width = w;
    canvas.height = h;

    // background
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, w, h);

    // gridline of the background
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    // number of gridline if discrete mode → based on tau length, but limited between 8 and 16 if continuous mode → always 8
    const vLines = discrete ? Math.min(16, Math.max(8, tau.length)) : 8;
    // gridline of the background
    for (let i = 0; i <= vLines; i++) {
      const x = (i / vLines) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // base line (y=0 if visible, otherwise yMin)
    let yBase = valueToY(yMin, h);
    if (yMin < 0 && yMax > 0) {
      yBase = valueToY(0, h);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.moveTo(0, yBase);
      ctx.lineTo(w, yBase);
      ctx.stroke();
    }

    // label
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = "12px system-ui";
    ctx.fillText(
      discrete ? `Draw h[n]   (range ${yMin}..${yMax})` : `Draw h(t)   (range ${yMin}..${yMax})`,
      10,
      16
    );

    if (!discrete) {
      // continuous line
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < tau.length; i++) {
        const x = tauToX(tau[i], w);
        const y = valueToY(samples[i] ?? 0, h);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      return;
    }

    // discrete stems + markers
    ctx.strokeStyle = "rgba(59,130,246,0.95)";
    ctx.lineWidth = 2;

    for (let i = 0; i < tau.length; i++) {
      const x = tauToX(tau[i], w);
      const y = valueToY(samples[i] ?? 0, h);

      // stem; draw verticle line for discrete
      ctx.beginPath();
      ctx.moveTo(x, yBase);
      ctx.lineTo(x, y);
      ctx.stroke();

      // marker; small circle at the end of the verticle line for discrete
      ctx.fillStyle = "rgba(59,130,246,0.95)";
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // redraw when any of the dependencies value changes
  useEffect(() => {
    redraw();
  }, [samples, tau, height, yMin, yMax, discrete]);
  // redraw when window resize because canva depend on screen size value
  useEffect(() => {
    const onResize = () => redraw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function applyPointer(px: number, py: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.clientWidth;
    const h = height;

    const x = Math.max(0, Math.min(px, w));
    const y = Math.max(0, Math.min(py, h));

    // y -> value
    const u = 1 - y / h;
    const v = yMin + u * (yMax - yMin);

    // x -> index
    const idx = discrete ? xToNearestIndex(x, w) : xToNearestIndex(x, w);

    const next = samples.slice();
    const lastIdx = lastIdxRef.current;
    const lastVal = lastValRef.current;

    if (lastIdx === null || lastVal === null) {
      next[idx] = v;
    } else {
      const a = Math.min(lastIdx, idx);
      const b = Math.max(lastIdx, idx);

      if (discrete) {
        // ✅ discrete: "paint" same value across indices (no interpolation)
        for (let k = a; k <= b; k++) next[k] = v;
      } else {
        // continuous: interpolate between lastVal and v
        for (let k = a; k <= b; k++) {
          const frac = b === a ? 0 : (k - a) / (b - a);
          const interp = lastIdx < idx ? lastVal + frac * (v - lastVal) : v + frac * (lastVal - v);
          next[k] = interp;
        }
      }
    }

    lastIdxRef.current = idx;
    lastValRef.current = v;
    onChange(next);
  }

  return (
    <div
      style={{
        width: "100%",
        border: "1px solid #333",
        borderRadius: 12,
        overflow: "hidden",
        background: "#0b0b0b",
        padding: 8,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "46px 1fr",
          gap: 8,
          alignItems: "stretch",
        }}
      >
        {/* Y labels */}
        <div
          style={{
            position: "relative",
            height,
            fontFamily: "monospace",
            fontSize: 12,
            color: "rgba(255,255,255,0.75)",
            userSelect: "none",
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0 }}>{yLabels.top}</div>

          {yLabels.showZero && (
            <div style={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)" }}>
              {yLabels.mid}
            </div>
          )}

          <div style={{ position: "absolute", bottom: 0, left: 0 }}>{yLabels.bot}</div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: "100%", height, borderRadius: 10 }}
          onPointerDown={(e) => {
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            setIsDrawing(true);
            lastIdxRef.current = null;
            lastValRef.current = null;

            const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
            applyPointer(e.clientX - rect.left, e.clientY - rect.top);
          }}
          onPointerMove={(e) => {
            if (!isDrawing) return;
            const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
            applyPointer(e.clientX - rect.left, e.clientY - rect.top);
          }}
          onPointerUp={() => {
            setIsDrawing(false);
            lastIdxRef.current = null;
            lastValRef.current = null;
          }}
          onPointerLeave={() => {
            setIsDrawing(false);
            lastIdxRef.current = null;
            lastValRef.current = null;
          }}
        />
      </div>

      {/* X labels */}
      <div
        style={{
          marginTop: 6,
          paddingLeft: 54,
          paddingRight: 6,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "monospace",
          fontSize: 12,
          color: "rgba(255,255,255,0.75)",
          userSelect: "none",
        }}
      >
        <span>{xLabels.left}</span>
        <span>{xLabels.mid}</span>
        <span>{xLabels.right}</span>
      </div>
    </div>
  );
}