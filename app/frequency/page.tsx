"use client";

import React, { useEffect, useMemo, useState } from "react";
import SignalPlot from "@/components/visualization/SignalPlot";
import { ButtonToggle, ParameterSlider } from "@/components/controls/ControlPanelSource";
import { theme } from "@/styles/theme";
import { InlineMath, BlockMath } from "react-katex";
import type { PageMode, PairMode, TransformPairConfig, SineComponent } from "@/features/frequency/types";
import { formatPhase, getPhaseSymbol, rect, sinc } from "@/features/frequency/frequencyMath";
import { makeImpulseTraces } from "@/features/frequency/frequencyPlot";
import FourierPairLabel from "@/features/frequency/FourierPairLabel";
import { buildSineSpectrum, buildSpectrumPlotTraces } from "@/features/frequency/spectrumPlotBuilder";
import TransformPairCatalogue from "@/features/frequency/components/TransformPairCatalogue";
import { pairParameterLabel, showParameterSlider } from "@/features/frequency/transformPairCatalogue";
import ResponsiveLabPageShell from "@/components/layout/ResponsiveLabPageShell";
import EducationalExplanationCard from "@/components/education/EducationalExplanationCard";
import { createInitialComponentTexts, frequencyConfig } from "@/features/frequency/config";

const { maximumSines: MAX_SINES } = frequencyConfig.limits;
const componentColors = frequencyConfig.componentColors;

export default function FourierPage() {
    // Responsive layout state controls how the editors and plots are arranged.
    const [viewportWidth, setViewportWidth] = useState<number>(frequencyConfig.defaults.viewportWidth);
    const isMobile = viewportWidth < frequencyConfig.breakpoints.mobile;
    const isTablet = viewportWidth >= frequencyConfig.breakpoints.mobile && viewportWidth < frequencyConfig.breakpoints.tablet;
    const useSingleColumnPlots = viewportWidth < frequencyConfig.breakpoints.tablet;

    // The page has two learning activities: building a signal from sine waves
    // and browsing common Fourier transform pairs.
    const [pageMode, setPageMode] = useState<PageMode>(frequencyConfig.defaults.pageMode);
    const [pairMode, setPairMode] = useState<PairMode>(frequencyConfig.defaults.pairMode);

    // pairWidth is the mathematical parameter used by the selected transform
    // pair. pairWidthText preserves what the user is currently typing.
    const [pairWidth, setPairWidth] = useState<number>(frequencyConfig.defaults.pairWidth);
    const [pairWidthText, setPairWidthText] = useState(frequencyConfig.defaults.pairWidth.toFixed(2));

    // Each component represents A sin(2 pi f t + phase) in the signal builder.
    const [components, setComponents] = useState<SineComponent[]>(() =>
        frequencyConfig.defaults.components.map((component) => ({ ...component }))
    );

    // Text values are stored separately from numeric values so an input can
    // temporarily contain an incomplete number such as "-" or "1.".
    const [componentTexts, setComponentTexts] = useState<
        Record<number, { frequency: string; amplitude: string; phase: string }>
    >(() => createInitialComponentTexts());

    // Keep the responsive layout in sync with the browser width.
    useEffect(() => {
        const update = () => setViewportWidth(window.innerWidth);

        update();
        window.addEventListener("resize", update);

        return () => window.removeEventListener("resize", update);
    }, []);

    // Shared time axis used by every sine component and their combined signal.
    const tAxis = useMemo(() => {
        const { min, max, points } = frequencyConfig.axes.signalTime;
        return Array.from({ length: points }, (_, i) => min + ((max - min) * i) / (points - 1));
    }, []);

    // Generate one time-domain Plotly trace for each editable sine component.
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

    // Add the component values point-by-point to form the composite signal.
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

    // Convert the sines into their positive- and negative-frequency impulses.
    const sineSpectrum = useMemo(() => buildSineSpectrum(components), [components]);

    // Update the numeric model after an editor value has been validated.
    function updateComponent(
        id: number,
        key: keyof Omit<SineComponent, "id">,
        value: number
    ) {
        setComponents((prev) =>
            prev.map((c) => (c.id === id ? { ...c, [key]: value } : c))
        );
    }

    // Update only the text displayed inside a component's numeric input.
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

    // Add a new sine with a unique ID and sensible initial values.
    function addComponent() {
        if (components.length >= MAX_SINES) return;

        const nextId =
            components.length === 0
                ? 1
                : Math.max(...components.map((c) => c.id)) + 1;

        const defaultFrequency = Math.min(
            components.length + 1,
            frequencyConfig.limits.frequency.max
        );

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

    // Remove both the mathematical component and its matching input text.
    function removeComponent(id: number) {
        setComponents((prev) => prev.filter((c) => c.id !== id));

        setComponentTexts((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }

    // Trace for the sum of all component signals.
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

    // Build separate Plotly traces for magnitude and phase spectra.
    const { magnitudeTraces, phaseTraces } = buildSpectrumPlotTraces(sineSpectrum);

    // The following JSX equations are regenerated from the current component
    // values so the mathematics always agrees with the plots.
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

    // Plot dimensions and frequency range adapt to the viewport and signal.
    const plotHeight = isMobile
        ? frequencyConfig.plotHeights.mobile
        : isTablet
          ? frequencyConfig.plotHeights.tablet
          : frequencyConfig.plotHeights.desktop;

    const maxFreq = Math.max(...components.map((c) => c.frequency), 1);
    const freqRange: [number, number] = [
        -maxFreq - frequencyConfig.axes.spectrumPadding,
        maxFreq + frequencyConfig.axes.spectrumPadding,
    ];

    // Dense, shared axes for plotting the transform-pair catalogue examples.
    const pairTimeAxis = useMemo(() => {
        const { min, max, points } = frequencyConfig.axes.pairTime;
        return Array.from({ length: points }, (_, i) => min + ((max - min) * i) / (points - 1));
    }, []);

    const pairFreqAxis = useMemo(() => {
        const { min, max, points } = frequencyConfig.axes.pairFrequency;
        return Array.from({ length: points }, (_, i) => min + ((max - min) * i) / (points - 1));
    }, []);

    // Catalogue data for each transform pair. Every entry defines its displayed
    // equation, labels, and sampled time- and frequency-domain functions.
    const transformPairs: Record<PairMode, TransformPairConfig> = {
        // e^(-at) u(t)
        "exp-right": {
            label: <FourierPairLabel isMobile={isMobile} math="\mathrm{e}^{-at}u(t)\overset{\mathcal F}{\longleftrightarrow}\frac{1}{a+j2\pi f}" />,
            formula: `\\mathrm{e}^{-${pairWidth.toFixed(2)}t}u(t)\\overset{\\mathcal F}{\\longleftrightarrow}\\frac{1}{${pairWidth.toFixed(2)}+j2\\pi f},\\quad a>0`,
            timeTitle: <>Time Domain: <InlineMath math="\mathrm{e}^{-at}u(t)" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="\frac{1}{a+j2\pi f}" /></>,
            timeName: "e^(-at)u(t)",
            freqName: "1/(a+j2πf)",
            timeSamples: pairTimeAxis.map((t) => (t >= 0 ? Math.exp(-pairWidth * t) : 0)),
            freqSamples: pairFreqAxis.map((f) => 1 / Math.sqrt(pairWidth ** 2 + (2 * Math.PI * f) ** 2)),
        },

        "exp-left": {
            label: <FourierPairLabel isMobile={isMobile} math="\mathrm{e}^{at}u(-t)\overset{\mathcal F}{\longleftrightarrow}\frac{1}{a-j2\pi f}" />,
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
            label: <FourierPairLabel isMobile={isMobile} math="\mathrm{e}^{-a|t|}\overset{\mathcal F}{\longleftrightarrow}\frac{2a}{a^2+(2\pi f)^2}" />,
            formula: `\\mathrm{e}^{-${pairWidth.toFixed(2)}|t|}\\overset{\\mathcal F}{\\longleftrightarrow}\\frac{2(${pairWidth.toFixed(2)})}{(${pairWidth.toFixed(2)})^2+(2\\pi f)^2}`,
            timeTitle: <>Time Domain: <InlineMath math="\mathrm{e}^{-a|t|}" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="\frac{2a}{a^2+(2\pi f)^2}" /></>,
            timeName: "e^(-a|t|)",
            freqName: "2a/(a²+(2πf)²)",
            timeSamples: pairTimeAxis.map((t) => Math.exp(-pairWidth * Math.abs(t))),
            freqSamples: pairFreqAxis.map((f) => (2 * pairWidth) / (pairWidth ** 2 + (2 * Math.PI * f) ** 2)),
        },

        delta: {
        label: <FourierPairLabel isMobile={isMobile} math="\delta(t)\overset{\mathcal F}{\longleftrightarrow}1" />,
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
            label: <FourierPairLabel isMobile={isMobile} math="1\overset{\mathcal F}{\longleftrightarrow}\delta(f)" />,
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
            label: <FourierPairLabel isMobile={isMobile} math="\mathrm{e}^{j2\pi f_0t}\overset{\mathcal F}{\longleftrightarrow}\delta(f-f_0)" />,
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
            label: <FourierPairLabel isMobile={isMobile} math="\cos(2\pi f_0t)\overset{\mathcal F}{\longleftrightarrow}\frac{1}{2}\left[\delta(f-f_0)+\delta(f+f_0)\right]" />,
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
            label: <FourierPairLabel isMobile={isMobile} math="\sin(2\pi f_0t)\overset{\mathcal F}{\longleftrightarrow}\frac{1}{2j}\left[\delta(f-f_0)-\delta(f+f_0)\right]" />,
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
            label: <FourierPairLabel isMobile={isMobile} math="u(t)\overset{\mathcal F}{\longleftrightarrow}\frac{1}{2}\delta(f)+\frac{1}{j2\pi f}" />,
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
            label: <FourierPairLabel isMobile={isMobile} math="\operatorname{rect}\left(\frac{t}{T}\right)\overset{\mathcal F}{\longleftrightarrow}T\operatorname{sinc}(Tf)" />,
            formula: `\\operatorname{rect}\\!\\left(\\frac{t}{${pairWidth.toFixed(2)}}\\right)\\overset{\\mathcal F}{\\longleftrightarrow}${pairWidth.toFixed(2)}\\operatorname{sinc}\\!\\left(${pairWidth.toFixed(2)}f\\right)`,
            timeTitle: <>Time Domain: <InlineMath math="\operatorname{rect}\left(\frac{t}{T}\right)" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="T\operatorname{sinc}(Tf)" /></>,
            timeName: "rect(t/T)",
            freqName: "T sinc(Tf)",
            timeSamples: pairTimeAxis.map((t) => rect(t / pairWidth)),
            freqSamples: pairFreqAxis.map((f) => pairWidth * sinc(pairWidth * f)),
        },

        triangle: {
            label: <FourierPairLabel isMobile={isMobile} math="\Delta\left(\frac{t}{T}\right)\overset{\mathcal F}{\longleftrightarrow}T\operatorname{sinc}^2(Tf)" />,
            formula: `\\Delta\\!\\left(\\frac{t}{${pairWidth.toFixed(2)}}\\right)\\overset{\\mathcal F}{\\longleftrightarrow}${pairWidth.toFixed(2)}\\operatorname{sinc}^{2}\\!\\left(${pairWidth.toFixed(2)}f\\right)`,
            timeTitle: <>Time Domain: <InlineMath math="\Delta(t/T)" /></>,
            freqTitle: <>Frequency Domain: <InlineMath math="T\operatorname{sinc}^2(Tf)" /></>,
            timeName: "tri(t/T)",
            freqName: "T sinc²(Tf)",
            timeSamples: pairTimeAxis.map((t) => Math.max(1 - Math.abs(t / pairWidth), 0)),
            freqSamples: pairFreqAxis.map((f) => pairWidth * sinc(pairWidth * f) ** 2),
        },

        "sinc-to-rect": {
            label: <FourierPairLabel isMobile={isMobile} math="\operatorname{sinc}\left(\frac{t}{T}\right)\overset{\mathcal F}{\longleftrightarrow}T\operatorname{rect}(Tf)" />,
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
                <FourierPairLabel isMobile={isMobile} math="\sum_{n=-\infty}^{\infty}\delta(t-nT_0)\overset{\mathcal F}{\longleftrightarrow}\frac{1}{T_0}\sum_{n=-\infty}^{\infty}\delta(f-nf_0)" />
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

    // Look up the catalogue entry chosen by the user.
    const selectedPair = transformPairs[pairMode];

    // Some pairs are ordinary curves, while delta functions and impulse trains
    // provide specialised stem traces that take priority when available.
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

    // Render the mode controls followed by the editors, equations, and plots
    // that belong to the currently selected learning activity.
    return (
        <ResponsiveLabPageShell title="Frequency Domain" isMobile={isMobile} mobileTitleSize={17}>

            <div
                style={{
                    border: theme.borders.standard,
                    borderRadius: 12,
                    padding: isMobile ? 8 : 10,
                    boxSizing: "border-box",
                    marginBottom: theme.spacing.controlGap,
                    background: "rgba(0,0,0,0.12)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "center",
                        marginBottom: theme.spacing.controlGap,
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
                                gridTemplateColumns: isMobile
                                    ? "1fr"
                                    : isTablet
                                      ? "repeat(2, minmax(0, 1fr))"
                                      : "repeat(4, minmax(0, 1fr))",
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
                                                    border: theme.borders.standard,
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
                                        minRange={frequencyConfig.limits.frequency.min}
                                        maxRange={frequencyConfig.limits.frequency.max}
                                        stepRange={frequencyConfig.limits.frequency.step}
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
                                        minRange={frequencyConfig.limits.amplitude.min}
                                        maxRange={frequencyConfig.limits.amplitude.max}
                                        stepRange={frequencyConfig.limits.amplitude.step}
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
                                        minRange={frequencyConfig.limits.phase.min}
                                        maxRange={frequencyConfig.limits.phase.max}
                                        stepRange={frequencyConfig.limits.phase.step}
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
                                border: theme.borders.standard,
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
                                Maximum {MAX_SINES} sine components reached.
                            </span>
                        )}

                        <EducationalExplanationCard title="Composite Signal" marginTop={16}>
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
                        </EducationalExplanationCard>
                    </>
                )}

                {pageMode === "transform-pair" && (
                    <>
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                                marginBottom: theme.spacing.controlGap,
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
                                <TransformPairCatalogue
                                    transformPairs={transformPairs}
                                    pairMode={pairMode}
                                    setPairMode={setPairMode}
                                />
                            </div>
                            
                        </div>
                        
                        {showParameterSlider[pairMode] ? (
                            <ParameterSlider
                                label={`${pairParameterLabel[pairMode]} = ${pairWidth.toFixed(2)}`}
                                value={pairWidth}
                                setValue={setPairWidth}
                                text={pairWidthText}
                                setText={setPairWidthText}
                                minRange={frequencyConfig.limits.pairParameter.min}
                                maxRange={frequencyConfig.limits.pairParameter.max}
                                stepRange={frequencyConfig.limits.pairParameter.step}
                            />
                        ) : (
                            <div
                                style={{
                                    fontStyle: "italic",
                                    opacity: 0.75,
                                    marginBottom: theme.spacing.controlGap,
                                    padding: "8px 0",
                                }}
                            >
                                This Fourier transform pair has no adjustable parameter.
                            </div>
                        )}

                        <EducationalExplanationCard title="Current Transform Pair">
                            <BlockMath math={selectedPair.formula} />
                        </EducationalExplanationCard>
                    </>
                )}
            </div>

            {pageMode === "sine-builder" && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: useSingleColumnPlots ? "1fr" : "1fr 1fr",
                        gap: theme.spacing.controlGap,
                        alignItems: "start",
                    }}
                >
                    <div>
                        <div style={{ marginBottom: theme.spacing.controlGap }}>
                            <SignalPlot
                                title="Individual Sine Components"
                                height={plotHeight}
                                traces={componentTraces}
                                xLabel="t"
                                yLabel="Amplitude"
                                xRange={[tAxis[0], tAxis[tAxis.length - 1]]}
                                compact={isMobile}
                                compactM={isTablet}
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
                                compact={isMobile}
                                compactM={isTablet}
                            />
                        </div>
                    </div>

                    <div>
                        <div style={{ marginBottom: theme.spacing.controlGap }}>
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
                                compact={isMobile}
                                compactM={isTablet}
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
                                compact={isMobile}
                                compactM={isTablet}
                            />
                        </div>
                    </div>
                </div>
            )}

            {pageMode === "transform-pair" && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: useSingleColumnPlots ? "1fr" : "1fr 1fr",
                        gap: theme.spacing.controlGap,
                        alignItems: "start",
                    }}
                >
                    <SignalPlot
                        title={selectedPair.timeTitle}
                        height={isMobile ? 330 : isTablet ? 370 : 420}
                        traces={pairTimeTraces}
                        xLabel="t"
                        yLabel="Amplitude"
                        xRange={[frequencyConfig.axes.pairTime.min, frequencyConfig.axes.pairTime.max]}
                        yRange={selectedPair.timeYRange}
                        compact={isMobile}
                        compactM={isTablet}
                    />

                    <SignalPlot
                        title={selectedPair.freqTitle}
                        height={isMobile ? 330 : isTablet ? 370 : 420}
                        traces={pairFreqTraces}
                        xLabel="f"
                        yLabel="Magnitude"
                        xRange={[frequencyConfig.axes.pairFrequency.min, frequencyConfig.axes.pairFrequency.max]}
                        yRange={selectedPair.freqYRange}
                        compact={isMobile}
                        compactM={isTablet}
                    />
                </div>
            )}
        </ResponsiveLabPageShell>
    );
}
