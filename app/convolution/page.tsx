"use client";

// useState - returns an array with two elements: the current state value and a function to update that value
// useMemo - It runs the function only when one of its dependencies changes, otherwise, it reuses the last calculated
// useEffect - It runs the provided function after the component has rendered and committed to the screen
import { useCallback, useEffect, useMemo, useState } from "react";
import { PresetInput, PRESETS } from "@/library/signal";
import SignalSourcePreset, { TextBoxSliders, TSliders } from "@/components/controls/ControlPanelSource"
import SignalPlot, {makeStemTraces} from "@/components/visualization/SignalPlot";
import CustomExpressionInput from "@/components/controls/CustomExpressionInput";
import {buildExpressionEvaluator,validateExpression} from "@/library/customExpression";
import DrawSignalControls from "@/components/drawing/DrawSignalControls";
import DrawSignalPanel from "@/components/drawing/DrawSignalPanel";
import { InlineMath } from "react-katex";
import { getPresetValue, getDrawnValue } from "@/library/signalEvaluator";
import type { SignalSource } from "@/library/types";
import { backgroundColor, borderColor, convolutionConfig, defaultHSignal, defaultXSignal, gapBottom } from "@/features/convolution/config";
import { computeConvolutionSamples, createCachedSignalEvaluator } from "@/features/convolution/convolutionEngine";
import { buildDiscontinuityAwarePlotSamples } from "@/features/convolution/discontinuityPlot";
import ConvolutionStageToolbar, { type TimeMode } from "@/features/convolution/components/ConvolutionStageToolbar";
import ResponsiveLabPageShell from "@/components/layout/ResponsiveLabPageShell";
import SignalSourceEditor from "@/features/convolution/components/SignalSourceEditor";
import { theme } from "@/styles/theme";

// Sampling density multiplier used by the continuous-time numerical integral.
const spm = convolutionConfig.sampling.densityMultiplier;
const spmfix = spm - 1;

export default function ConvolutionPage() {
    // ===== time mode ===== isDiscrete default at continuous
    const [timeMode, setTimeMode] = useState<TimeMode>(convolutionConfig.defaults.timeMode);
    const isDiscrete = timeMode === "discrete";

    // Responsive layout modes
    const [viewportWidth, setViewportWidth] = useState<number>(convolutionConfig.defaults.viewportWidth);
    const isMobile = viewportWidth < theme.breakpoints.mobile;
    const isTablet = viewportWidth >= theme.breakpoints.mobile && viewportWidth < theme.breakpoints.tablet;
    const isMobileM = viewportWidth < theme.breakpoints.desktop;

    useEffect(() => {
        const update = () => setViewportWidth(window.innerWidth);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);
    

    // X and H Panel source Letters
    const varLetter = isDiscrete ? "[n]" : "(t)";

    // ===== x source + h source ===== sources is default at preset
    const [xSource, setXSource] = useState<SignalSource>(defaultXSignal.source);
    const [hSource, setHSource] = useState<SignalSource>(defaultHSignal.source);

    // ===== presets =====
    const [xInput, setXInput] = useState<PresetInput>(defaultXSignal.preset);
    const [hInput, setHInput] = useState<PresetInput>(defaultHSignal.preset);

    // ===== widths (For preset only) =====
    const [xWidth, setXWidth] = useState<number>(defaultXSignal.width);
    const [hWidth, setHWidth] = useState<number>(defaultHSignal.width);

    // ===== amplitude (For preset only) =====
    const [xAmp, setXAmp] = useState<number>(defaultXSignal.amplitude);
    const [hAmp, setHAmp] = useState<number>(defaultHSignal.amplitude);

    // ===== width range ====
    const WidthMinC = convolutionConfig.controls.continuousWidth.min;
    const WidthMaxC = convolutionConfig.controls.continuousWidth.max;
    const WidthStepC = convolutionConfig.controls.continuousWidth.step;
    const WidthMinD = convolutionConfig.controls.discreteWidth.min;
    const WidthMaxD = convolutionConfig.controls.discreteWidth.max;
    const WidthStepD = convolutionConfig.controls.discreteWidth.step;

    // ===== set width range according to mode =====
    const WidthMin = isDiscrete ? WidthMinD : WidthMinC;
    const WidthMax = isDiscrete ? WidthMaxD : WidthMaxC;
    const WidthStep = isDiscrete ? WidthStepD : WidthStepC;

    // ===== Amplitude range ====
    const AmpMin = convolutionConfig.controls.amplitude.min;
    const AmpMax = convolutionConfig.controls.amplitude.max;
    const AmpStep = convolutionConfig.controls.amplitude.step;

    // ===== Text box =====
    const [xWidthText, setXWidthText] = useState<string>(isDiscrete ? String(Math.round(xWidth)) : xWidth.toFixed(2));
    const [hWidthText, setHWidthText] = useState<string>(isDiscrete ? String(Math.round(hWidth)) : hWidth.toFixed(2));
    const [xAmpText, setXAmpText] = useState<string>(xAmp.toFixed(2))
    const [hAmpText, setHAmpText] = useState<string>(hAmp.toFixed(2))

    // ==== x and h input expression state ====
    const [xExpr, setXExpr] = useState(defaultXSignal.expression);
    const [hExpr, setHExpr] = useState(defaultHSignal.expression);
    
    const xExprCheck = useMemo(() => {
        if (xSource !== "expression") return { ok: true, error: "" };
        //trim() removes spaces at start and end
        if (xExpr.trim() === "") return { ok: true, error: "" };
        return validateExpression(xExpr, isDiscrete)
    }, [xExpr, xSource, isDiscrete]);

    // If x is using custom expression mode, validate the typed text, and if valid, build a function for it.
    const xExprFn = useMemo(() => {
        if (xSource !== "expression") return null;
        if (xExpr.trim() === "") return null;
        if (!xExprCheck.ok) return null;
        return buildExpressionEvaluator(xExpr, isDiscrete);
    }, [isDiscrete, xExpr, xSource, xExprCheck]);

    
    const hExprCheck = useMemo(() => {
        if (hSource !== "expression") return { ok: true, error: "" };
        if (hExpr.trim() === "") return { ok: true, error: "" };
        return validateExpression(hExpr, isDiscrete);
    }, [hExpr, hSource, isDiscrete]);

    // If h is using custom expression mode, validate the typed text, and if valid, build a function for it.
    const hExprFn = useMemo(() => {
        if (hSource !== "expression") return null;
        if (hExpr.trim() === "") return null;
        if (!hExprCheck.ok) return null;
        return buildExpressionEvaluator(hExpr, isDiscrete);
    }, [hExpr, hSource, hExprCheck, isDiscrete]);

    // Handle rounding of int when switching between CT and DT 
    useEffect(() => {
    if (isDiscrete) {
        const newXWidth = Math.round(xWidth);
        const newHWidth = Math.round(hWidth);

        setXWidth(newXWidth);
        setHWidth(newHWidth);

        setXWidthText(String(newXWidth));
        setHWidthText(String(newHWidth));
    } else {
        setXWidthText(xWidth.toFixed(2));
        setHWidthText(hWidth.toFixed(2));
    }}, [hWidth, isDiscrete, xWidth]);

    // ==== screen height ====
    // set inital value 
    const [vh, setVh] = useState<number>(convolutionConfig.layout.initialViewportHeight);
    // wait until browser is ready and get real browser height
    useEffect(() => {
        const update = () => setVh(window.innerHeight);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    // Plot heights are controlled directly by config. The page scrolls when the
    // controls and two plots are taller than the available browser window.
    const signalPlotHeight = isMobile
        ? convolutionConfig.layout.mobilePlotHeight
        : isTablet
          ? convolutionConfig.layout.tabletPlotHeight
          : convolutionConfig.layout.desktopPlotHeight;

    //tau = array that consist x-axis position of 1400 points; top plot; 1400 to have a better intergral approx
	//tAxis = array that consist x-axis position of 700 points; bottom plot
    //dt = spacing between tau samples in CT
	//tMin, tMax = output/slider range
	//reference: y(t) = ∫ x(τ) h(t-τ) dτ; y[n] = Σ x[k] h[n-k]
    const { tau, tAxis, dt, tMin, tMax } = useMemo(() => {
    if (!isDiscrete) {
        if (xSource === "expression" || hSource === "expression") {
            const domain = convolutionConfig.sampling.fixedContinuousDomain;
            const tau = Array.from({ length: convolutionConfig.sampling.continuousInputPoints * spm }, (_, i) =>
                -domain + (2 * domain * i) / ((convolutionConfig.sampling.continuousInputPoints - 1) * spm + spmfix)
            );
            const tAxis = Array.from({ length: convolutionConfig.sampling.continuousOutputPoints * spm }, (_, i) =>
                -domain + (2 * domain * i) / ((convolutionConfig.sampling.continuousOutputPoints - 1) * spm + spmfix)
            );
            const dt = tau[1] - tau[0];
            return { tau, tAxis, dt, tMin: -domain, tMax: domain };
        }
        const base = convolutionConfig.sampling.continuousBaseDomain;
        const scale = Math.max(1, xWidth + hWidth + convolutionConfig.sampling.continuousDomainPadding);
        const domain = base * scale;
        // Creates 1400 evenly spaced points from -domain to +domain
        const tau = Array.from({ length: convolutionConfig.sampling.continuousInputPoints * spm }, (_, i) => -domain + (2 * domain * i) / ((convolutionConfig.sampling.continuousInputPoints - 1) * spm + spmfix));
        const tAxis = Array.from({ length: convolutionConfig.sampling.continuousOutputPoints * spm }, (_, i) => -domain + (2 * domain * i) / ((convolutionConfig.sampling.continuousOutputPoints - 1) * spm + spmfix));
        // sample step
        const dt = tau[1] - tau[0];
        return { tau, tAxis, dt, tMin: -domain, tMax: domain };
    }
        if (xSource === "expression" || hSource === "expression") {
            const nMax = convolutionConfig.sampling.fixedDiscreteIndex;

            const tau = Array.from({ length: 2 * nMax + 1 }, (_, i) => i - nMax);
            const tAxis = Array.from({ length: 2 * nMax + 1 }, (_, i) => i - nMax);

            return { tau, tAxis, dt: 1, tMin: -nMax, tMax: nMax };
        }
        const WxR = Math.round(xWidth);
        const WhR = Math.round(hWidth);
        const nMax = Math.max(
            convolutionConfig.sampling.minimumDiscreteIndex,
            WxR + WhR + convolutionConfig.sampling.discreteDomainPadding
        );
        // Creates min 12 * 2  + 1 evenly spaced points
        const tau = Array.from({ length: 2 * nMax + 1 }, (_, i) => i - nMax);
        const tAxis = Array.from({ length: 2 * nMax + 1 }, (_, i) => i - nMax);
    
        return { tau, tAxis, dt: 1, tMin: -nMax, tMax: nMax };
    }, [isDiscrete, xSource, hSource, xWidth, hWidth]);

    // Current t slider position/value
    const [t0, setT0] = useState<number>(convolutionConfig.defaults.slidePosition);

    useEffect(() => {
    setT0((prev) => Math.max(tMin, Math.min(tMax, prev)));
    }, [tMin, tMax]);

    // ---- draw ----

    const [showDrawModalX, setShowDrawModalX] = useState(false);
    const [showDrawModalH, setShowDrawModalH] = useState(false);

    const [xDrawn, setXDrawn] = useState<number[]>([]);
    const [hDrawn, setHDrawn] = useState<number[]>([]);

    const [Ax, setAx] = useState(1);
    const [Ah, setAh] = useState(1);

    const [AxText, setAxText] = useState("1.00");
    const [AhText, setAhText] = useState("1.00");

    const AxMin = convolutionConfig.controls.drawingAmplitude.min;
    const AxMax = convolutionConfig.controls.drawingAmplitude.max;
    const AxStep = convolutionConfig.controls.drawingAmplitude.step;
    const AhMin = convolutionConfig.controls.drawingAmplitude.min;
    const AhMax = convolutionConfig.controls.drawingAmplitude.max;
    const AhStep = convolutionConfig.controls.drawingAmplitude.step;

    useEffect(() => {
        setXDrawn((prev) => (prev.length === tau.length ? prev : Array(tau.length).fill(0)));
        setHDrawn((prev) => (prev.length === tau.length ? prev : Array(tau.length).fill(0)));
    }, [tau]);

    const evaluateXSignal = useCallback((inputX: number): number => {
        if (xSource === "preset") {
            return getPresetValue(xInput, inputX, xWidth, xAmp, isDiscrete);
        }

        if (xSource === "expression" && xExprFn) {
            if (xExpr.trim() === "" || !xExprFn) return 0;
            return xExprFn(inputX);
        }
        if (xSource === "draw") {
            return Ax * getDrawnValue(inputX, tau, xDrawn);
        }
        return 0;
    }, [Ax, isDiscrete, tau, xAmp, xDrawn, xExpr, xExprFn, xInput, xSource, xWidth]);

    const evaluateHSignal = useCallback((inputX: number): number => {
        if (hSource === "preset") {
            return getPresetValue(hInput, inputX, hWidth, hAmp, isDiscrete);
        }
        if (hSource === "expression" && hExprFn) {
            if (hExpr.trim() === "" || !hExprFn) return 0;
            return hExprFn(inputX);
        }
        if (hSource === "draw") {
            return Ah * getDrawnValue(inputX, tau, hDrawn);
        }
        return 0;
    }, [Ah, hAmp, hDrawn, hExpr, hExprFn, hInput, hSource, hWidth, isDiscrete, tau]);

    // Integer shifts repeat heavily during discrete convolution, so reuse exact
    // h[n] evaluations. Continuous positions remain direct to avoid a very large cache.
    const evaluateHForConvolution = useMemo(
        () =>
            isDiscrete
                ? createCachedSignalEvaluator(evaluateHSignal)
                : evaluateHSignal,
        [evaluateHSignal, isDiscrete]
    );

    // create y-axis point; original unshifted signals; 
    // CT: x(t0) ; DT: x[n0]
    // tau = x-positions; xSamples = y-values of x at those positions
    const xSamples = useMemo(() => {
        return tau.map((v) => evaluateXSignal(v));
    }, [evaluateXSignal, tau]);

    // CT: h(t0 - τ) ; DT: h[n0 - k]
    const hFlippedSamples = useMemo(() => {
        return tau.map((v) => evaluateHForConvolution(t0 - v));
    }, [evaluateHForConvolution, t0, tau]);

    // 
    const hShiftedNotFlippedSamples = useMemo(() => {
        return tau.map((v) => evaluateHForConvolution(v - t0));
    }, [evaluateHForConvolution, t0, tau]);

    // h signal flipped state
    const [isHFlipped, setIsHFlipped] = useState<boolean>(convolutionConfig.defaults.isHFlipped);

    // h signal flipped and orginal 
    const hDisplaySamples = useMemo(() => {
        return isHFlipped ? hFlippedSamples : hShiftedNotFlippedSamples;
    }, [isHFlipped, hFlippedSamples, hShiftedNotFlippedSamples]);

    // temporary product curve at the current slider position
    const productSamples = useMemo(() => {
        return tau.map((_, i) => xSamples[i] * hDisplaySamples[i]);
    }, [tau, xSamples, hDisplaySamples]);

    // convolution output
    // y(t) = ∫ x(τ) h(t - τ) dτ; integral add up infinitely many tiny pieces of area
    // Each tiny piece of area is approximately: height × width
    // height = x(τ) h(t - τ), width = dt
    // one tiny slice contributes: x(τ) h(t - τ) × dt
    // full integral is approximated by summing all those slices: y(t) ≈ Σ [x(τ_i) h(t - τ_i)] × dt
    const ySamples = useMemo(() => {
        return computeConvolutionSamples({
            isDiscrete,
            isHFlipped,
            tAxis,
            tau,
            dt,
            xSamples,
            evaluateHSignal: evaluateHForConvolution,
        });
    }, [dt, evaluateHForConvolution, isDiscrete, isHFlipped, tAxis, tau, xSamples]);

    // Current output value at slider
    const yAtT0 = useMemo(() => {
        let bestIdx = 0;
        let bestDist = Math.abs(tAxis[0] - t0);
        for (let i = 1; i < tAxis.length; i++) {
            const d = Math.abs(tAxis[i] - t0);
            if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
            }
        }
        return ySamples[bestIdx] ?? 0;
        }, [tAxis, ySamples, t0]);

    const hDisplayLabel = isDiscrete
        ? (isHFlipped ? "h[n-k]" : "h[k-n]")
        : (isHFlipped ? "h(t-τ)" : "h(τ-t)");
    const xDisplayLabel = isDiscrete ? "x[k]" : "x(τ)";

    const xDisplayMath = isDiscrete ? (
        <InlineMath math="x[k]" />
    ) : (
        <InlineMath math={String.raw`x(\tau)`} />
    );

    const hDisplayMath = isDiscrete ? (
        isHFlipped ? <InlineMath math="h[n-k]" /> : <InlineMath math="h[k-n]" />
    ) : (
        isHFlipped ? (
            <InlineMath math={String.raw`h(t-\tau)`} />
        ) : (
            <InlineMath math={String.raw`h(\tau-t)`} />
        )
    );

    const xInputExpr = isDiscrete ? "k" : "τ";
    const hInputExpr = isDiscrete
        ? (isHFlipped ? "n-k" : "k-n")
        : (isHFlipped ? "t-τ" : "τ-t");

    // Build plot-only samples for both presets and custom expressions. The
    // convolution engine still uses xSamples, hDisplaySamples, and
    // productSamples, while repeated x positions make true jumps vertical.
    const evaluateHDisplaySignal = useCallback(
        (inputX: number) =>
            isHFlipped
                ? evaluateHForConvolution(t0 - inputX)
                : evaluateHForConvolution(inputX - t0),
        [evaluateHForConvolution, isHFlipped, t0]
    );

    const evaluateProductSignal = useCallback(
        (inputX: number) =>
            evaluateXSignal(inputX) * evaluateHDisplaySignal(inputX),
        [evaluateHDisplaySignal, evaluateXSignal]
    );

    const xPlotSamples = useMemo(
        () =>
            isDiscrete
                ? { x: tau, y: xSamples }
                : buildDiscontinuityAwarePlotSamples(tau, xSamples, evaluateXSignal),
        [evaluateXSignal, isDiscrete, tau, xSamples]
    );

    const hPlotSamples = useMemo(
        () =>
            isDiscrete
                ? { x: tau, y: hDisplaySamples }
                : buildDiscontinuityAwarePlotSamples(
                    tau,
                    hDisplaySamples,
                    evaluateHDisplaySignal
                ),
        [evaluateHDisplaySignal, hDisplaySamples, isDiscrete, tau]
    );

    const productPlotSamples = useMemo(
        () =>
            isDiscrete
                ? { x: tau, y: productSamples }
                : buildDiscontinuityAwarePlotSamples(
                    tau,
                    productSamples,
                    evaluateProductSignal
                ),
        [evaluateProductSignal, isDiscrete, productSamples, tau]
    );

    // plot data
    const inputTraces = useMemo(() => {
    if (isDiscrete) {
        return [
        ...makeStemTraces(tau, xSamples, xDisplayLabel, theme.colors.inputSignal),
        ...makeStemTraces(tau, hDisplaySamples, hDisplayLabel, theme.colors.kernelSignal),
        {
                x: tau,
                y: productSamples,
                type: isDiscrete ? "bar" : "scatter",
                mode: isDiscrete ? "" : "lines",
                name: xDisplayLabel + "·" + hDisplayLabel,
                marker: {color: theme.colors.dangerMuted},
                fill : "tozeroy",
                fillcolor: theme.colors.dangerMuted,
                //hoverinfo: "skip",
        },
        
        ];
    }

    return [
        {
            x: xPlotSamples.x,
            y: xPlotSamples.y,
            type: "scatter",
            mode: "lines",
            name: xDisplayLabel,
            line: {
                color: theme.colors.inputSignal,
                width: 3,
                shape: "linear",
            },
        },
        {
            x: hPlotSamples.x,
            y: hPlotSamples.y,
            type: "scatter",
            mode: "lines",
            name: hDisplayLabel,
            line: {
                color: theme.colors.kernelSignal,
                width: 3,
                shape: "linear",
            },
        },
        {
            x: productPlotSamples.x,
            y: productPlotSamples.y,
            type: "scatter",
            mode: "lines",
            name: xDisplayLabel + "·" + hDisplayLabel,
            line: {
                color: theme.colors.dangerMuted,
                width: 2,
                shape: "linear",
            },
            fill : "tozeroy",
            fillcolor: theme.colors.dangerMuted,
            hoverinfo: "skip",
        },
    ];
    }, [
        hDisplayLabel,
        hDisplaySamples,
        hPlotSamples,
        isDiscrete,
        productPlotSamples,
        productSamples,
        tau,
        xDisplayLabel,
        xPlotSamples,
        xSamples,
    ]);

    // ===== output plot y-range =====
    // Lowest visible output value, but include 0 so the axis still shows the baseline
    const outYMin = useMemo(() => Math.min(...ySamples, 0), [ySamples]);
    const outYMax = useMemo(() => Math.max(...ySamples, 0), [ySamples]);


    // ===== revealed output curve =====
    // Show only the part of the output waveform up to the current slider position t0.
    // Values after t0 are set to null so Plotly hides that part of the curve.
    const yReveal = useMemo(() => {
        return tAxis.map((x, i) => {
            if (x <= t0) return ySamples[i];
            return null;
        });
    }, [tAxis, ySamples, t0]);

    const outputTraces = useMemo(() => {
        if (isDiscrete) {
            return [
                ...makeStemTraces(tAxis, yReveal, "y[n]", theme.colors.outputSignal),
                {
                    x: [t0],
                    y: [yAtT0],
                    type: "scatter",
                    mode: "markers",
                    name: "current y[n]",
                    marker: { color: theme.colors.danger, size: 9 },
                },
                {
                    x: [t0, t0],
                    y: [outYMin, outYMax],
                    type: "scatter",
                    mode: "lines",
                    name: "current n",
                    line: { color: theme.colors.danger, width: 2, dash: "dot" },
                    hoverinfo: "skip",
                },
            ];
        }
        return [
            {
                x: tAxis,
                y: yReveal,
                type: "scatter",
                mode: "lines",
                name: "y(t)",
                line: { color: theme.colors.outputSignal, width: 3 },
            },
            {
                x: [t0],
                y: [yAtT0],
                type: "scatter",
                mode: "markers",
                name: "current y(t)",
                marker: { color: theme.colors.danger, size: 9 },
            },
            {
                x: [t0, t0],
                y: [outYMin, outYMax],
                type: "scatter",
                mode: "lines",
                name: "current t",
                line: { color: theme.colors.danger, width: 2, dash: "dot" },
                hoverinfo: "skip",
            },
        ];
    }, [isDiscrete, outYMax, outYMin, t0, tAxis, yAtT0, yReveal]);

    // ===== fixed x-axis range for plotting =====
    // Add a little extra padding in DT so the outermost stems are not cut too tightly.
    const xPad = isDiscrete ? 1 : 0;
    const xLo = tMin - xPad;
    const xHi = tMax + xPad;

    // add predefine expression button
    const quickSnippets = useMemo(() => {
        if (isDiscrete) {
            return [
            { text: "rect[n]", display: "\\operatorname{rect}[n]" },
            { text: "tri[n]", display: "\\operatorname{tri}[n]" },
            { text: "u[n]", display: "u[n]" },
            { text: "ramp[n]", display: "\\operatorname{ramp}[n]" },
            { text: "sgn[n]", display: "\\operatorname{sgn}[n]" },
            {
                text: "sin[PI*n/4]",
                display: "\\sin\\left(\\frac{\\pi n}{4}\\right)",
            },
            {
                text: "exp[-2*n]*u[n]",
                display: "\\mathrm{e}^{-2n}u[n]",
            },
            ];
        }

        return [
            { text: "rect(t)", display: "\\operatorname{rect}(t)" },
            { text: "tri(t)", display: "\\operatorname{tri}(t)" },
            { text: "u(t)", display: "u(t)" },
            { text: "ramp(t)", display: "\\operatorname{ramp}(t)" },
            { text: "sgn(t)", display: "\\operatorname{sgn}(t)" },
            {
            text: "sin(2*PI*t)",
            display: "\\sin(2\\pi t)",
            },
            {
            text: "exp(-2*t)*u(t)",
            display: "\\mathrm{e}^{-2t}u(t)",
            },
        ];
    }, [isDiscrete]);

    function appendXSnippet(snippet: string) {
        setXExpr((prev) => (prev.trim() ? `${prev} + ${snippet}` : snippet));
    }

    function appendHSnippet(snippet: string) {
        setHExpr((prev) => (prev.trim() ? `${prev} + ${snippet}` : snippet));
    }
    
    // setting to default state whenever source is changed
    useEffect(() => {
        if (xSource === "preset") {
            setXWidth(1);
            setXAmp(1);
            setXInput("rect");
            setXWidthText(isDiscrete ? "1" : "1.00");
            setXAmpText("1.00");
            setT0(
                isDiscrete
                    ? convolutionConfig.defaults.discreteSlidePosition
                    : convolutionConfig.defaults.slidePosition
            );
        }

        if (xSource === "expression") {
            setXExpr("");
            setT0(convolutionConfig.defaults.expressionSlidePosition);
        }
    }, [xSource, isDiscrete]);

    useEffect(() => {
        if (hSource === "preset") {
            setHWidth(1);
            setHAmp(1);
            setHInput(defaultHSignal.preset);
            setHWidthText(isDiscrete ? "1" : "1.00");
            setHAmpText("1.00");
            setT0(
                isDiscrete
                    ? convolutionConfig.defaults.discreteSlidePosition
                    : convolutionConfig.defaults.slidePosition
            );
        }

        if (hSource === "expression") {
            setHExpr("");
            setT0(convolutionConfig.defaults.expressionSlidePosition);
        }
    }, [hSource, isDiscrete]);

    const modalH = Math.min(
        convolutionConfig.layout.drawModalViewportRatio * vh,
        convolutionConfig.layout.maximumDrawModalHeight
    );
    const drawCanvasH = Math.max(
        convolutionConfig.layout.minimumDrawCanvasHeight,
        Math.floor(modalH - convolutionConfig.layout.drawModalReservedHeight)
    );

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
            setShowDrawModalX(false);
            setShowDrawModalH(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
    <ResponsiveLabPageShell
        title="Convolution"
        isMobile={isMobile}
        mainStyle={{
            background: backgroundColor,
            fontSize: isMobile ? "0.9rem" : "1rem",
        }}
    >

    {/* Control Panel */}
    <div
        style={{
            border: borderColor,
            borderRadius: 12,
            padding: 10,
            boxSizing: "border-box",
            marginBottom: gapBottom,
            background: "var(--plot-card)",
            }}
    >
        {/* Time mode and convolution-stage controls */}
        <ConvolutionStageToolbar
            timeMode={timeMode}
            setTimeMode={setTimeMode}
            isHFlipped={isHFlipped}
            setIsHFlipped={setIsHFlipped}
            isMobile={isMobile}
            gapBottom={gapBottom}
        />

        {/* X and H Panels */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:12}}>
            {/* X Panel */}
            <SignalSourceEditor
                    signalName="x"
                    varLetter={varLetter}
                    source={xSource}    
                    setSource={setXSource}
                    gapBottom={gapBottom}
            >
                {xSource === "preset" && (
                    <>
                        {/* x preset drop down selection */}
                        <SignalSourcePreset
                            selectedPreset={xInput}
                            setSelectedPreset={setXInput}
                            presets={PRESETS}
                            gapBottom={gapBottom}
                            amplitude={xAmp}
                            width={xWidth}
                            displaySignalLabel={xDisplayLabel}
                            inputExpr={xInputExpr}
                        />
                        {/* x width sliders */}
                        <TextBoxSliders
                            signalName = "x"
                            varLetter = {varLetter}
                            strWidthAmp = "width"
                            isDiscrete = {isDiscrete}
                            roundOnDiscrete={true}
                            minRange = {WidthMin}
                            maxRange = {WidthMax}
                            stepRange = {WidthStep}
                            widthValue = {xWidth}
                            setWidthValue = {setXWidth}
                            widthText={xWidthText}
                            setWidthText={setXWidthText}
                            signalLabel={xDisplayLabel}
                        />
                        {/* x amp sliders */}
                        <TextBoxSliders
                            signalName = "x"
                            varLetter = {varLetter}
                            strWidthAmp = "Amplitude"
                            isDiscrete = {isDiscrete}
                            roundOnDiscrete={false}
                            minRange = {AmpMin}
                            maxRange = {AmpMax}
                            stepRange = {AmpStep}
                            widthValue = {xAmp}
                            setWidthValue = {setXAmp}
                            widthText={xAmpText}
                            setWidthText={setXAmpText}
                            signalLabel={xDisplayLabel}
                        />
                    </>
                )}
                {xSource === "expression" && (
                    <CustomExpressionInput
                        title="Custom Expression for x"
                        value={xExpr}
                        setValue={setXExpr}
                        error={xExprCheck.error}
                        gapBottom={gapBottom}
                        placeholder={isDiscrete ? "Example: rect[n/3] + sin[PI*n/4]" : "Example: rect(t/2) + sin(2*PI*t)"}
                        parsedOk={xExprCheck.ok}
                        quickSnippets={quickSnippets}
                        onAppendSnippet={appendXSnippet}
                        clearAriaLabel="Clear x expression"
                        isDiscrete={isDiscrete}
                    />
                )}
                {xSource === "draw" && (
                    <DrawSignalControls
                        signalName="x"
                        amplitude={Ax}
                        amplitudeText={AxText}
                        setAmplitude={setAx}
                        setAmplitudeText={setAxText}
                        amplitudeMin={AxMin}
                        amplitudeMax={AxMax}
                        amplitudeStep={AxStep}
                        onOpen={() => setShowDrawModalX(true)}
                        onClear={() => setXDrawn(Array(tau.length).fill(0))}
                        isDiscrete = {isDiscrete}
                        signalLabel = {xDisplayLabel}
                        varLetter = {varLetter}
                    />
                )}
            </SignalSourceEditor>
            {/* End of X Panel */}
            {/* H Panel */}
            <SignalSourceEditor
                    signalName="h"
                    varLetter={varLetter}
                    source={hSource}    
                    setSource={setHSource}
                    gapBottom={gapBottom}
            >
                {hSource === "preset" && (
                <>
                    {/* h preset drop down selection */}
                    <SignalSourcePreset
                        selectedPreset={hInput}
                        setSelectedPreset={setHInput}
                        presets={PRESETS}
                        gapBottom={gapBottom}
                        amplitude={hAmp}
                        width={hWidth}
                        displaySignalLabel={hDisplayLabel}
                        inputExpr={hInputExpr}
                    />
                    {/* h width sliders */}
                    <TextBoxSliders
                        signalName = "h"
                        varLetter = {varLetter}
                        strWidthAmp = "width"
                        isDiscrete = {isDiscrete}
                        roundOnDiscrete={true}
                        minRange = {WidthMin}
                        maxRange = {WidthMax}
                        stepRange = {WidthStep}
                        widthValue = {hWidth}
                        setWidthValue = {setHWidth}
                        widthText={hWidthText}
                        setWidthText={setHWidthText}
                        signalLabel={hDisplayLabel}
                    />
                    {/* h Amp sliders */}
                    <TextBoxSliders
                        signalName = "h"
                        varLetter = {varLetter}
                        strWidthAmp = "Amplitude"
                        isDiscrete = {isDiscrete}
                        roundOnDiscrete={false}
                        minRange = {AmpMin}
                        maxRange = {AmpMax}
                        stepRange = {AmpStep}
                        widthValue = {hAmp}
                        setWidthValue = {setHAmp}
                        widthText={hAmpText}
                        setWidthText={setHAmpText}
                        signalLabel={hDisplayLabel}
                    />
                </>)}
                {hSource === "expression" && (
                    <CustomExpressionInput
                        title="Custom Expression for h"
                        value={hExpr}
                        setValue={setHExpr}
                        error={hExprCheck.error}
                        gapBottom={gapBottom}
                        placeholder={isDiscrete ? "Example: tri[n/2]" : "Example: exp(-2*t)*u(t)"}
                        parsedOk={hExprCheck.ok}
                        quickSnippets={quickSnippets}
                        onAppendSnippet={appendHSnippet}
                        clearAriaLabel="Clear h expression"
                        isDiscrete={isDiscrete}
                    />
                )}
                {hSource === "draw" && (
                    <DrawSignalControls
                        signalName="h"
                        amplitude={Ah}
                        amplitudeText={AhText}
                        setAmplitude={setAh}
                        setAmplitudeText={setAhText}
                        amplitudeMin={AhMin}
                        amplitudeMax={AhMax}
                        amplitudeStep={AhStep}
                        onOpen={() => setShowDrawModalH(true)}
                        onClear={() => setHDrawn(Array(tau.length).fill(0))}
                        isDiscrete = {isDiscrete}
                        signalLabel = {hDisplayLabel}
                        varLetter = {varLetter}
                    />
                )}
            </SignalSourceEditor>
            {/* End of H Panel */}
        </div>

        <TSliders
            tminRange={tMin}
            tmaxRange={tMax}
            tStepSize={isDiscrete ? 1 : 0.01}
            tvalue={t0}
            setTValue={setT0}
            yValue={yAtT0}
            isDiscrete={isDiscrete}
        />
    </div>
    {/* End of Control Panel */}

    {/* Signal Plot input X and H overlap */}
    <div style={{marginBottom: gapBottom}}>
        <SignalPlot
            title={<>Input: {xDisplayMath} and {hDisplayMath}</>}
            // `Input: ${xDisplayLabel} and ${hDisplayLabel}`
            height={signalPlotHeight}
            traces={inputTraces}
            xLabel={isDiscrete ? "k" : "τ"}
            yLabel={"Amplitude"}
            xRange={[xLo, xHi]}
            compact={isMobile}
            compactM={isMobileM}
        />

        
    </div>
    {/* End of Signal Plot input X and H overlap */}
        
    {/* Signal Plot output convolution */}
    <div>
        <SignalPlot
            title={
                isHFlipped ? (
                    <>
                        <strong>Convolution output:&nbsp;</strong>
                        {isDiscrete ? (
                            <InlineMath
                                math={String.raw`y[n]=\sum_{k=-\infty}^{\infty}x[k]h[n-k]`}
                            />
                        ) : (
                            <InlineMath
                                math={String.raw`y(t)=\int_{-\infty}^{\infty}x(\tau)\,h(t-\tau)\,d\tau`}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <strong>Before convolution:&nbsp;</strong>
                        flip the kernel h, then slide it across x.
                    </>
                )
            }
            height={signalPlotHeight}
            traces={isHFlipped ? outputTraces : []}
            xLabel={isDiscrete ? "n" : "t"}
            yLabel={"Amplitude"}
            xRange={[xLo, xHi]}
            compact={isMobile}
            compactM={isMobileM}
        />
    </div>
    {/* End of Signal Plot output convolution */}

    {/* show Drawing panel */}
    {xSource === "draw" && showDrawModalX && (
        <DrawSignalPanel
            open={showDrawModalX}
            onClose={() => setShowDrawModalX(false)}
            title={`Draw ${xDisplayLabel}`}
            tau={tau}
            samples={xDrawn}
            onChange={setXDrawn}
            onClear={() => setXDrawn(Array(tau.length).fill(0))}
            yMin={-Math.max(Math.abs(Ax), 0.1)}
            yMax={Math.max(Math.abs(Ax), 0.1)}
            canvasHeight={drawCanvasH}
            modalHeight={modalH}
            discrete={isDiscrete}
        />
    )}

    {hSource === "draw" && showDrawModalH && (
        <DrawSignalPanel
            open={showDrawModalH}
            onClose={() => setShowDrawModalH(false)}
            title={`Draw ${hDisplayLabel}`}
            tau={tau}
            samples={hDrawn}
            onChange={setHDrawn}
            onClear={() => setHDrawn(Array(tau.length).fill(0))}
            yMin={-Math.max(Math.abs(Ah), 0.1)}
            yMax={Math.max(Math.abs(Ah), 0.1)}
            canvasHeight={drawCanvasH}
            modalHeight={modalH}
            discrete={isDiscrete}
        />
    )}

    </ResponsiveLabPageShell>
    );
}
