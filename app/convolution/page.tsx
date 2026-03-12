"use client";

import Link from "next/link";
// useState - returns an array with two elements: the current state value and a function to update that value
// useMemo - It runs the function only when one of its dependencies changes, otherwise, it reuses the last calculated
// useRef - It returns a mutable object with a single current property, which you can read from and write to directly
// useEffect - It runs the provided function after the component has rendered and committed to the screen
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PresetInput, PRESETS } from "@/library/signal";
import SignalSourcePreset, {SourceMode, ButtonToggle, TextBoxSliders, SignalSourceSelection} from "@/components/ControlPanelSource"
import SignalPlot from "@/components/SignalPlot";


export const gapBottom = 10

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
                />
                {xSource === "preset" && (
                    <>
                        {/* x preset drop down selection */}
                        <SignalSourcePreset
                            signalName="x"
                            varLetter={varLetter}
                            selectedPreset={xInput}
                            setSelectedPreset={setXInput}
                            presets={PRESETS}
                            gapBottom={gapBottom}
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
                />
                {hSource === "preset" && (
                <>
                    {/* h preset drop down selection */}
                    <SignalSourcePreset
                        signalName="h"
                        varLetter={varLetter}
                        selectedPreset={hInput}
                        setSelectedPreset={setHInput}
                        presets={PRESETS}
                        gapBottom={gapBottom}
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
                    />
                </>)}
            </div>
            {/* End of H Panel */}
        </div>
    </div>
    {/* End of Control Panel */}

    {/* Signal Plot input X and H overlap */}
    <div style={{marginBottom: gapBottom}}>
        <SignalPlot
            title={"test 1"}
            height={signalPlotHeight}
            traces={[1000]}
        />

        
    </div>
    {/* End of Signal Plot input X and H overlap */}
        
    {/* Signal Plot output convolution */}
    <div>
        <SignalPlot
            title={"test 2"}
            height={signalPlotHeight}
            traces={[1000]}
        />
    </div>
    {/* End of Signal Plot output convolution */}
    </main>
    );
}