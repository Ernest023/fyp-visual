"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import SignalPlot, { makeStemTraces } from "@/components/SignalPlot";
import { ButtonToggle, ParameterSlider } from "@/components/ControlPanelSource";
import { borderColor, backgroundColor, gapBottom } from "@/app/convolution/page";
import { InlineMath, BlockMath } from "react-katex";


type PageMode = "sine-builder" | "transform-pair";

type PairMode =
    | "exp-right"
    | "exp-left"
    | "double-exp"
    | "delta"
    | "constant"
    | "complex-exp"
    | "cosine"
    | "sine"
    | "step"
    | "rect-to-sinc"
    | "triangle"
    | "sinc-to-rect"
    | "impulse-train";

type TransformPairConfig = {
    label: React.ReactNode;
    formula: string;
    timeTitle: React.ReactNode;
    freqTitle: React.ReactNode;
    timeName: string;
    freqName: string;
    timeSamples: number[];
    freqSamples: number[];

    timeImpulseTraces?: any[];
    freqImpulseTraces?: any[];
    timeYRange?: [number, number];
    freqYRange?: [number, number];
};

type SineComponent = {
    id: number;
    frequency: number;
    amplitude: number;
    phase: number;
};

const MAX_SINES = 8;

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

function sinc(x: number) {
    if (Math.abs(x) < 1e-9) return 1;
    return Math.sin(Math.PI * x) / (Math.PI * x);
}

function rect(x: number) {
    return Math.abs(x) <= 0.5 ? 1 : 0;
}

export default function FourierPage() {
    const [isMobile, setIsMobile] = useState(false);

    const [pageMode, setPageMode] = useState<PageMode>("sine-builder");
    const [pairMode, setPairMode] = useState<PairMode>("exp-right");

    const [pairWidth, setPairWidth] = useState(1);
    const [pairWidthText, setPairWidthText] = useState("1.00");

    const [components, setComponents] = useState<SineComponent[]>([
        { id: 1, frequency: 1, amplitude: 1, phase: 0 },
        { id: 2, frequency: 2, amplitude: 0.5, phase: 0 },
        { id: 3, frequency: 3, amplitude: 0.25, phase: 0 },
    ]);

    const [componentTexts, setComponentTexts] = useState<
        Record<number, { frequency: string; amplitude: string; phase: string }>
    >({
        1: { frequency: "1.00", amplitude: "1.00", phase: "0.00" },
        2: { frequency: "2.00", amplitude: "0.50", phase: "0.00" },
        3: { frequency: "3.00", amplitude: "0.25", phase: "0.00" },
    });

    useEffect(() => {
        const update = () => setIsMobile(window.innerWidth < 768);

        update();
        window.addEventListener("resize", update);

        return () => window.removeEventListener("resize", update);
    }, []);

    const tAxis = useMemo(() => {
        return Array.from({ length: 1600 }, (_, i) => -2 + (4 * i) / 1599);
    }, []);

    const componentTraces = useMemo(() => {
        return components.map((c, index) => ({
            x: tAxis,
            y: tAxis.map(
                (t) =>
                    c.amplitude *
                    Math.sin(2 * Math.PI * c.frequency * t + c.phase)
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
                    c.amplitude *
                        Math.sin(2 * Math.PI * c.frequency * t + c.phase)
                );
            }, 0)
        );
    }, [tAxis, components]);

    const sineSpectrum = useMemo(() => {
    type ComplexValue = {
        re: number;
        im: number;
    };

    const spectrumMap = new Map<string, { frequency: number; value: ComplexValue }>();

    function addToSpectrum(frequency: number, magnitude: number, phase: number) {
            const key = frequency.toFixed(6);

            const re = magnitude * Math.cos(phase);
            const im = magnitude * Math.sin(phase);

            const existing = spectrumMap.get(key);

            if (existing) {
                existing.value.re += re;
                existing.value.im += im;
            } else {
                spectrumMap.set(key, {
                    frequency,
                    value: { re, im },
                });
            }
        }

        components.forEach((c) => {
            const magnitude = Math.abs(c.amplitude) / 2;

            // Positive frequency: phase = φ - π/2
            addToSpectrum(
                c.frequency,
                magnitude,
                c.phase - Math.PI / 2
            );

            // Negative frequency: phase = -φ + π/2
            addToSpectrum(
                -c.frequency,
                magnitude,
                -c.phase + Math.PI / 2
            );
        });

        const sorted = Array.from(spectrumMap.values())
            .map((item) => {
                const { re, im } = item.value;

                const magnitude = Math.sqrt(re * re + im * im);
                const phase = magnitude < 1e-9 ? 0 : wrapPhase(Math.atan2(im, re));

                return {
                    frequency: item.frequency,
                    magnitude,
                    phase,
                };
            })
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

        const nextId =
            components.length === 0
                ? 1
                : Math.max(...components.map((c) => c.id)) + 1;

        const defaultFrequency = Math.min(components.length + 1, 15);

        setComponents((prev) => [
            ...prev,
            {
                id: nextId,
                frequency: defaultFrequency,
                amplitude: 0.5,
                phase: 0,
            },
        ]);

        setComponentTexts((prev) => ({
            ...prev,
            [nextId]: {
                frequency: defaultFrequency.toFixed(2),
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

    const compositeSignalText = (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 4,
            }}
        >
            <InlineMath math="x(t)=" />

            {components.map((c, i) => (
                <span key={i}>
                    {i > 0 && <span style={{ color: "white" }}> + </span>}

                    <span style={{ color: componentColors[i] }}>
                        <InlineMath
                            math={`${c.amplitude.toFixed(
                                2
                            )}\\sin\\left(2\\pi\\cdot${c.frequency.toFixed(
                                2
                            )}\\cdot t+${getPhaseSymbol(c.phase)}\\right)`}
                        />
                    </span>
                </span>
            ))}
        </div>
    );

    const fourierTransformText = (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 4,
            }}
        >
            <InlineMath math="X(f)=" />

            {components.map((c, i) => {
                const mag = (Math.abs(c.amplitude) / 2).toFixed(2);

                return (
                    <span key={i}>
                        {i > 0 && <span style={{ color: "white" }}> + </span>}

                        <span style={{ color: componentColors[i] }}>
                            <InlineMath math={`\\frac{${c.amplitude.toFixed(2)}}{2j}\\left[e^{j${getPhaseSymbol(c.phase)}}\\cdot\\delta\\left(f-${c.frequency.toFixed(2)}\\right)-e^{-j${getPhaseSymbol(c.phase)}}\\cdot\\delta\\left(f+${c.frequency.toFixed(2)}\\right)\\right]`}/>
                        </span>
                    </span>
                );
            })}
        </div>
    );

    function makeImpulseTraces(
        impulses: { x: number; height: number; label?: string }[],
        name: string,
        color = "rgba(37,99,235,0.95)"
    ) {
        const stemX: (number | null)[] = [];
        const stemY: (number | null)[] = [];

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
                marker: {
                    color,
                    size: 14,
                    symbol: "triangle-up",
                },
            },
        ];
    }

    const fourierTransformPhaseText = (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 4,
            }}
        >
            <InlineMath math="X(f)=" />

            {components.map((c, i) => {
                const A = (Math.abs(c.amplitude) / 2).toFixed(2);
                const f = c.frequency.toFixed(2);
                const phi = getPhaseSymbol(c.phase);

                return (
                    <span key={i}>
                        {i > 0 && <span style={{ color: "white" }}> + </span>}

                        <span style={{ color: componentColors[i] }}>
                            <InlineMath
                                math={`${A}e^{j\\left(${phi}-\\frac{\\pi}{2}\\right)}\\delta\\left(f-${f}\\right)+${A}e^{-j\\left(${phi}-\\frac{\\pi}{2}\\right)}\\delta\\left(f+${f}\\right)`}
                            />
                        </span>
                    </span>
                );
            })}
        </div>
    );

    const plotHeight = isMobile ? 320 : 250;

    const maxFreq = Math.max(...components.map((c) => c.frequency), 1);
    const freqRange: [number, number] = [-maxFreq - 1, maxFreq + 1];

    const pairTimeAxis = useMemo(() => {
        return Array.from({ length: 6000 }, (_, i) => -6 + (12 * i) / 5999);
    }, []);

    const pairFreqAxis = useMemo(() => {
        return Array.from({ length: 6000 }, (_, i) => -10 + (20 * i) / 5999);
    }, []);

    function PairLabel({ math }: { math: string }) {
        return (
            <div
                style={{
                    fontSize: "14px",
                    transform: "scale(0.99)",
                    transformOrigin: "center",
                    whiteSpace: "nowrap",
                }}
            >
                <InlineMath math={math} />
            </div>
        );
    }

    const transformPairs: Record<PairMode, TransformPairConfig> = {
        // e^(-at) u(t)
        "exp-right": {
            label: <PairLabel math="\mathrm{e}^{-at}u(t)\overset{\mathcal F}{\longleftrightarrow}\frac{1}{a+j2\pi f}" />,
            formula: `\\mathrm{e}^{-${pairWidth.toFixed(2)}t}u(t)\\overset{\\mathcal F}{\\longleftrightarrow}\\frac{1}{${pairWidth.toFixed(2)}+j2\\pi f},\\quad a>0`,
            timeTitle: <>Time Domain: <InlineMath math="\mathrm{e}^{-at}u(t)" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="\frac{1}{a+j2\pi f}" /></>,
            timeName: "e^(-at)u(t)",
            freqName: "1/(a+j2πf)",
            timeSamples: pairTimeAxis.map((t) => (t >= 0 ? Math.exp(-pairWidth * t) : 0)),
            freqSamples: pairFreqAxis.map((f) => 1 / Math.sqrt(pairWidth ** 2 + (2 * Math.PI * f) ** 2)),
        },

        "exp-left": {
            label: <PairLabel math="\mathrm{e}^{at}u(-t)\overset{\mathcal F}{\longleftrightarrow}\frac{1}{a-j2\pi f}" />,
            formula: `\\mathrm{e}^{${pairWidth.toFixed(2)}t}u(-t)\\overset{\\mathcal F}{\\longleftrightarrow}\\frac{1}{${pairWidth.toFixed(2)}-j2\\pi f},\\quad a>0`,
            timeTitle: <>Time Domain: <InlineMath math="\mathrm{e}^{at}u(-t)" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="\frac{1}{a-j2\pi f}" /></>,
            timeName: "e^(at)u(-t)",
            freqName: "1/(a-j2πf)",
            timeSamples: pairTimeAxis.map((t) => (t <= 0 ? Math.exp(pairWidth * t) : 0)),
            freqSamples: pairFreqAxis.map((f) => 1 / Math.sqrt(pairWidth ** 2 + (2 * Math.PI * f) ** 2)),
        },

        // e^(-a|t|)
        "double-exp": {
            label: <PairLabel math="\mathrm{e}^{-a|t|}\overset{\mathcal F}{\longleftrightarrow}\frac{2a}{a^2+(2\pi f)^2}" />,
            formula: `\\mathrm{e}^{-${pairWidth.toFixed(2)}|t|}\\overset{\\mathcal F}{\\longleftrightarrow}\\frac{2(${pairWidth.toFixed(2)})}{(${pairWidth.toFixed(2)})^2+(2\\pi f)^2}`,
            timeTitle: <>Time Domain: <InlineMath math="\mathrm{e}^{-a|t|}" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="\frac{2a}{a^2+(2\pi f)^2}" /></>,
            timeName: "e^(-a|t|)",
            freqName: "2a/(a²+(2πf)²)",
            timeSamples: pairTimeAxis.map((t) => Math.exp(-pairWidth * Math.abs(t))),
            freqSamples: pairFreqAxis.map((f) => (2 * pairWidth) / (pairWidth ** 2 + (2 * Math.PI * f) ** 2)),
        },

        delta: {
        label: <PairLabel math="\delta(t)\overset{\mathcal F}{\longleftrightarrow}1" />,
        formula: "\\delta(t)\\overset{\\mathcal F}{\\longleftrightarrow}1",
        timeTitle: <>Time Domain: <InlineMath math="\delta(t)" /></>,
        freqTitle: <>Frequency Domain: <InlineMath math="1" /></>,
        timeName: "δ(t)",
        freqName: "1",

        timeSamples: pairTimeAxis.map(() => 0),
        freqSamples: pairFreqAxis.map(() => 1),

        timeImpulseTraces: makeImpulseTraces(
            [{ x: 0, height: 1 }],
            "δ(t)",
            "rgba(34,197,94,0.95)"
        ),

        timeYRange: [0, 1.25],
    },
        
        // 1
        constant: {
            label: <PairLabel math="1\overset{\mathcal F}{\longleftrightarrow}\delta(f)" />,
            formula: "1\\overset{\\mathcal F}{\\longleftrightarrow}\\delta(f)",
            timeTitle: <>Time Domain: <InlineMath math="1" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="\delta(f)" /></>,
            timeName: "1",
            freqName: "δ(f)",
            timeSamples: pairTimeAxis.map(() => 1),
            freqSamples: pairFreqAxis.map(() => 0),
            freqImpulseTraces: makeImpulseTraces(
                [{ x: 0, height: 1 }],
                "δ(f)"
            ),
            freqYRange: [0, 1.25],
        },

        "complex-exp": {
            label: <PairLabel math="\mathrm{e}^{j2\pi f_0t}\overset{\mathcal F}{\longleftrightarrow}\delta(f-f_0)" />,
            formula: `\\mathrm{e}^{j2\\pi(${pairWidth.toFixed(2)})t}\\overset{\\mathcal F}{\\longleftrightarrow}\\delta\\left(f-${pairWidth.toFixed(2)}\\right)`,
            timeTitle: <>Time Domain: <InlineMath math="\cos(2\pi f_0t)" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="\delta(f-f_0)" /></>,
            timeName: "cos part of complex exponential",
            freqName: "δ(f-f₀)",
            timeSamples: pairTimeAxis.map((t) => Math.cos(2 * Math.PI * pairWidth * t)),
            freqSamples: pairFreqAxis.map(() => 0),
            freqImpulseTraces: makeImpulseTraces(
                [{ x: pairWidth, height: 1 }],
                "δ(f-f₀)"
            ),
            freqYRange: [0, 1.25],
        },

        cosine: {
            label: <PairLabel math="\cos(2\pi f_0t)\overset{\mathcal F}{\longleftrightarrow}\frac{1}{2}\left[\delta(f-f_0)+\delta(f+f_0)\right]" />,
            formula: `\\cos\\left(2\\pi(${pairWidth.toFixed(2)})t\\right)\\overset{\\mathcal F}{\\longleftrightarrow}\\frac{1}{2}\\left[\\delta\\left(f-${pairWidth.toFixed(2)}\\right)+\\delta\\left(f+${pairWidth.toFixed(2)}\\right)\\right]`,
            timeTitle: <>Time Domain: <InlineMath math="\cos(2\pi f_0t)" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="\frac12[\delta(f-f_0)+\delta(f+f_0)]" /></>,
            timeName: "cos(2πf₀t)",
            freqName: "cos spectrum",
            timeSamples: pairTimeAxis.map((t) => Math.cos(2 * Math.PI * pairWidth * t)),
            freqSamples: pairFreqAxis.map(() => 0),
            freqImpulseTraces: makeImpulseTraces(
                [
                    { x: -pairWidth, height: 0.5 },
                    { x: pairWidth, height: 0.5 },
                ],
                "cos spectrum"
            ),
            freqYRange: [0, 0.75],
        },

        sine: {
            label: <PairLabel math="\sin(2\pi f_0t)\overset{\mathcal F}{\longleftrightarrow}\frac{1}{2j}\left[\delta(f-f_0)-\delta(f+f_0)\right]" />,
            formula: `\\sin\\left(2\\pi(${pairWidth.toFixed(2)})t\\right)\\overset{\\mathcal F}{\\longleftrightarrow}\\frac{1}{2j}\\left[\\delta\\left(f-${pairWidth.toFixed(2)}\\right)-\\delta\\left(f+${pairWidth.toFixed(2)}\\right)\\right]`,
            timeTitle: <>Time Domain: <InlineMath math="\sin(2\pi f_0t)" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="\frac{1}{2j}[\delta(f-f_0)-\delta(f+f_0)]" /></>,
            timeName: "sin(2πf₀t)",
            freqName: "sine spectrum",
            timeSamples: pairTimeAxis.map((t) => Math.sin(2 * Math.PI * pairWidth * t)),
            freqSamples: pairFreqAxis.map(() => 0),
            freqImpulseTraces: makeImpulseTraces(
                [
                    { x: -pairWidth, height: 0.5 },
                    { x: pairWidth, height: 0.5 },
                ],
                "sine spectrum"
            ),
            freqYRange: [0, 0.75],
        },

        step: {
            label: <PairLabel math="u(t)\overset{\mathcal F}{\longleftrightarrow}\frac{1}{2}\delta(f)+\frac{1}{j2\pi f}" />,
            formula:
                "u(t)\\overset{\\mathcal F}{\\longleftrightarrow}\\frac{1}{2}\\delta(f)+\\frac{1}{j2\\pi f}",
            timeTitle: (
                <>
                    Time Domain: <InlineMath math="u(t)" />
                </>
            ),
            freqTitle: (
                <>
                    Frequency Domain:{" "}
                    <InlineMath math="\frac{1}{2}\delta(f)+\frac{1}{j2\pi f}" />
                </>
            ),
            timeName: "u(t)",
            freqName: "step spectrum",
            timeSamples: pairTimeAxis.map((t) => (t >= 0 ? 1 : 0)),
            freqSamples: pairFreqAxis.map((f) =>
                Math.abs(f) < 0.05 ? 1 : 1 / Math.max(Math.abs(2 * Math.PI * f), 0.1)
            ),
        },

        "rect-to-sinc": {
            label: <PairLabel math="\operatorname{rect}\left(\frac{t}{T}\right)\overset{\mathcal F}{\longleftrightarrow}T\operatorname{sinc}(Tf)" />,
            formula: `\\operatorname{rect}\\!\\left(\\frac{t}{${pairWidth.toFixed(2)}}\\right)\\overset{\\mathcal F}{\\longleftrightarrow}${pairWidth.toFixed(2)}\\operatorname{sinc}\\!\\left(${pairWidth.toFixed(2)}f\\right)`,
            timeTitle: <>Time Domain: <InlineMath math="\operatorname{rect}\left(\frac{t}{T}\right)" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="T\operatorname{sinc}(Tf)" /></>,
            timeName: "rect(t/T)",
            freqName: "T sinc(Tf)",
            timeSamples: pairTimeAxis.map((t) => rect(t / pairWidth)),
            freqSamples: pairFreqAxis.map((f) => pairWidth * sinc(pairWidth * f)),
        },

        triangle: {
            label: <PairLabel math="\Delta\left(\frac{t}{T}\right)\overset{\mathcal F}{\longleftrightarrow}T\operatorname{sinc}^2(Tf)" />,
            formula: `\\Delta\\!\\left(\\frac{t}{${pairWidth.toFixed(2)}}\\right)\\overset{\\mathcal F}{\\longleftrightarrow}${pairWidth.toFixed(2)}\\operatorname{sinc}^{2}\\!\\left(${pairWidth.toFixed(2)}f\\right)`,
            timeTitle: <>Time Domain: <InlineMath math="\Delta(t/T)" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="T\operatorname{sinc}^2(Tf)" /></>,
            timeName: "tri(t/T)",
            freqName: "T sinc²(Tf)",
            timeSamples: pairTimeAxis.map((t) => Math.max(1 - Math.abs(t / pairWidth), 0)),
            freqSamples: pairFreqAxis.map((f) => pairWidth * sinc(pairWidth * f) ** 2),
        },

        "sinc-to-rect": {
            label: <PairLabel math="\operatorname{sinc}\left(\frac{t}{T}\right)\overset{\mathcal F}{\longleftrightarrow}T\operatorname{rect}(Tf)" />,
            formula: `\\operatorname{sinc}\\!\\left(\\frac{t}{${pairWidth.toFixed(2)}}\\right)\\overset{\\mathcal F}{\\longleftrightarrow}${pairWidth.toFixed(2)}\\operatorname{rect}\\!\\left(${pairWidth.toFixed(2)}f\\right)`,
            timeTitle: <>Time Domain: <InlineMath math="\operatorname{sinc}\left(\frac{t}{T}\right)" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="T\operatorname{rect}(Tf)" /></>,
            timeName: "sinc(t/T)",
            freqName: "T rect(Tf)",
            timeSamples: pairTimeAxis.map((t) => sinc(t / pairWidth)),
            freqSamples: pairFreqAxis.map((f) => pairWidth * rect(pairWidth * f)),
        },

        "impulse-train": {
            label: (
                <PairLabel math="\sum_{n=-\infty}^{\infty}\delta(t-nT_0)\overset{\mathcal F}{\longleftrightarrow}\frac{1}{T_0}\sum_{n=-\infty}^{\infty}\delta(f-nf_0)" />
            ),
            formula: `\\sum_{n=-\\infty}^{\\infty}\\delta\\left(t-n${pairWidth.toFixed(2)}\\right)\\overset{\\mathcal F}{\\longleftrightarrow}\\frac{1}{${pairWidth.toFixed(2)}}\\sum_{n=-\\infty}^{\\infty}\\delta\\left(f-n\\frac{1}{${pairWidth.toFixed(2)}}\\right),\\quad f_0=\\frac{1}{T_0}`,
            timeTitle: (<>Time Domain:{" "}<InlineMath math="\sum_{n=-\infty}^{\infty}\delta(t-nT_0)" /></>),
            freqTitle: (<>Frequency Domain:{" "}<InlineMath math="\frac{1}{T_0}\sum_{n=-\infty}^{\infty}\delta(f-nf_0)" /></>),
            timeName: "Impulse train",
            freqName: "Impulse train spectrum",
            timeSamples: pairTimeAxis.map(() => 0),
            freqSamples: pairFreqAxis.map(() => 0),
            timeImpulseTraces: makeImpulseTraces(
                Array.from({ length: 13 }, (_, i) => {
                    const n = i - 6;
                    return {
                        x: n * pairWidth,
                        height: 1,
                    };
                }).filter((p) => p.x >= -6 && p.x <= 6),
                "Impulse train",
                "rgba(34,197,94,0.95)"
            ),

            freqImpulseTraces: makeImpulseTraces(
                Array.from({ length: 17 }, (_, i) => {
                    const n = i - 8;
                    const f0 = 1 / pairWidth;
                    return {
                        x: n * f0,
                        height: 1 / pairWidth,
                    };
                }).filter((p) => p.x >= -10 && p.x <= 10),
                "Impulse train spectrum",
                "rgba(37,99,235,0.95)"
            ),

            timeYRange: [0, 1.25],
            freqYRange: [0, Math.max(1.25, 1 / pairWidth + 0.25)],
        },
    };

    const selectedPair = transformPairs[pairMode];

    const pairTimeTraces =
    selectedPair.timeImpulseTraces ??
    [
        {
            x: pairTimeAxis,
            y: selectedPair.timeSamples,
            type: "scatter",
            mode: "lines",
            name: selectedPair.timeName,
            line: { color: "rgba(34,197,94,0.95)", width: 3 },
        },
    ];

    const pairFreqTraces =
    selectedPair.freqImpulseTraces ??
    [
        {
            x: pairFreqAxis,
            y: selectedPair.freqSamples,
            type: "scatter",
            mode: "lines",
            name: selectedPair.freqName,
            line: { color: "rgba(37,99,235,0.95)", width: 3 },
        },
    ];

    const pairParameterLabel: Record<PairMode, string> = {
        "rect-to-sinc": "Width T",
        "sinc-to-rect": "Width T",
        triangle: "Width T",

        "exp-right": "Decay Constant a",
        "exp-left": "Decay Constant a",
        "double-exp": "Decay Constant a",

        cosine: "Frequency f₀",
        sine: "Frequency f₀",
        "complex-exp": "Frequency f₀",

        "impulse-train": "Period T₀",

        delta: "Parameter",
        constant: "Parameter",
        step: "Parameter",
    };

    const showParameterSlider: Record<PairMode, boolean> = {
        "rect-to-sinc": true,
        "sinc-to-rect": true,
        triangle: true,

        "exp-right": true,
        "exp-left": true,
        "double-exp": true,

        cosine: true,
        sine: true,
        "complex-exp": true,

        "impulse-train": true,

        delta: false,
        constant: false,
        step: false,
    };

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

                <h1
                    style={{
                        fontSize: isMobile ? 18 : 22,
                        fontWeight: 750,
                        margin: 0,
                        justifySelf: isMobile ? "start" : "center",
                    }}
                >
                    Frequency Domain
                </h1>
            </div>

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
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "center",
                        marginBottom: gapBottom,
                    }}
                >
                    <ButtonToggle
                        label="Build x(t) by summing sine waves"
                        active={pageMode === "sine-builder"}
                        onClick={() => setPageMode("sine-builder")}
                    />

                    <ButtonToggle
                        label="Fourier Transform pair"
                        active={pageMode === "transform-pair"}
                        onClick={() => setPageMode("transform-pair")}
                    />
                </div>

                {pageMode === "sine-builder" && (
                    <>
                        <div style={{ fontWeight: 850, marginBottom: 8 }}>
                            Sine Wave Expression: <InlineMath math={"A\\sin\\left(2\\pi f t + \\phi\\right)"} />
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: isMobile ? "1fr" : "repeat(8, 1fr)",
                                gap: 10,
                            }}
                        >
                            {components.map((c, index) => (
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
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <span>Sine {c.id}</span>
                                            <span
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: "50%",
                                                    backgroundColor: componentColors[index % componentColors.length],
                                                    display: "inline-block",
                                                    border: "1px solid rgba(255,255,255,0.35)",
                                                }}
                                            />
                                            
                                        </span>

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
                                        setValue={(v) =>
                                            updateComponent(c.id, "frequency", v)
                                        }
                                        text={
                                            componentTexts[c.id]?.frequency ??
                                            c.frequency.toFixed(2)
                                        }
                                        setText={(s) =>
                                            updateComponentText(c.id, "frequency", s)
                                        }
                                        minRange={0.1}
                                        maxRange={15}
                                        stepRange={0.1}
                                    />

                                    <ParameterSlider
                                        label={`Amplitude A = ${c.amplitude.toFixed(2)}`}
                                        value={c.amplitude}
                                        setValue={(v) =>
                                            updateComponent(c.id, "amplitude", v)
                                        }
                                        text={
                                            componentTexts[c.id]?.amplitude ??
                                            c.amplitude.toFixed(2)
                                        }
                                        setText={(s) =>
                                            updateComponentText(c.id, "amplitude", s)
                                        }
                                        minRange={0}
                                        maxRange={5}
                                        stepRange={0.01}
                                    />

                                    <ParameterSlider
                                        label={`Phase φ = ${formatPhase(c.phase)}`}
                                        value={c.phase}
                                        setValue={(v) =>
                                            updateComponent(c.id, "phase", v)
                                        }
                                        text={
                                            componentTexts[c.id]?.phase ??
                                            c.phase.toFixed(2)
                                        }
                                        setText={(s) =>
                                            updateComponentText(c.id, "phase", s)
                                        }
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
                                cursor:
                                    components.length >= MAX_SINES
                                        ? "not-allowed"
                                        : "pointer",
                                opacity: components.length >= MAX_SINES ? 0.55 : 1,
                            }}
                        >
                            + Add sine wave ({components.length}/{MAX_SINES})
                        </button>

                        {components.length >= MAX_SINES && (
                            <span
                                style={{
                                    marginLeft: 10,
                                    fontSize: 12,
                                    opacity: 0.75,
                                }}
                            >
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

                            <div style={{ marginBottom: 6 }}>{compositeSignalText}</div>

                            <div
                                style={{
                                    paddingTop: 5,
                                    borderTop: "1px solid rgba(255,255,255,0.15)",
                                }}
                            >
                                <div style={{ fontWeight: 800, marginBottom: 6 }}>
                                    Fourier Transform{": "}
                                    <span style={{ fontSize: "0.80em" }}>
                                        <InlineMath math="\mathcal{F}\{\sin(2\pi f_0t)\}= \frac{j}{2}\left[\delta(f+f_0)-\delta(f-f_0)\right]" />
                                    </span>
                                    {" , "}
                                    <span style={{ fontSize: "0.80em" }}>
                                        <InlineMath math="\mathcal{F}\{\sin(2\pi f_0t+\phi)\}=\frac{1}{2j}\left[e^{j\phi}\delta(f-f_0)-e^{-j\phi}\delta(f+f_0)\right]"/>
                                    </span>
                                </div>

                                
                                <span style={{ fontSize: "0.9em" }}>
                                    {fourierTransformText}
                                </span>
                            </div>

                            <div
                                style={{
                                    paddingTop: 5,
                                    borderTop: "1px solid rgba(255,255,255,0.15)",
                                }}
                            >
                                <div style={{ fontWeight: 800, marginBottom: 6 }}>
                                    Fourier Transform Equivalent Complex Exponential Form
                                </div>

                                
                                <span style={{ fontSize: "0.9em" }}>
                                    {fourierTransformPhaseText}
                                </span>
                            </div>
                        </div>
                    </>
                )}

                {pageMode === "transform-pair" && (
                    <>
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                                marginBottom: gapBottom,
                            }}
                        >
                            <div
                                style={{
                                    marginTop: 12,
                                    padding: 12,
                                    borderRadius: 12,
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    background: "rgba(255,255,255,0.03)",

                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 8,          // spacing between buttons
                                }}
                            >
                                {(Object.keys(transformPairs) as PairMode[]).map((mode) => (
                                    <ButtonToggle
                                        key={mode}
                                        label={transformPairs[mode].label}
                                        active={pairMode === mode}
                                        onClick={() => setPairMode(mode)}
                                    />
                                ))}
                            </div>
                            
                        </div>
                        
                        {showParameterSlider[pairMode] ? (
                            <ParameterSlider
                                label={`${pairParameterLabel[pairMode]} = ${pairWidth.toFixed(2)}`}
                                value={pairWidth}
                                setValue={setPairWidth}
                                text={pairWidthText}
                                setText={setPairWidthText}
                                minRange={0.2}
                                maxRange={10}
                                stepRange={0.01}
                            />
                        ) : (
                            <div
                                style={{
                                    fontStyle: "italic",
                                    opacity: 0.75,
                                    marginBottom: gapBottom,
                                    padding: "8px 0",
                                }}
                            >
                                This Fourier transform pair has no adjustable parameter.
                            </div>
                        )}

                        <div
                            style={{
                                marginTop: 12,
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
                                Current Transform Pair
                            </div>
                            

                            <BlockMath math={selectedPair.formula} />

                            {/* <div
                                style={{
                                    marginTop: 12,
                                    padding: "10px 12px",
                                    borderRadius: 10,
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    lineHeight: 1.6,
                                }}
                                >
                                <div
                                    style={{
                                    fontWeight: 700,
                                    textDecoration: "underline",
                                    marginBottom: 8,
                                    }}
                                >
                                    Observation
                                </div>

                                <div style={{ marginBottom: 8 }}>
                                    <InlineMath math="\operatorname{sinc}(t)=\frac{\sin(\pi t)}{\pi t}" />
                                </div>

                                <div style={{ fontSize: 14, opacity: 0.85 }}>
                                    Increasing the width in one domain makes the corresponding Fourier transform
                                    narrower in the other domain.
                                </div>
                            </div> */}
                        </div>
                    </>
                )}
            </div>

            {pageMode === "sine-builder" && (
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
                                title={
                                    <>
                                        Magnitude Spectrum{" "}
                                        <InlineMath math="|X(f)|" />
                                    </>
                                }
                                height={plotHeight}
                                traces={magnitudeTraces}
                                xLabel="Frequency / Hz"
                                yLabel="Magnitude"
                                xRange={freqRange}
                            />
                        </div>

                        <div>
                            <SignalPlot
                                title={
                                    <>
                                        Phase Spectrum{" "}
                                        <InlineMath math="\angle X(f)" />
                                    </>
                                }
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
            )}

            {pageMode === "transform-pair" && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                        gap: gapBottom,
                        alignItems: "start",
                    }}
                >
                    <SignalPlot
                        title={selectedPair.timeTitle}
                        height={isMobile ? 340 : 420}
                        traces={pairTimeTraces}
                        xLabel="t"
                        yLabel="Amplitude"
                        xRange={[-6, 6]}
                        yRange={selectedPair.timeYRange}
                    />

                    <SignalPlot
                        title={selectedPair.freqTitle}
                        height={isMobile ? 340 : 420}
                        traces={pairFreqTraces}
                        xLabel="f"
                        yLabel="Magnitude"
                        xRange={[-10, 10]}
                        yRange={selectedPair.freqYRange}
                    />
                </div>
            )}
        </main>
    );
}