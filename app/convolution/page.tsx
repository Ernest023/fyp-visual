"use client";

import Link from "next/link";
// useState - returns an array with two elements: the current state value and a function to update that value
// useMemo - It runs the function only when one of its dependencies changes, otherwise, it reuses the last calculated
// useRef - It returns a mutable object with a single current property, which you can read from and write to directly
// useEffect - It runs the provided function after the component has rendered and committed to the screen
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PresetInput, PRESETS } from "@/library/signal";
import SignalSourcePreset, {SourceMode, ButtonToggle, TextBoxSliders, SignalSourceSelection, TSliders} from "@/components/ControlPanelSource"
import SignalPlot, {makeStemTraces} from "@/components/SignalPlot";


export const gapBottom = 7

export const borderColor = "1px solid rgba(255,255,255,0.35)"
export const backgroundColor = "1px solid rgba(0,0,0,0.25)"

export default function ConvolutionPage() {
    type TimeMode = "continuous" | "discrete";

    // ===== time mode ===== isDiscrete default at continuous
    const [timeMode, setTimeMode] = useState<TimeMode>("continuous");
    const isDiscrete = timeMode === "discrete";

    // X and H Panel source Letters
    const varLetter = isDiscrete ? "[n]" : "[t]";

    // ===== x source + h source ===== sources is default at preset
    const [xSource, setXSource] = useState<SourceMode>("preset");
    const [hSource, setHSource] = useState<SourceMode>("preset");

    // ===== presets =====
    const [xInput, setXInput] = useState<PresetInput>("rect");
    const [hInput, setHInput] = useState<PresetInput>("tri");

    // ===== widths (For preset only) =====
    const [xWidth, setxWidth] = useState<number>(1);
    const [hWidth, sethWidth] = useState<number>(1);

    // ===== amplitude (For preset only) =====
    const [xAmp, setxAmp] = useState<number>(1);
    const [hAmp, sethAmp] = useState<number>(1);

    // ===== width range ====
    const WidthMinC = 0.2, WidthMaxC = 3, WidthStepC = 0.01;
    const WidthMinD = 0, WidthMaxD = 20, WidthStepD = 1;

    // ===== set width range according to mode =====
    const WidthMin = isDiscrete ? WidthMinD : WidthMinC;
    const WidthMax = isDiscrete ? WidthMaxD : WidthMaxC;
    const WidthStep = isDiscrete ? WidthStepD : WidthStepC;

    // ===== Amplitude range ====
    const AmpMin = -10, AmpMax = 10, AmpStep = 0.01;

    // ===== Text box =====
    const [xWidthText, setxWidthText] = useState<string>(isDiscrete ? String(Math.round(xWidth)) : xWidth.toFixed(2));
    const [hWidthText, sethWidthText] = useState<string>(isDiscrete ? String(Math.round(hWidth)) : hWidth.toFixed(2));
    const [xAmpText, setxAmpText] = useState<string>(xAmp.toFixed(2))
    const [hAmpText, sethAmpText] = useState<string>(hAmp.toFixed(2))

    // Handle rounding of int when switching between CT and DT 
    useEffect(() => {
    if (isDiscrete) {
        const newXWidth = Math.round(xWidth);
        const newHWidth = Math.round(hWidth);

        setxWidth(newXWidth);
        sethWidth(newHWidth);

        setxWidthText(String(newXWidth));
        sethWidthText(String(newHWidth));
    } else {
        setxWidthText(xWidth.toFixed(2));
        sethWidthText(hWidth.toFixed(2));
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
    const signalPlotHeight = Math.floor((availableHeight - gapBottom) / 2 );

    // evaluate the chosen preset signal at that x-value
    function getPresetValue(
        presetId: PresetInput,
        inputX: number,
        width: number,
        amplitude: number
    ): number {
        const preset = PRESETS.find((p) => p.id === presetId);
        if (!preset) return 0;

        // width scales horizontally, amplitude scales vertically
        return amplitude * preset.fn(inputX / width);
    }

    // samplePointmultiplier
    const spm = 1
    const spmfix = spm - 1
    //tau = internal variable for convolution
	//tAxis = output x-axis values
    //dt = spacing between tau samples in CT
	//tMin, tMax = output/slider range
	//reference: y(t) = ∫ x(τ) h(t-τ) dτ; y[n] = Σ x[k] h[n-k]
    const { tau, tAxis, dt, tMin, tMax } = useMemo(() => {
    if (!isDiscrete) {
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

        const WxR = Math.round(xWidth);
        const WhR = Math.round(hWidth);
        const nMax = Math.max(12, WxR + WhR + 6);
        // Creates min 12 * 2  + 1 evenly spaced points
        const tau = Array.from({ length: 2 * nMax + 1 }, (_, i) => i - nMax);
        const tAxis = Array.from({ length: 2 * nMax + 1 }, (_, i) => i - nMax);
    
        return { tau, tAxis, dt: 1, tMin: -nMax, tMax: nMax };
    }, [isDiscrete, xWidth, hWidth]);

    // Current t slider position/value
    const [t0, setT0] = useState<number>(0);

    useEffect(() => {
    setT0((prev) => Math.max(tMin, Math.min(tMax, prev)));
    }, [tMin, tMax]);

    // create y-axis point; original unshifted signals; 
    // CT: x(t0) ; DT: x[n0]
    // tau = x-positions; xSamples = y-values of x at those positions; hSamples = y-values of h at those positions
    const xSamples = useMemo(() => {
    return tau.map((v) => getPresetValue(xInput, v, xWidth, xAmp));
    }, [tau, xInput, xWidth, xAmp]);

    // CT: h(t0) ; DT: h[n0] It does not depend on t0, so moving the slider does nothing to it.
    const hSamples = useMemo(() => {
    return tau.map((v) => getPresetValue(hInput, v, hWidth, hAmp));
    }, [tau, hInput, hWidth, hAmp]);

    // CT: h(t0 - τ) ; DT: h[n0 - k]
    const hFlippedSamples = useMemo(() => {
    return tau.map((v) => getPresetValue(hInput, t0 - v, hWidth, hAmp));
    }, [tau, hInput, hWidth, hAmp, t0]);

    // 
    const hShiftedNotFlippedSamples = useMemo(() => {
        return tau.map((v) => getPresetValue(hInput, v - t0, hWidth, hAmp));
    }, [tau, hInput, hWidth, hAmp, t0]);

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
                const xVal = getPresetValue(xInput, tauVal, xWidth, xAmp);

                const hVal = isHFlipped
                    ? getPresetValue(hInput, t - tauVal, hWidth, hAmp)   // convolution
                    : getPresetValue(hInput, tauVal - t, hWidth, hAmp);  // unflipped shifted

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
            const xVal = getPresetValue(xInput, k, xWidth, xAmp);

            const hVal = isHFlipped
                ? getPresetValue(hInput, n - k, hWidth, hAmp)   // convolution
                : getPresetValue(hInput, k - n, hWidth, hAmp);  // unflipped shifted
            sum += xVal * hVal;
        }
            return sum;
        });
    }, [isDiscrete, isHFlipped, tAxis, tau, dt, xInput, xWidth, xAmp, hInput, hWidth, hAmp]);

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


    // plot data
    const inputTraces = useMemo(() => {
    if (isDiscrete) {
        return [
        ...makeStemTraces(tau, xSamples, "x[k]", "rgba(34,197,94,0.95)"),
        ...makeStemTraces(tau, hDisplaySamples, isHFlipped ? "h[n-k]" : "h[n]", "rgba(249,115,22,0.95)"),
        {
                x: tau,
                y: productSamples,
                type: isDiscrete ? "bar" : "scatter",
                mode: isDiscrete ? "" : "lines",
                name: isDiscrete ? "x[k]h[n-k]" : "x(τ)h(t-τ)",
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
            name: "x(τ)",
            marker: {color: "rgba(34,197,94,0.95)"},
        },
        {
            x: tau,
            y: hDisplaySamples,
            type: "scatter",
            mode: "lines",
            name: isHFlipped ? "h(t-τ)" : "h(t)",
            marker: { color: "rgba(249,115,22,0.95)" },
        },
        {
            x: tau,
            y: productSamples,
            type: "scatter",
            mode: "lines",
            name: "x(τ)h(t-τ)",
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

    const hDisplayLabel = isDiscrete ? (isHFlipped ? "h[n-k]" : "h[n]") : (isHFlipped ? "h(t-τ)" : "h(t)");
    const xDisplayLabel = isDiscrete ? "x[n]" : "x(t)";

    const xInputExpr = isDiscrete ? "n" : "t";
    const hInputExpr = isDiscrete ? (isHFlipped ? "n-k" : "n") : (isHFlipped ? "t-τ" : "t");


    return (
    <main
        style={{
        height: "100vh",
        padding: "10px 12px 40px 12px",
        boxSizing: "border-box",
        overflow: "hidden",
        backgroundColor: backgroundColor,
        color: "#ffffff",
        }}
    >

    {/* Header; 3 column; 1fr at back to center title */}
    <div ref={headerRef} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: gapBottom}}>
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
        <h1 style={{ fontSize: 22, fontWeight: 750, margin: 0, justifySelf:"center"}}>Convolution Canvas (Interactive)</h1>
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
        <div style={{ display: "flex", gap: 8, marginBottom: gapBottom}}>
            <ButtonToggle label="Continuous-time" active={!isDiscrete} onClick={() => setTimeMode("continuous")} />
            <ButtonToggle label="Discrete-time" active={isDiscrete} onClick={() => setTimeMode("discrete")} />
        </div>

        {/* X and H Panels */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap:12}}>
            {/* X Panel */}
            <div>
                <SignalSourceSelection
                    signalName="x"
                    varLetter={varLetter}
                    source={xSource}    
                    setSource={setXSource}
                    gapBottom={gapBottom}
                    isHSignal={false}
                    isHFlipped={false}
                    // dummy value
                    setIsHFlipped={() => {}}
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
                            setWidthValue = {setxWidth}
                            widthText={xWidthText}
                            setWidthText={setxWidthText}
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
                            setWidthValue = {setxAmp}
                            widthText={xAmpText}
                            setWidthText={setxAmpText}
                        />
                    </>
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
                    isHSignal={true}
                    isHFlipped={isHFlipped}
                    setIsHFlipped={setIsHFlipped}
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
                        setWidthValue = {sethWidth}
                        widthText={hWidthText}
                        setWidthText={sethWidthText}
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
                        setWidthValue = {sethAmp}
                        widthText={hAmpText}
                        setWidthText={sethAmpText}
                        signalLabel={hDisplayLabel}
                    />
                </>)}
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
            title={ isDiscrete ? `Input: x[k] and ${isHFlipped ? "h[n-k]" : "h[n]"}`: `Input: x(t) and ${isHFlipped ? "h(t-τ)" : "h(t)"}`}
            height={signalPlotHeight}
            traces={inputTraces}
            xLabel={isDiscrete ? "k" : "τ"}
            yLabel={"Amplitude"}
            xRange={[xLo, xHi]}
        />

        
    </div>
    {/* End of Signal Plot input X and H overlap */}
        
    {/* Signal Plot output convolution */}
    <div>
        <SignalPlot
            title={isDiscrete ? 
                `Output: y[n] = Σ x[k] ${isHFlipped ? "h[n-k]" : "h[k-n]"}` : `Output: y(t) = ∫ x(τ) ${isHFlipped ? "h(t - τ)" : "h(τ - t)"} dτ`}
            height={signalPlotHeight}
            traces={outputTraces}
            xLabel={isDiscrete ? "n" : "t"}
            yLabel={"Amplitude"}
            xRange={[xLo, xHi]}
        />
    </div>
    {/* End of Signal Plot output convolution */}
    </main>
    );
}