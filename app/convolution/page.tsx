"use client";

import Link from "next/link";
// useState - returns an array with two elements: the current state value and a function to update that value
// useMemo - It runs the function only when one of its dependencies changes, otherwise, it reuses the last calculated
// useRef - It returns a mutable object with a single current property, which you can read from and write to directly
// useEffect - It runs the provided function after the component has rendered and committed to the screen
import { useEffect, useMemo, useRef, useState } from "react";
import { PresetInput, PRESETS } from "@/library/signal";
import SignalSourcePreset, {ButtonToggle, TextBoxSliders, SignalSourceSelection, TSliders} from "@/components/ControlPanelSource"
import SignalPlot, {makeStemTraces} from "@/components/SignalPlot";
import CustomExpressionInput from "@/components/CustomExpressionInput";
import {buildExpressionEvaluator,validateExpression} from "@/library/customExpression";
import DrawSignalControls from "@/components/DrawSignalControls";
import DrawSignalPanel from "@/components/DrawSignalPanel";
import { InlineMath } from "react-katex";
import { getPresetValue, getDrawnValue } from "@/library/signalEvaluator";
import { createDefaultSignalState ,type SignalSource,} from "@/library/types";


export const gapBottom = 7

export const borderColor = "1px solid rgba(255,255,255,0.35)"
export const backgroundColor = "rgb(0, 0, 0)"

const defaultXSignal = createDefaultSignalState("rect");
const defaultHSignal = createDefaultSignalState("tri");

export default function ConvolutionPage() {
    type TimeMode = "continuous" | "discrete";

    // ===== time mode ===== isDiscrete default at continuous
    const [timeMode, setTimeMode] = useState<TimeMode>("continuous");
    const isDiscrete = timeMode === "discrete";

    // Responsive layout modes
    const [viewportWidth, setViewportWidth] = useState(1280);
    const isMobile = viewportWidth < 600;
    const isTablet = viewportWidth >= 600 && viewportWidth < 1100;
    const isMobileM = viewportWidth < 1400;
    const useScrollableLayout = viewportWidth < 1100;

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
    const WidthMinC = 0.2, WidthMaxC = 3, WidthStepC = 0.01;
    const WidthMinD = 1, WidthMaxD = 20, WidthStepD = 1;

    // ===== set width range according to mode =====
    const WidthMin = isDiscrete ? WidthMinD : WidthMinC;
    const WidthMax = isDiscrete ? WidthMaxD : WidthMaxC;
    const WidthStep = isDiscrete ? WidthStepD : WidthStepC;

    // ===== Amplitude range ====
    const AmpMin = -10, AmpMax = 10, AmpStep = 0.01;

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
        return buildExpressionEvaluator(xExpr);
    }, [xExpr, xSource, xExprCheck]);

    
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
        return buildExpressionEvaluator(hExpr);
    }, [hExpr, hSource, hExprCheck]);

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
    }}, [isDiscrete]);

    // ==== screen height ====
    // set inital value 
    const [vh, setVh] = useState<number>(800);
    // ref measured heights
    const headerRef = useRef<HTMLDivElement | null>(null);
    const controlsRef = useRef<HTMLDivElement | null>(null);

    const [headerH, setHeaderH] = useState(0);
    const [controlsH, setControlsH] = useState(0);

    // wait until browser is ready and get real browser height
    useEffect(() => {
        const update = () => setVh(window.innerHeight);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    useEffect(() => {
        const headerEl = headerRef.current;
        const controlsEl = controlsRef.current;
        if (!headerEl || !controlsEl) return;

        const update = () => {
            setHeaderH(headerEl.getBoundingClientRect().height);
            setControlsH(controlsEl.getBoundingClientRect().height);
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(headerEl);
        ro.observe(controlsEl);
        return () => ro.disconnect();
    }, []);

    // ==== Signal Plot Height ====
    const bottomSafeHeight = 46;
    const remainingHeight = vh - headerH - controlsH - gapBottom * 2 - bottomSafeHeight;
    const availableHeight = Math.max(240, remainingHeight); //use highest value
    const signalPlotHeight = isMobile
        ? 330
        : isTablet
          ? 350
          : Math.floor((availableHeight - gapBottom) / 2);

    // samplePointmultiplier
    const spm = 1
    const spmfix = spm - 1
    //tau = array that consist x-axis position of 1400 points; top plot; 1400 to have a better intergral approx
	//tAxis = array that consist x-axis position of 700 points; bottom plot
    //dt = spacing between tau samples in CT
	//tMin, tMax = output/slider range
	//reference: y(t) = ∫ x(τ) h(t-τ) dτ; y[n] = Σ x[k] h[n-k]
    const { tau, tAxis, dt, tMin, tMax } = useMemo(() => {
    if (!isDiscrete) {
        if (xSource === "expression" || hSource === "expression") {
            const domain = 30;
            const tau = Array.from({ length: 1400 * spm }, (_, i) =>
                -domain + (2 * domain * i) / (1399 * spm + spmfix)
            );
            const tAxis = Array.from({ length: 700 * spm }, (_, i) =>
                -domain + (2 * domain * i) / (699 * spm + spmfix)
            );
            const dt = tau[1] - tau[0];
            return { tau, tAxis, dt, tMin: -domain, tMax: domain };
        }
        const base = 2;
        const scale = Math.max(1, xWidth + hWidth + 0.5);
        const domain = base * scale;
        // Creates 1400 evenly spaced points from -domain to +domain
        const tau = Array.from({ length: 1400 * spm }, (_, i) => -domain + (2 * domain * i) / (1399 * spm + spmfix));
        const tAxis = Array.from({ length: 700 * spm }, (_, i) => -domain + (2 * domain * i) / (699 * spm + spmfix));
        // sample step
        const dt = tau[1] - tau[0];
        return { tau, tAxis, dt, tMin: -domain, tMax: domain };
    }
        if (xSource === "expression" || hSource === "expression") {
            const nMax = 60;

            const tau = Array.from({ length: 2 * nMax + 1 }, (_, i) => i - nMax);
            const tAxis = Array.from({ length: 2 * nMax + 1 }, (_, i) => i - nMax);

            return { tau, tAxis, dt: 1, tMin: -nMax, tMax: nMax };
        }
        const WxR = Math.round(xWidth);
        const WhR = Math.round(hWidth);
        const nMax = Math.max(40, WxR + WhR + 6);
        // Creates min 12 * 2  + 1 evenly spaced points
        const tau = Array.from({ length: 2 * nMax + 1 }, (_, i) => i - nMax);
        const tAxis = Array.from({ length: 2 * nMax + 1 }, (_, i) => i - nMax);
    
        return { tau, tAxis, dt: 1, tMin: -nMax, tMax: nMax };
    }, [isDiscrete, xSource, hSource, xWidth, hWidth]);

    // Current t slider position/value
    const [t0, setT0] = useState<number>(-2.5);

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

    const AxMin = -10, AxMax = 10, AxStep = 0.01;
    const AhMin = -10, AhMax = 10, AhStep = 0.01;

    useEffect(() => {
        setXDrawn((prev) => (prev.length === tau.length ? prev : Array(tau.length).fill(0)));
        setHDrawn((prev) => (prev.length === tau.length ? prev : Array(tau.length).fill(0)));
    }, [tau]);

    function evaluateXSignal(inputX: number): number {
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
    }

    function evaluateHSignal(inputX: number): number {
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
    }

    // create y-axis point; original unshifted signals; 
    // CT: x(t0) ; DT: x[n0]
    // tau = x-positions; xSamples = y-values of x at those positions; hSamples = y-values of h at those positions
    const xSamples = useMemo(() => {
        return tau.map((v) => evaluateXSignal(v));
    }, [tau, xSource, xInput, xWidth, xAmp, xExpr, xExprFn, xDrawn, Ax]);

    // CT: h(t0) ; DT: h[n0] It does not depend on t0, so moving the slider does nothing to it.
    const hSamples = useMemo(() => {
        return tau.map((v) => evaluateHSignal(v));
    }, [tau, hSource, hInput, hWidth, hAmp, hExpr, hExprFn,hDrawn, Ah]);

    // CT: h(t0 - τ) ; DT: h[n0 - k]
    const hFlippedSamples = useMemo(() => {
        return tau.map((v) => evaluateHSignal(t0 - v));
    }, [tau, t0, hSource, hInput, hWidth, hAmp, hExpr, hExprFn, hDrawn, Ah]);

    // 
    const hShiftedNotFlippedSamples = useMemo(() => {
        return tau.map((v) => evaluateHSignal(v - t0));
    }, [tau, t0, hSource, hInput, hWidth, hAmp, hExpr, hExprFn, hDrawn, Ah]);

    // h signal flipped state
    const [isHFlipped, setIsHFlipped] = useState(false);

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
        if (!isDiscrete) {
            return tAxis.map((t) => {
                let sum = 0;
                
                //xVal * hVal = product height at one sampled point
                //sum = total of all sampled heights
                //sum * dt = approximate area under the product curve
                for (let i = 0; i < tau.length; i++) {
                    const tauVal = tau[i];
                    const xVal = evaluateXSignal(tauVal);

                    const hVal = isHFlipped
                        ? evaluateHSignal(t - tauVal)  // convolution
                        : evaluateHSignal(tauVal - t);  // unflipped shifted

                    sum += xVal * hVal;
                }
                // Multiply by dt to convert the sampled sum into an approximation of the continuous integral.
                return sum * dt;
            });
        }

        return tAxis.map((n) => {
            let sum = 0;
            for (let i = 0; i < tau.length; i++) {
            const k = tau[i];
            const xVal = evaluateXSignal(k);

            const hVal = isHFlipped
                ? evaluateHSignal(n - k)    // convolution
                : evaluateHSignal(k - n);  // unflipped shifted
            sum += xVal * hVal;
        }
            return sum;
        });
    }, [isDiscrete, isHFlipped, tAxis, tau, dt, xInput, xWidth, xAmp, hInput, hWidth, hAmp, xExprFn, hExprFn,xSource,hSource,xDrawn,hDrawn,Ax,Ah,]);

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

    // plot data
    const inputTraces = useMemo(() => {
    if (isDiscrete) {
        return [
        ...makeStemTraces(tau, xSamples, xDisplayLabel, "rgba(34,197,94,0.95)"),
        ...makeStemTraces(tau, hDisplaySamples, hDisplayLabel, "rgba(249,115,22,0.95)"),
        {
                x: tau,
                y: productSamples,
                type: isDiscrete ? "bar" : "scatter",
                mode: isDiscrete ? "" : "lines",
                name: xDisplayLabel + "·" + hDisplayLabel,
                marker: {color: "rgba(255,0,0,0.25)"},
                fill : "tozeroy",
                fillcolor: "rgba(255,0,0,0.25)",
                //hoverinfo: "skip",
        },
        
        ];
    }

    return [
        {
            x: tau,
            y: xSamples,
            type: "scatter",
            mode: "lines",
            name: xDisplayLabel,
            marker: {color: "rgba(34,197,94,0.95)"},
        },
        {
            x: tau,
            y: hDisplaySamples,
            type: "scatter",
            mode: "lines",
            name: hDisplayLabel,
            marker: { color: "rgba(249,115,22,0.95)" },
        },
        {
            x: tau,
            y: productSamples,
            type: "scatter",
            mode: "lines",
            name: xDisplayLabel + "·" + hDisplayLabel,
            marker: {color: "rgba(255,0,0,0.25)"},
            fill : "tozeroy",
            fillcolor: "rgba(255,0,0,0.25)",
            hoverinfo: "skip",
        },
    ];
    }, [tau, xSamples, hDisplaySamples, productSamples, isDiscrete, isHFlipped]);

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
                ...makeStemTraces(tAxis, yReveal, "y[n]", "rgba(53, 53, 254, 0.95)"),
                {
                    x: [t0],
                    y: [yAtT0],
                    type: "scatter",
                    mode: "markers",
                    name: "current y[n]",
                    marker: { color: "rgba(220,38,38,0.95)", size: 9 },
                },
                {
                    x: [t0, t0],
                    y: [outYMin, outYMax],
                    type: "scatter",
                    mode: "lines",
                    name: "current n",
                    line: { color: "rgba(220,38,38,0.85)", width: 2, dash: "dot" },
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
                line: { color: "rgba(37,99,235,0.95)", width: 3 },
            },
            {
                x: [t0],
                y: [yAtT0],
                type: "scatter",
                mode: "markers",
                name: "current y(t)",
                marker: { color: "rgba(220,38,38,0.95)", size: 9 },
            },
            {
                x: [t0, t0],
                y: [outYMin, outYMax],
                type: "scatter",
                mode: "lines",
                name: "current t",
                line: { color: "rgba(220,38,38,0.85)", width: 2, dash: "dot" },
                hoverinfo: "skip",
            },
        ];
    }, [isDiscrete, tAxis, ySamples, yReveal, t0, yAtT0, outYMin, outYMax]);

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
            setT0(isDiscrete ? -2 : -2.5);
        }

        if (xSource === "expression") {
            setXExpr("");
            setT0(isDiscrete ? -15 : -15);
        }
    }, [xSource, isDiscrete]);

    useEffect(() => {
        if (hSource === "preset") {
            setHWidth(1);
            setHAmp(1);
            setHInput("tri");
            setHWidthText(isDiscrete ? "1" : "1.00");
            setHAmpText("1.00");
            setT0(isDiscrete ? -2 : -2.5);
        }

        if (hSource === "expression") {
            setHExpr("");
            setT0(isDiscrete ? -15 : -15);
        }
    }, [hSource, isDiscrete]);

    const modalH = Math.min(0.92 * vh, 760);
    const drawCanvasH = Math.max(260, Math.floor(modalH - 120));

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
    <main
        style={{
        minHeight: "100vh",
        height: useScrollableLayout ? "auto" : "100vh",
        padding: isMobile ? "8px 6px 28px" : "10px 12px 40px",
        boxSizing: "border-box",
        overflow: useScrollableLayout ? "auto" : "hidden",
        color: "#ffffff",
        background: backgroundColor,
        fontSize: isMobile ? "0.9rem" : "1rem"
        }}
    >
        
    {/* Header; 3 column; 1fr at back to center title */}
    <div ref={headerRef} style={{ display: "grid", gridTemplateColumns: isMobile ? "auto 1fr" : "1fr auto 1fr", alignItems: "center", marginBottom: gapBottom}}>
        {/* Back Link */}
        <div>
            <Link
                href="/"
                style = {{
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
        {/* Title */}
        <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 750, margin: 0, justifySelf: "center",}}>
            Convolution
        </h1>
    </div>
    {/* End of header */}

    {/* Control Panel */}
    <div
        ref={controlsRef}
        style={{
            border: borderColor,
            borderRadius: 12,
            padding: 10,
            boxSizing: "border-box",
            marginBottom: gapBottom,
            background: "rgba(0,0,0,0.12)",
            }}
    >
        {/* Time Mode Buttons */}
        <div
            style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: gapBottom,
            }}
        >
            <ButtonToggle label="Continuous-time" active={!isDiscrete} onClick={() => setTimeMode("continuous")} />
            <ButtonToggle label="Discrete-time" active={isDiscrete} onClick={() => setTimeMode("discrete")} />
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginLeft: isMobile ? 0 : "auto",
                    flexBasis: isMobile ? "100%" : "auto",
                    fontWeight: 800,
                }}
            >
                <span>Convolution kernel:</span>
                <ButtonToggle
                    label={isHFlipped ? "h flipped ✓" : "Flip h"}
                    active={isHFlipped}
                    onClick={() => setIsHFlipped((previous) => !previous)}
                />
            </div>
        </div>

        {/* X and H Panels */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:12}}>
            {/* X Panel */}
            <div>
                <SignalSourceSelection
                    signalName="x"
                    varLetter={varLetter}
                    source={xSource}    
                    setSource={setXSource}
                    gapBottom={gapBottom}
                />
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
            </div>
            {/* End of X Panel */}
            {/* H Panel */}
            <div>
                <SignalSourceSelection
                    signalName="h"
                    varLetter={varLetter}
                    source={hSource}    
                    setSource={setHSource}
                    gapBottom={gapBottom}
                />
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
            </div>
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

    </main>
    );
}
