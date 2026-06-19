"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SignalPlot, { makeStemTraces } from "@/components/SignalPlot";
import { ParameterSlider } from "@/components/ControlPanelSource";
import { borderColor, backgroundColor, gapBottom } from "@/app/convolution/page";

type SineComponent = {
    id: number;
    frequency: number;
    amplitude: number;
    phase: number;
};

const MAX_SINES = 8;

// Individual Sine Wave Colors
const componentColors = [
    "#22c55e",
    "#3b82f6",
    "#f97316",
    "#a855f7",
    "#ef4444",
    "#14b8a6",
    "#eab308",
    "#ec4899",
];

function wrapPhase(angle: number) {
    let wrapped = angle;

    while (wrapped > Math.PI) wrapped -= 2 * Math.PI;
    while (wrapped < -Math.PI) wrapped += 2 * Math.PI;

    return wrapped;
}

// format to show phase and degree
function formatPhase(phi: number) {
    const tolerance = 0.02;
    const wrappedPhi = wrapPhase(phi);

    const phaseMap = [
        { value: -Math.PI, label: "-π", degree: -180 },
        { value: (-3 * Math.PI) / 4, label: "-3π/4", degree: -135 },
        { value: -Math.PI / 2, label: "-π/2", degree: -90 },
        { value: -Math.PI / 4, label: "-π/4", degree: -45 },
        { value: 0, label: "0", degree: 0 },
        { value: Math.PI / 4, label: "π/4", degree: 45 },
        { value: Math.PI / 2, label: "π/2", degree: 90 },
        { value: (3 * Math.PI) / 4, label: "3π/4", degree: 135 },
        { value: Math.PI, label: "π", degree: 180 },
    ];

    for (const p of phaseMap) {
        if (Math.abs(wrappedPhi - p.value) < tolerance) {
            return `${p.label} rad (${p.degree}°)`;
        }
    }

    const deg = (wrappedPhi * 180) / Math.PI;
    return `${wrappedPhi.toFixed(2)} rad (${deg.toFixed(0)}°)`;
}

function getPhaseSymbol(phi: number) {
    return formatPhase(phi).split(" rad")[0];
}

// start
export default function FourierPage() {
    const [isMobile, setIsMobile] = useState(false);

    const [components, setComponents] = useState<SineComponent[]>([
        { id: 1, frequency: 1, amplitude: 1, phase: 0 },
        { id: 2, frequency: 2, amplitude: 0.5, phase: 0 },
        { id: 3, frequency: 3, amplitude: 0.25, phase: 0 },
    ]);

    const [componentTexts, setComponentTexts] = useState<Record<number, { frequency: string; amplitude: string; phase: string }>>({
        1: { frequency: "1.00", amplitude: "1.00", phase: "0.00" },
        2: { frequency: "2.00", amplitude: "0.50", phase: "0.00" },
        3: { frequency: "3.00", amplitude: "0.25", phase: "0.00" },
    });

    // run code after component render
    useEffect(() => {
        const update = () => setIsMobile(window.innerWidth < 768);

        update();
        window.addEventListener("resize", update);

        return () => window.removeEventListener("resize", update);
    }, []);

    // x coordinate 800 samples from -2 to 2
    const tAxis = useMemo(() => {
        return Array.from({ length: 800 }, (_, i) => -2 + (4 * i) / 799);
    }, []);

    const componentTraces = useMemo(() => {
        return components.map((c, index) => ({
        x: tAxis,
        y: tAxis.map(
            (t) =>
            c.amplitude * Math.sin(2 * Math.PI * c.frequency * t + c.phase)
        ),
        type: "scatter",
        mode: "lines",
        name: `x${c.id}(t)`,
        line: {
            color: componentColors[index % componentColors.length],
            width: 2,
        },
        }));
    }, [components, tAxis]);

    const compositeSignal = useMemo(() => {
        return tAxis.map((t) =>
        components.reduce((sum, c) => {
            return (
            sum +
            c.amplitude * Math.sin(2 * Math.PI * c.frequency * t + c.phase)
            );
        }, 0)
        );
    }, [tAxis, components]);

    // mag and phase spectrum
    const sineSpectrum = useMemo(() => {
        const freqs: number[] = [];
        const mags: number[] = [];
        const phases: number[] = [];

        // mag = amp / 2
        components.forEach((c) => {
        const magnitude = Math.abs(c.amplitude) / 2;

        freqs.push(-c.frequency);
        mags.push(magnitude);
        phases.push(wrapPhase(-c.phase + Math.PI / 2));

        freqs.push(c.frequency);
        mags.push(magnitude);
        phases.push(wrapPhase(c.phase - Math.PI / 2));
        });

        const sorted = freqs
        .map((f, i) => ({
            frequency: f,
            magnitude: mags[i],
            phase: phases[i],
        }))
        .sort((a, b) => a.frequency - b.frequency);

        return {
        frequencies: sorted.map((p) => p.frequency),
        magnitudes: sorted.map((p) => p.magnitude),
        phases: sorted.map((p) => p.phase),
        };
    }, [components]);

  function updateComponent(
    id: number,
    key: keyof Omit<SineComponent, "id">,
    value: number
  ) {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [key]: value } : c))
    );
  }

  function updateComponentText(
    id: number,
    key: keyof Omit<SineComponent, "id">,
    value: string
  ) {
    setComponentTexts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  }

  function addComponent() {
    if (components.length >= MAX_SINES) return;

    const nextId = Math.max(...components.map((c) => c.id)) + 1;

    setComponents((prev) => [
      ...prev,
      {
        id: nextId,
        frequency: nextId,
        amplitude: 0.5,
        phase: 0,
      },
    ]);

    setComponentTexts((prev) => ({
      ...prev,
      [nextId]: {
        frequency: nextId.toFixed(2),
        amplitude: "0.50",
        phase: "0.00",
      },
    }));
  }

  function removeComponent(id: number) {
    setComponents((prev) => prev.filter((c) => c.id !== id));

    setComponentTexts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const compositeTraces = [
    {
      x: tAxis,
      y: compositeSignal,
      type: "scatter",
      mode: "lines",
      name: "x(t)",
      line: { color: "rgba(34,197,94,0.95)", width: 3 },
    },
  ];

  const magnitudeTraces = makeStemTraces(
    sineSpectrum.frequencies,
    sineSpectrum.magnitudes,
    "Magnitude spectrum",
    "rgba(37,99,235,0.95)"
  );

  const phaseTraces = makeStemTraces(
    sineSpectrum.frequencies,
    sineSpectrum.phases,
    "Phase spectrum",
    "rgba(249,115,22,0.95)"
  );

  const compositeSignalText = components
    .map(
      (c) =>
        `${c.amplitude.toFixed(2)}sin(2π·${c.frequency.toFixed(
          2
        )}t + ${getPhaseSymbol(c.phase)})`
    )
    .join(" + ");

  const plotHeight = isMobile ? 320 : 250;

  const maxFreq = Math.max(...components.map((c) => c.frequency), 1);
  const freqRange: [number, number] = [-maxFreq - 1, maxFreq + 1];

  return (
    <main
        style={{
            minHeight: "100vh",
            padding: isMobile ? "8px 8px 28px 8px" : "10px 12px 40px 12px",
            boxSizing: "border-box",
            overflow: "auto",
            color: "#ffffff",
            background: backgroundColor,
        }}
    >
    <div
        style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "auto 1fr" : "1fr auto 1fr",
            alignItems: "center",
            gap: 8,
            marginBottom: gapBottom,
        }}
    >
        {/* back button */}
        <div>
            <Link
                href="/"
                style={{
                display: "inline-block",
                border: borderColor,
                borderRadius: 10,
                padding: "5px 10px",
                fontWeight: 650,
                fontSize: 13,
                }}
            >
                ← Back
            </Link>
        </div>
        
        {/* title */}
        <h1
            style={{
                fontSize: isMobile ? 18 : 22,
                fontWeight: 750,
                margin: 0,
                justifySelf: isMobile ? "start" : "center",
            }}
        >
            Frequency Domain Explorer
        </h1>
    </div>

    {/* control panel */}
    <div
        style={{
            border: borderColor,
            borderRadius: 12,
            padding: 10,
            boxSizing: "border-box",
            marginBottom: gapBottom,
            background: "rgba(0,0,0,0.12)",
        }}
    >
        <div style={{ fontWeight: 850, marginBottom: 8 }}>
            Build x(t) by summing sine waves
        </div>

        {/* column of 8 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(8, 1fr)",
            gap: 10,
          }}
        >
          {components.map((c) => (
            <div
              key={c.id}
              style={{
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 12,
                padding: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 8,
                  fontWeight: 800,
                }}
              >
                <span>Sine {c.id}</span>

                {components.length > 1 && (
                  <button
                    onClick={() => removeComponent(c.id)}
                    style={{
                      border: borderColor,
                      borderRadius: 8,
                      background: "transparent",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <ParameterSlider
                label={`Frequency f = ${c.frequency.toFixed(1)} Hz`}
                value={c.frequency}
                setValue={(v) => updateComponent(c.id, "frequency", v)}
                text={componentTexts[c.id]?.frequency ?? c.frequency.toFixed(2)}
                setText={(s) => updateComponentText(c.id, "frequency", s)}
                minRange={0.1}
                maxRange={10}
                stepRange={0.1}
              />

              <ParameterSlider
                label={`Amplitude A = ${c.amplitude.toFixed(2)}`}
                value={c.amplitude}
                setValue={(v) => updateComponent(c.id, "amplitude", v)}
                text={componentTexts[c.id]?.amplitude ?? c.amplitude.toFixed(2)}
                setText={(s) => updateComponentText(c.id, "amplitude", s)}
                minRange={0}
                maxRange={5}
                stepRange={0.01}
              />

              <ParameterSlider
                label={`Phase φ = ${formatPhase(c.phase)}`}
                value={c.phase}
                setValue={(v) => updateComponent(c.id, "phase", v)}
                text={componentTexts[c.id]?.phase ?? c.phase.toFixed(2)}
                setText={(s) => updateComponentText(c.id, "phase", s)}
                minRange={-Math.PI}
                maxRange={Math.PI}
                stepRange={0.01}
              />
            </div>
          ))}
        </div>

        <button
          onClick={addComponent}
          disabled={components.length >= MAX_SINES}
          style={{
            marginTop: 10,
            height: 32,
            padding: "0 12px",
            borderRadius: 10,
            border: borderColor,
            background:
              components.length >= MAX_SINES
                ? "rgba(255,255,255,0.08)"
                : "transparent",
            color: "white",
            fontWeight: 800,
            cursor: components.length >= MAX_SINES ? "not-allowed" : "pointer",
            opacity: components.length >= MAX_SINES ? 0.55 : 1,
          }}
        >
          + Add sine wave ({components.length}/{MAX_SINES})
        </button>

        {components.length >= MAX_SINES && (
          <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.75 }}>
            Maximum 8 sine components reached.
          </span>
        )}

        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.04)",
            fontFamily: "monospace",
            lineHeight: 1.6,
            overflowX: "auto",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            Composite Signal
          </div>

          <div>x(t) = {compositeSignalText}</div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: gapBottom,
          alignItems: "start",
        }}
      >
        <div>
          <div style={{ marginBottom: gapBottom }}>
            <SignalPlot
              title="Individual Sine Components"
              height={plotHeight}
              traces={componentTraces}
              xLabel="t"
              yLabel="Amplitude"
              xRange={[tAxis[0], tAxis[tAxis.length - 1]]}
            />
          </div>

          <div>
            <SignalPlot
              title="Composite Time-Domain Signal"
              height={plotHeight}
              traces={compositeTraces}
              xLabel="t"
              yLabel="Amplitude"
              xRange={[tAxis[0], tAxis[tAxis.length - 1]]}
            />
          </div>
        </div>

        <div>
          <div style={{ marginBottom: gapBottom }}>
            <SignalPlot
              title="Magnitude Spectrum"
              height={plotHeight}
              traces={magnitudeTraces}
              xLabel="Frequency / Hz"
              yLabel="Magnitude"
              xRange={freqRange}
            />
          </div>

          <div>
            <SignalPlot
              title="Phase Spectrum"
              height={plotHeight}
              traces={phaseTraces}
              xLabel="Frequency / Hz"
              yLabel="Phase / rad"
              yRange={[-Math.PI, Math.PI]}
              xRange={freqRange}
            />
          </div>
        </div>
      </div>
    </main>
  );
}