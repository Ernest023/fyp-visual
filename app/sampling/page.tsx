"use client";

import type { Data } from "plotly.js";
import { useEffect, useMemo, useState } from "react";
import { InlineMath } from "react-katex";

import SignalPlot, { makeStemTraces } from "@/components/visualization/SignalPlot";
import { ParameterSlider } from "@/components/controls/ControlPanelSource";
import { theme } from "@/styles/theme";
import { formatPhase, getSignedAliasFrequency } from "@/features/sampling/samplingMath";
import { makeImpulseTraces } from "@/features/sampling/samplingPlot";
import { reconstructSignal } from "@/features/sampling/samplingEngine";
import ResponsiveLabPageShell from "@/components/layout/ResponsiveLabPageShell";
import EducationalExplanationCard from "@/components/education/EducationalExplanationCard";
import { samplingConfig } from "@/features/sampling/config";

export default function SamplingPage() {
    // Responsive layout state determines the number of control and plot columns.
    const [viewportWidth, setViewportWidth] = useState<number>(samplingConfig.defaults.viewportWidth);
    const isMobile = viewportWidth < theme.breakpoints.mobile;
    const isTablet = viewportWidth >= theme.breakpoints.mobile && viewportWidth < theme.breakpoints.tablet;
    const useSingleColumnPlots = viewportWidth < theme.breakpoints.tablet;

    // Mathematical parameters of x(t) and the sampler.
    const [amplitude, setAmplitude] = useState<number>(samplingConfig.defaults.amplitude);
    const [signalFrequency, setSignalFrequency] = useState<number>(samplingConfig.defaults.signalFrequency);
    const [samplingFrequency, setSamplingFrequency] = useState<number>(samplingConfig.defaults.samplingFrequency);
    const [phase, setPhase] = useState<number>(samplingConfig.defaults.phase);

    // Text state is separate from numeric state so users can type partial values
    // without immediately producing an invalid signal calculation.
    const [amplitudeText, setAmplitudeText] = useState(samplingConfig.defaults.amplitude.toFixed(2));
    const [signalFrequencyText, setSignalFrequencyText] = useState(samplingConfig.defaults.signalFrequency.toFixed(2));
    const [samplingFrequencyText, setSamplingFrequencyText] =
        useState(samplingConfig.defaults.samplingFrequency.toFixed(2));
    const [phaseText, setPhaseText] = useState(samplingConfig.defaults.phase.toFixed(2));

    // Keep the responsive layout in sync with the current browser width.
    useEffect(() => {
        const updateViewport = () => {
            setViewportWidth(window.innerWidth);
        };

        updateViewport();
        window.addEventListener("resize", updateViewport);

        return () => window.removeEventListener("resize", updateViewport);
    }, []);

    // Show a useful number of cycles at every selected signal frequency. All
    // related time-domain plots share this range so visual comparisons remain valid.
    const adaptiveHalfWindow = Math.min(
        samplingConfig.timeDomain.maximumHalfWindow,
        Math.max(
            samplingConfig.timeDomain.minimumHalfWindow,
            samplingConfig.timeDomain.visibleCycles / (2 * signalFrequency)
        )
    );
    const timeMin = -adaptiveHalfWindow;
    const timeMax = adaptiveHalfWindow;

    // Create a dense axis so the original and reconstructed curves look smooth.
    const continuousTimeAxis = useMemo(() => {
        const pointCount = samplingConfig.timeDomain.pointCount;

        return Array.from({ length: pointCount }, (_, index) => {
            return (
                timeMin +
                ((timeMax - timeMin) * index) / (pointCount - 1)
            );
        });
    }, [timeMin, timeMax]);

    // Evaluate the original continuous sinusoid at every point on the dense axis.
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

    // Derived sampling quantities used by the status panel and equations.
    const samplingPeriod = 1 / samplingFrequency;
    const nyquistRate = 2 * signalFrequency;

    const nyquistTolerance = samplingConfig.nyquist.tolerance;

    // Classify the current sampling rate as safe, critical, or aliasing.
    const nyquistStatus = useMemo(() => {
        const difference = samplingFrequency - nyquistRate;

        if (Math.abs(difference) <= nyquistTolerance) {
            return {
                label: "At Nyquist limit",
                ...samplingConfig.statusStyles.nyquist,
            };
        }

        if (difference > 0) {
            return {
                label: "No aliasing",
                ...samplingConfig.statusStyles.safe,
            };
        }

        return {
            label: "Aliasing",
            ...samplingConfig.statusStyles.aliasing,
        };
    }, [samplingFrequency, nyquistRate, nyquistTolerance]);

    const isAliasing = samplingFrequency < nyquistRate - nyquistTolerance;
    const isAtNyquist =
        Math.abs(samplingFrequency - nyquistRate) <= nyquistTolerance;

    // When undersampling occurs, fold the source frequency into the principal
    // Nyquist interval to find the frequency seen after reconstruction.
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

    // Generate the actual discrete sample times n/fs and their signal values.
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

    // Reconstruct the sampled signal over the dense axis using sinc interpolation.
    const reconstructedSamples = useMemo(() => {
        return reconstructSignal({
            continuousTimeAxis,
            amplitude,
            phase,
            signalFrequency,
            samplingFrequency,
            timeMin,
            timeMax,
        });
    }, [
        continuousTimeAxis,
        amplitude,
        phase,
        signalFrequency,
        samplingFrequency,
        timeMin,
        timeMax,
    ]);

    // Plotly trace for the original continuous-time signal.
    const originalSignalTraces = useMemo(() => {
        return [
            {
                x: continuousTimeAxis,
                y: originalSignalSamples,
                type: "scatter",
                mode: "lines",
                name: "Original signal",
                line: {
                    color: theme.colors.inputSignal,
                    width: 3,
                },
            },
        ];
    }, [continuousTimeAxis, originalSignalSamples]);

    // Overlay discrete sample stems on a faint copy of the original signal.
    const sampledSignalTraces = useMemo(() => {
        const originalReference = {
            x: continuousTimeAxis,
            y: originalSignalSamples,
            type: "scatter",
            mode: "lines",
            name: "Original signal",
            line: {
                color: theme.colors.inputSignalMuted,
                width: 2,
                dash: "dash",
            },
        };

        const sampleTraces = makeStemTraces(
            sampledSignal.times,
            sampledSignal.values,
            "Samples",
            theme.colors.outputSignal
        );

        return [originalReference, ...sampleTraces];
    }, [
        continuousTimeAxis,
        originalSignalSamples,
        sampledSignal,
    ]);

    // Compare the sinc reconstruction with the original curve and sample points.
    const reconstructionTraces = useMemo(() => {
        const traces: Data[] = [
            {
                x: continuousTimeAxis,
                y: originalSignalSamples,
                type: "scatter",
                mode: "lines",
                name: "Original signal",
                line: {
                    color: theme.colors.inputSignal,
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
                    ? theme.colors.danger
                    : theme.colors.outputSignal,
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
                    color: theme.colors.sampleStem,
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
                    color: theme.colors.outputSignal,
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

    // Sampling repeats the original spectrum around every integer multiple n*fs.
    // This block builds those impulses plus short centre markers labelled by n.
    const spectrumReplicaTraces = useMemo(() => {
        const replicaCount = samplingConfig.spectrum.replicaCount;
        const traces: Data[] = [];
        const replicaColor = theme.colors.spectrumReplicaMuted;
        const baseSpectrumColor = theme.colors.spectrumBase;

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
                    ? "Base spectrum (n = 0)"
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
            labels.push(`n=${replicaIndex}`);
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
                    color: theme.colors.plotAnnotationMuted,
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
                    color: theme.colors.plotAnnotation,
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

    // Expand the frequency axis far enough to show three replicas on each side.
    const frequencyPlotLimit = useMemo(() => {
        return Math.max(
            samplingConfig.spectrum.minimumFrequencyLimit,
            samplingConfig.spectrum.replicaCount * samplingFrequency +
                signalFrequency +
                samplingConfig.spectrum.frequencyPadding
        );
    }, [samplingFrequency, signalFrequency]);

    // Red dotted guides mark the two Nyquist boundaries at +/- fs/2.
    const frequencyShapes = useMemo(() => {
        return [
            {
                type: "line",
                x0: -samplingFrequency / 2,
                x1: -samplingFrequency / 2,
                y0: 0,
                y1: Math.max(amplitude / 2 + 0.2, 1),
                line: {
                    color: theme.colors.danger,
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
                    color: theme.colors.danger,
                    width: 2,
                    dash: "dot",
                },
            },
        ];
    }, [samplingFrequency, amplitude]);

    // Taller plots improve readability on narrow touch screens.
    const plotHeight = isMobile
        ? samplingConfig.plotHeights.mobile
        : isTablet
          ? samplingConfig.plotHeights.tablet
          : samplingConfig.plotHeights.desktop;

    // Render the controls, learning feedback, and four linked visualisations.
    return (
        <ResponsiveLabPageShell title="Sampling & Aliasing Laboratory" isMobile={isMobile} mobileTitleSize={16}>

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
                        minRange={samplingConfig.controls.amplitude.min}
                        maxRange={samplingConfig.controls.amplitude.max}
                        stepRange={samplingConfig.controls.amplitude.step}
                    />

                    <ParameterSlider
                        label="Signal frequency f₀ (Hz)"
                        value={signalFrequency}
                        setValue={setSignalFrequency}
                        text={signalFrequencyText}
                        setText={setSignalFrequencyText}
                        minRange={samplingConfig.controls.signalFrequency.min}
                        maxRange={samplingConfig.controls.signalFrequency.max}
                        stepRange={samplingConfig.controls.signalFrequency.step}
                    />

                    <ParameterSlider
                        label="Sampling frequency fₛ (Hz)"
                        value={samplingFrequency}
                        setValue={setSamplingFrequency}
                        text={samplingFrequencyText}
                        setText={setSamplingFrequencyText}
                        minRange={samplingConfig.controls.samplingFrequency.min}
                        maxRange={samplingConfig.controls.samplingFrequency.max}
                        stepRange={samplingConfig.controls.samplingFrequency.step}
                    />

                    <ParameterSlider
                        label={`Phase φ = ${formatPhase(phase)} rad`}
                        value={phase}
                        setValue={setPhase}
                        text={phaseText}
                        setText={setPhaseText}
                        minRange={samplingConfig.controls.phase.min}
                        maxRange={samplingConfig.controls.phase.max}
                        stepRange={samplingConfig.controls.phase.step}
                    />
                </div>

                {/* Immediate feedback: current values and their meaning stay together. */}
                <div
                    style={{
                        marginTop: isMobile ? 10 : 12,
                        display: "grid",
                        gridTemplateColumns: useSingleColumnPlots
                            ? "1fr"
                            : "repeat(2, minmax(0, 1fr))",
                        gap: theme.spacing.controlGap,
                        alignItems: "stretch",
                    }}
                >
                    <div
                        style={{
                            padding: isMobile ? 9 : 12,
                            borderRadius: 10,
                            border: nyquistStatus.border,
                            background: nyquistStatus.background,
                        }}
                    >
                        <div
                            style={{
                                marginBottom: 8,
                                fontWeight: 800,
                                color: theme.colors.text,
                            }}
                        >
                            Current sampling status
                        </div>

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

                        </div>
                    </div>

                    <EducationalExplanationCard
                        title="What this means"
                        marginTop={0}
                        accentColor={nyquistStatus.color}
                    >
                        {isAliasing ? (
                            <div>
                                Since <InlineMath math="f_s<2f_0" />, the shifted
                                spectral replicas overlap. The samples no longer
                                uniquely represent the original signal, so the
                                reconstructed waveform differs from it.
                            </div>
                        ) : isAtNyquist ? (
                            <div>
                                The system is exactly at{" "}
                                <InlineMath math="f_s=2f_0" />. This boundary is
                                phase-sensitive: a zero-phase sine can produce only
                                zero-valued samples, so practical systems sample above
                                this rate.
                            </div>
                        ) : (
                            <div>
                                Since <InlineMath math="f_s>2f_0" />, the spectral
                                replicas remain separated and the original sinusoid
                                can be reconstructed without aliasing.
                            </div>
                        )}
                    </EducationalExplanationCard>
                </div>

                {/* Formula explanation */}
                <EducationalExplanationCard
                    title="Sampling relationships"
                    defaultExpanded={false}
                >
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
                            math={String.raw`f_{\mathrm{alias}}=\left|f_0-nf_s\right|`}
                        />
                    </div>
                </EducationalExplanationCard>
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
                                math={String.raw`X_s(f)=\frac{1}{T_s}\sum_{n=-\infty}^{\infty}X(f-nf_s)`}
                            />
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

        </ResponsiveLabPageShell>
    );
}
