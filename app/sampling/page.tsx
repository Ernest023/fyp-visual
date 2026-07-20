"use client";

import Link from "next/link";
import type { Data } from "plotly.js";
import { useEffect, useMemo, useState } from "react";
import { InlineMath } from "react-katex";

import SignalPlot, { makeStemTraces } from "@/components/SignalPlot";
import { ParameterSlider } from "@/components/ControlPanelSource";
import { theme } from "@/styles/theme";

type Impulse = {
    x: number;
    height: number;
};

function wrapPhase(angle: number): number {
    let wrapped = angle;

    while (wrapped > Math.PI) wrapped -= 2 * Math.PI;
    while (wrapped < -Math.PI) wrapped += 2 * Math.PI;

    return wrapped;
}

function sinc(value: number): number {
    if (Math.abs(value) < 1e-10) return 1;

    return Math.sin(Math.PI * value) / (Math.PI * value);
}

/**
 * Maps a signal frequency into the principal sampled-frequency interval:
 *
 *      -fs/2 <= f_alias < fs/2
 *
 * This signed frequency produces the same sample values as the original
 * sinusoid.
 */
function getSignedAliasFrequency(
    signalFrequency: number,
    samplingFrequency: number
): number {
    if (samplingFrequency <= 0) return 0;

    const shifted =
        ((signalFrequency + samplingFrequency / 2) % samplingFrequency +
            samplingFrequency) %
        samplingFrequency;

    return shifted - samplingFrequency / 2;
}

function makeImpulseTraces(
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
            line: {
                color,
                width: 2.5,
            },
            hoverinfo: "skip",
        },
        {
            x: markerX,
            y: markerY,
            type: "scatter",
            mode: "markers",
            name,
            showlegend: showLegend,
            marker: {
                color,
                size: 12,
                symbol: "triangle-up",
            },
            hovertemplate:
                "Frequency: %{x:.2f} Hz<br>Magnitude: %{y:.2f}<extra></extra>",
        },
    ];
}

function formatPhase(phi: number): string {
    const wrapped = wrapPhase(phi);
    const tolerance = 0.02;

    const knownPhases = [
        { value: -Math.PI, label: "-π" },
        { value: (-3 * Math.PI) / 4, label: "-3π/4" },
        { value: -Math.PI / 2, label: "-π/2" },
        { value: -Math.PI / 4, label: "-π/4" },
        { value: 0, label: "0" },
        { value: Math.PI / 4, label: "π/4" },
        { value: Math.PI / 2, label: "π/2" },
        { value: (3 * Math.PI) / 4, label: "3π/4" },
        { value: Math.PI, label: "π" },
    ];

    const match = knownPhases.find(
        (phase) => Math.abs(wrapped - phase.value) < tolerance
    );

    return match?.label ?? wrapped.toFixed(2);
}

export default function SamplingPage() {
    const [viewportWidth, setViewportWidth] = useState(1280);
    const isMobile = viewportWidth < 600;
    const isTablet = viewportWidth >= 600 && viewportWidth < 1024;
    const useSingleColumnPlots = viewportWidth < 1024;

    const [amplitude, setAmplitude] = useState(1);
    const [signalFrequency, setSignalFrequency] = useState(8);
    const [samplingFrequency, setSamplingFrequency] = useState(20);
    const [phase, setPhase] = useState(0);

    const [amplitudeText, setAmplitudeText] = useState("1.00");
    const [signalFrequencyText, setSignalFrequencyText] = useState("8.00");
    const [samplingFrequencyText, setSamplingFrequencyText] =
        useState("20.00");
    const [phaseText, setPhaseText] = useState("0.00");

    useEffect(() => {
        const updateViewport = () => {
            setViewportWidth(window.innerWidth);
        };

        updateViewport();
        window.addEventListener("resize", updateViewport);

        return () => window.removeEventListener("resize", updateViewport);
    }, []);

    const timeMin = -0.5;
    const timeMax = 0.5;

    const continuousTimeAxis = useMemo(() => {
        const pointCount = 5000;

        return Array.from({ length: pointCount }, (_, index) => {
            return (
                timeMin +
                ((timeMax - timeMin) * index) / (pointCount - 1)
            );
        });
    }, [timeMin, timeMax]);

    const originalSignalSamples = useMemo(() => {
        return continuousTimeAxis.map((time) => {
            return (
                amplitude *
                Math.sin(
                    2 * Math.PI * signalFrequency * time + phase
                )
            );
        });
    }, [
        continuousTimeAxis,
        amplitude,
        signalFrequency,
        phase,
    ]);

    const samplingPeriod = 1 / samplingFrequency;
    const nyquistRate = 2 * signalFrequency;

    const nyquistTolerance = 0.001;

    const nyquistStatus = useMemo(() => {
        const difference = samplingFrequency - nyquistRate;

        if (Math.abs(difference) <= nyquistTolerance) {
            return {
                label: "At Nyquist limit",
                color: "#eab308",
                background: "rgba(234,179,8,0.10)",
                border: "1px solid rgba(234,179,8,0.55)",
            };
        }

        if (difference > 0) {
            return {
                label: "No aliasing",
                color: "#22c55e",
                background: "rgba(34,197,94,0.10)",
                border: "1px solid rgba(34,197,94,0.55)",
            };
        }

        return {
            label: "Aliasing",
            color: "#ef4444",
            background: "rgba(239,68,68,0.10)",
            border: "1px solid rgba(239,68,68,0.55)",
        };
    }, [samplingFrequency, nyquistRate]);

    const isAliasing = samplingFrequency < nyquistRate - nyquistTolerance;
    const isAtNyquist =
        Math.abs(samplingFrequency - nyquistRate) <= nyquistTolerance;

    const signedAliasFrequency = useMemo(() => {
        if (!isAliasing) {
            return signalFrequency;
        }

        return getSignedAliasFrequency(
            signalFrequency,
            samplingFrequency
        );
    }, [
        isAliasing,
        signalFrequency,
        samplingFrequency,
    ]);

    const aliasFrequency = Math.abs(signedAliasFrequency);

    const sampledSignal = useMemo(() => {
        const firstSampleIndex = Math.ceil(timeMin * samplingFrequency);
        const lastSampleIndex = Math.floor(timeMax * samplingFrequency);

        const sampleIndices = Array.from(
            {
                length:
                    lastSampleIndex -
                    firstSampleIndex +
                    1,
            },
            (_, index) => firstSampleIndex + index
        );

        const times = sampleIndices.map(
            (sampleIndex) => sampleIndex / samplingFrequency
        );

        const values = times.map((time) => {
            return (
                amplitude *
                Math.sin(
                    2 * Math.PI * signalFrequency * time + phase
                )
            );
        });

        return {
            times,
            values,
        };
    }, [
        amplitude,
        signalFrequency,
        samplingFrequency,
        phase,
        timeMin,
        timeMax,
    ]);

    const reconstructedSamples = useMemo(() => {
        /*
         * Ideal band-limited reconstruction:
         *
         *   x_hat(t) = sum_n x[n] sinc(f_s t - n)
         *
         * Samples beyond the visible window are included so truncating the
         * infinite sinc sum does not create large edge ripples in the plot.
         * Unlike drawing an analytic sine at the alias frequency, this also
         * handles phase and the Nyquist boundary exactly as the samples do.
         */
        const interpolationPadding = 128;
        const firstIndex =
            Math.floor(timeMin * samplingFrequency) -
            interpolationPadding;
        const lastIndex =
            Math.ceil(timeMax * samplingFrequency) +
            interpolationPadding;

        const interpolationSamples = Array.from(
            { length: lastIndex - firstIndex + 1 },
            (_, offset) => {
                const index = firstIndex + offset;
                const sampleTime = index / samplingFrequency;

                return {
                    index,
                    value:
                        amplitude *
                        Math.sin(
                            2 *
                                Math.PI *
                                signalFrequency *
                                sampleTime +
                                phase
                        ),
                };
            }
        );

        return continuousTimeAxis.map((time) =>
            interpolationSamples.reduce(
                (sum, sample) =>
                    sum +
                    sample.value *
                        sinc(
                            samplingFrequency * time -
                                sample.index
                        ),
                0
            )
        );
    }, [
        continuousTimeAxis,
        amplitude,
        phase,
        signalFrequency,
        samplingFrequency,
        timeMin,
        timeMax,
    ]);

    const originalSignalTraces = useMemo(() => {
        return [
            {
                x: continuousTimeAxis,
                y: originalSignalSamples,
                type: "scatter",
                mode: "lines",
                name: "Original signal",
                line: {
                    color: "rgba(34,197,94,0.95)",
                    width: 3,
                },
            },
        ];
    }, [continuousTimeAxis, originalSignalSamples]);

    const sampledSignalTraces = useMemo(() => {
        const originalReference = {
            x: continuousTimeAxis,
            y: originalSignalSamples,
            type: "scatter",
            mode: "lines",
            name: "Original signal",
            line: {
                color: "rgba(34,197,94,0.42)",
                width: 2,
                dash: "dash",
            },
        };

        const sampleTraces = makeStemTraces(
            sampledSignal.times,
            sampledSignal.values,
            "Samples",
            "rgba(37,99,235,0.95)"
        );

        return [originalReference, ...sampleTraces];
    }, [
        continuousTimeAxis,
        originalSignalSamples,
        sampledSignal,
    ]);

    const reconstructionTraces = useMemo(() => {
        const traces: Data[] = [
            {
                x: continuousTimeAxis,
                y: originalSignalSamples,
                type: "scatter",
                mode: "lines",
                name: "Original signal",
                line: {
                    color: "rgba(37,99,235,0.95)",
                    width: 3,
                    dash: "solid",
                },
            },
        ];

        traces.push({
            x: continuousTimeAxis,
            y: reconstructedSamples,
            type: "scatter",
            mode: "lines",
            name: isAliasing
                ? `Reconstructed alias (${aliasFrequency.toFixed(2)} Hz)`
                : "Sinc reconstruction",
            line: {
                color: isAliasing
                    ? "rgba(239,68,68,0.95)"
                    : "rgba(34,197,94,0.95)",
                width: 2.5,
                dash: "dash",
            },
        });

        traces.push(
            {
                x: sampledSignal.times.flatMap((time) => [time, time, null]),
                y: sampledSignal.values.flatMap((value) => [0, value, null]),
                type: "scatter",
                mode: "lines",
                name: "Sample stems",
                showlegend: false,
                hoverinfo: "skip",
                line: {
                    color: "rgba(239,68,68,0.22)",
                    width: 1.5,
                },
            },
            {
                x: sampledSignal.times,
                y: sampledSignal.values,
                type: "scatter",
                mode: "markers",
                name: "Samples",
                marker: {
                    color: "rgba(220,38,38,1)",
                    size: 8,
                    line: {
                        color: "rgba(255,255,255,0.9)",
                        width: 1,
                    },
                },
            }
        );

        return traces;
    }, [
        continuousTimeAxis,
        originalSignalSamples,
        reconstructedSamples,
        isAliasing,
        aliasFrequency,
        sampledSignal,
    ]);

    const spectrumReplicaTraces = useMemo(() => {
        const replicaCount = 3;
        const traces: Data[] = [];
        const replicaColor = "rgba(37,99,235,0.78)";
        const baseSpectrumColor = "rgba(124,58,237,1)";

        for (
            let replicaIndex = -replicaCount;
            replicaIndex <= replicaCount;
            replicaIndex++
        ) {
            const centreFrequency =
                replicaIndex * samplingFrequency;

            const impulses = [
                {
                    x: centreFrequency - signalFrequency,
                    height: amplitude / 2,
                },
                {
                    x: centreFrequency + signalFrequency,
                    height: amplitude / 2,
                },
            ];

            const replicaName =
                replicaIndex === 0
                    ? "Base spectrum (k = 0)"
                    : "Periodic replicas";

            traces.push(
                ...makeImpulseTraces(
                    impulses,
                    replicaName,
                    replicaIndex === 0
                        ? baseSpectrumColor
                        : replicaColor,
                    replicaIndex === 0 ||
                        replicaIndex === -replicaCount
                )
            );
        }

        const guideHeight = Math.max(amplitude / 2 + 0.3, 1) * 0.11;
        const guideLabelHeight = guideHeight * 1.45;
        const guideX: Array<number | null> = [];
        const guideY: Array<number | null> = [];
        const labelX: number[] = [];
        const labelY: number[] = [];
        const labels: string[] = [];

        for (
            let replicaIndex = -replicaCount;
            replicaIndex <= replicaCount;
            replicaIndex++
        ) {
            const centreFrequency = replicaIndex * samplingFrequency;

            guideX.push(centreFrequency, centreFrequency, null);
            guideY.push(0, guideHeight, null);
            labelX.push(centreFrequency);
            labelY.push(guideLabelHeight);
            labels.push(`k=${replicaIndex}`);
        }

        traces.push(
            {
                x: guideX,
                y: guideY,
                type: "scatter",
                mode: "lines",
                name: "Replica centres",
                showlegend: false,
                hoverinfo: "skip",
                line: {
                    color: "rgba(15,23,42,0.62)",
                    width: 2,
                    dash: "dot",
                },
            },
            {
                x: labelX,
                y: labelY,
                text: labels,
                type: "scatter",
                mode: "text",
                name: "Replica indices",
                showlegend: false,
                hoverinfo: "skip",
                textposition: "top center",
                textfont: {
                    color: "rgba(15,23,42,0.82)",
                    size: 11,
                },
            }
        );

        return traces;
    }, [
        signalFrequency,
        samplingFrequency,
        amplitude,
    ]);

    const frequencyPlotLimit = useMemo(() => {
        return Math.max(
            20,
            3 * samplingFrequency + signalFrequency + 2
        );
    }, [samplingFrequency, signalFrequency]);

    const frequencyShapes = useMemo(() => {
        return [
            {
                type: "line",
                x0: -samplingFrequency / 2,
                x1: -samplingFrequency / 2,
                y0: 0,
                y1: Math.max(amplitude / 2 + 0.2, 1),
                line: {
                    color: "rgba(239,68,68,0.75)",
                    width: 2,
                    dash: "dot",
                },
            },
            {
                type: "line",
                x0: samplingFrequency / 2,
                x1: samplingFrequency / 2,
                y0: 0,
                y1: Math.max(amplitude / 2 + 0.2, 1),
                line: {
                    color: "rgba(239,68,68,0.75)",
                    width: 2,
                    dash: "dot",
                },
            },
        ];
    }, [samplingFrequency, amplitude]);

    const plotHeight = isMobile ? 330 : isTablet ? 355 : 365;

    return (
        <main
            style={{
                minHeight: "100vh",
                padding: isMobile ? "8px 6px 28px" : "10px 12px 40px",
                boxSizing: "border-box",
                overflow: "auto",
                color: theme.colors.text,
                background: theme.colors.background,
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                        ? "auto 1fr"
                        : "1fr auto 1fr",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: theme.spacing.controlGap,
                }}
            >
                <div>
                    <Link
                        href="/"
                        style={{
                            display: "inline-block",
                            border: theme.borders.standard,
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
                        margin: 0,
                        justifySelf: isMobile ? "start" : "center",
                        fontSize: isMobile ? 16 : isTablet ? 20 : 22,
                        fontWeight: 750,
                        lineHeight: 1.2,
                    }}
                >
                    Sampling & Aliasing Laboratory
                </h1>
            </div>

            {/* Controls */}
            <section
                style={{
                    border: theme.borders.standard,
                    borderRadius: 12,
                    padding: isMobile ? 8 : 12,
                    marginBottom: theme.spacing.controlGap,
                    background: theme.colors.panelBackground,
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                            ? "1fr"
                            : isTablet
                              ? "repeat(2, minmax(0, 1fr))"
                              : "repeat(4, minmax(0, 1fr))",
                        gap: isMobile ? 10 : 12,
                    }}
                >
                    <ParameterSlider
                        label="Amplitude A"
                        value={amplitude}
                        setValue={setAmplitude}
                        text={amplitudeText}
                        setText={setAmplitudeText}
                        minRange={0.1}
                        maxRange={5}
                        stepRange={0.01}
                    />

                    <ParameterSlider
                        label="Signal frequency f₀ (Hz)"
                        value={signalFrequency}
                        setValue={setSignalFrequency}
                        text={signalFrequencyText}
                        setText={setSignalFrequencyText}
                        minRange={0.5}
                        maxRange={20}
                        stepRange={0.1}
                    />

                    <ParameterSlider
                        label="Sampling frequency fₛ (Hz)"
                        value={samplingFrequency}
                        setValue={setSamplingFrequency}
                        text={samplingFrequencyText}
                        setText={setSamplingFrequencyText}
                        minRange={1}
                        maxRange={50}
                        stepRange={0.1}
                    />

                    <ParameterSlider
                        label={`Phase φ = ${formatPhase(phase)} rad`}
                        value={phase}
                        setValue={setPhase}
                        text={phaseText}
                        setText={setPhaseText}
                        minRange={-Math.PI}
                        maxRange={Math.PI}
                        stepRange={0.01}
                    />
                </div>

                {/* Live Nyquist status */}
                <div
                    style={{
                        marginTop: isMobile ? 10 : 12,
                        padding: isMobile ? 9 : 12,
                        borderRadius: 10,
                        border: nyquistStatus.border,
                        background: nyquistStatus.background,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: isMobile ? 8 : 14,
                            fontSize: isMobile ? 13 : 16,
                        }}
                    >
                        <strong
                            style={{
                                color: nyquistStatus.color,
                                fontSize: isMobile ? 14 : 16,
                            }}
                        >
                            {nyquistStatus.label}
                        </strong>

                        <span>
                            Signal frequency:{" "}
                            <InlineMath
                                math={`f_0=${signalFrequency.toFixed(
                                    2
                                )}\\,\\mathrm{Hz}`}
                            />
                        </span>

                        <span>
                            Nyquist rate:{" "}
                            <InlineMath
                                math={`2f_0=${nyquistRate.toFixed(
                                    2
                                )}\\,\\mathrm{Hz}`}
                            />
                        </span>

                        <span>
                            Sampling rate:{" "}
                            <InlineMath
                                math={`f_s=${samplingFrequency.toFixed(
                                    2
                                )}\\,\\mathrm{Hz}`}
                            />
                        </span>

                        <span>
                            Sampling period:{" "}
                            <InlineMath
                                math={`T_s=${samplingPeriod.toFixed(
                                    4
                                )}\\,\\mathrm{s}`}
                            />
                        </span>

                        {isAliasing && (
                            <span>
                                Observed alias:{" "}
                                <InlineMath
                                    math={`f_{\\mathrm{alias}}=${aliasFrequency.toFixed(
                                        2
                                    )}\\,\\mathrm{Hz}`}
                                />
                            </span>
                        )}
                    </div>
                </div>

                {/* Formula explanation */}
                <div
                    style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 10,
                        border:
                            "1px solid rgba(255,255,255,0.15)",
                        background:
                            "rgba(255,255,255,0.035)",
                        overflowX: "auto",
                    }}
                >
                    <div
                        style={{
                            fontWeight: 800,
                            marginBottom: 6,
                        }}
                    >
                        Sampling relationships
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 18,
                            alignItems: "center",
                        }}
                    >
                        <InlineMath
                            math={String.raw`x(t)=A\sin(2\pi f_0t+\phi)`}
                        />

                        <InlineMath
                            math={String.raw`T_s=\frac{1}{f_s}`}
                        />

                        <InlineMath
                            math={String.raw`f_s\geq 2f_{\max}`}
                        />

                        <InlineMath
                            math={String.raw`f_{\mathrm{alias}}=\left|f_0-kf_s\right|`}
                        />
                    </div>
                </div>
            </section>

            {/* Time-domain row */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: useSingleColumnPlots
                        ? "1fr"
                        : "1fr 1fr",
                    gap: theme.spacing.controlGap,
                    marginBottom: theme.spacing.controlGap,
                }}
            >
                <SignalPlot
                    title={
                        <>
                            Original Continuous-Time Signal{" "}
                            <InlineMath math="x(t)" />
                        </>
                    }
                    subtitle={
                        <InlineMath
                            math={`x(t)=${amplitude.toFixed(
                                2
                            )}\\sin\\left(2\\pi(${signalFrequency.toFixed(
                                2
                            )})t+${formatPhase(phase)}\\right)`}
                        />
                    }
                    height={plotHeight}
                    traces={originalSignalTraces}
                    xLabel="Time / s"
                    yLabel="Amplitude"
                    xRange={[timeMin, timeMax]}
                    yRange={[
                        -Math.max(amplitude * 1.2, 1),
                        Math.max(amplitude * 1.2, 1),
                    ]}
                    compact={isMobile}
                />

                <SignalPlot
                    title={
                        <>
                            Sampled Signal{" "}
                            <InlineMath math="x[n]=x(nT_s)" />
                        </>
                    }
                    subtitle={
                        <InlineMath
                            math={`T_s=${samplingPeriod.toFixed(
                                4
                            )}\\,\\mathrm{s}`}
                        />
                    }
                    height={plotHeight}
                    traces={sampledSignalTraces}
                    xLabel="Time / s"
                    yLabel="Amplitude"
                    xRange={[timeMin, timeMax]}
                    yRange={[
                        -Math.max(amplitude * 1.2, 1),
                        Math.max(amplitude * 1.2, 1),
                    ]}
                    compact={isMobile}
                />
            </div>

            {/* Reconstruction and frequency-domain row */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: useSingleColumnPlots
                        ? "1fr"
                        : "1fr 1fr",
                    gap: theme.spacing.controlGap,
                }}
            >
                <SignalPlot
                    title={
                        <>
                            Reconstructed Signal{" "}
                            <InlineMath
                                math={String.raw`\hat{x}(t)`}
                            />
                        </>
                    }
                    subtitle={
                        isAliasing ? (
                            <>
                                <InlineMath
                                    math={String.raw`f_{\mathrm{alias}}=${aliasFrequency.toFixed(
                                        2
                                    )}\,\mathrm{Hz}`}
                                />
                                {" · "}
                                <InlineMath
                                    math={String.raw`\hat{x}(t)=\sum_n x[n]\operatorname{sinc}(f_st-n)`}
                                />
                            </>
                        ) : (
                            <InlineMath
                                math={String.raw`\hat{x}(t)=\sum_n x[n]\operatorname{sinc}(f_st-n)`}
                            />
                        )
                    }
                    height={plotHeight}
                    traces={reconstructionTraces}
                    xLabel="Time / s"
                    yLabel="Amplitude"
                    xRange={[timeMin, timeMax]}
                    yRange={[
                        -Math.max(amplitude * 1.2, 1),
                        Math.max(amplitude * 1.2, 1),
                    ]}
                    compact={isMobile}
                />

                <SignalPlot
                    title={
                        <>
                            Periodic Spectral Replicas{" "}
                            <InlineMath math="X_s(f)" />
                        </>
                    }
                    subtitle={
                        <>
                            <InlineMath
                                math={String.raw`X_s(f)=\frac{1}{T_s}\sum_{k=-\infty}^{\infty}X(f-kf_s)`}
                            />
                            {" · short ticks mark "}
                            <InlineMath math="kf_s" />
                            {" · red boundaries mark "}
                            <InlineMath math="\pm f_s/2" />
                        </>
                    }
                    height={plotHeight}
                    traces={spectrumReplicaTraces}
                    shapes={frequencyShapes}
                    xLabel="Frequency / Hz"
                    yLabel="Normalised magnitude"
                    xRange={[
                        -frequencyPlotLimit,
                        frequencyPlotLimit,
                    ]}
                    yRange={[
                        0,
                        Math.max(amplitude / 2 + 0.3, 1),
                    ]}
                    compact={isMobile}
                />
            </div>

            <section
                style={{
                    marginTop: theme.spacing.controlGap,
                    padding: 12,
                    borderRadius: 12,
                    border: theme.borders.standard,
                    background: theme.colors.panelBackground,
                }}
            >
                <div
                    style={{
                        fontWeight: 800,
                        marginBottom: 6,
                    }}
                >
                    Observation
                </div>

                {isAliasing ? (
                    <div>
                        Since{" "}
                        <InlineMath math="f_s<2f_0" />, the
                        shifted spectral replicas overlap. The
                        samples can therefore also represent a
                        lower-frequency sinusoid at{" "}
                        <InlineMath
                            math={`${aliasFrequency.toFixed(
                                2
                            )}\\,\\mathrm{Hz}`}
                        />
                        , causing the reconstructed waveform to
                        differ from the original.
                    </div>
                ) : isAtNyquist ? (
                    <div>
                        The system is operating exactly at the
                        Nyquist limit,{" "}
                        <InlineMath math="f_s=2f_0" />. This is a
                        critical boundary: sampling phase and
                        timing become especially important, so
                        practical systems normally sample above
                        this rate.
                    </div>
                ) : (
                    <div>
                        Since{" "}
                        <InlineMath math="f_s>2f_0" />, the
                        spectral replicas remain separated. The
                        original sinusoid can be reconstructed
                        without aliasing.
                    </div>
                )}
            </section>
        </main>
    );
}
