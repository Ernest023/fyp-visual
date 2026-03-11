"use client";

import { PresetInput } from "@/library/signal";
import { borderColor, backgroundColor } from "@/app/convolution/page";

export type SourceMode = "preset" | "expression" | "draw";

type PresetOption = {
    id: PresetInput;
    label: string;
    fn: (t: number) => number;
};

type SignalSourcePresetProps = {
    signalName: string;
    varLetter: string;
    selectedPreset: PresetInput;
    setSelectedPreset: React.Dispatch<React.SetStateAction<PresetInput>>;
    presets: PresetOption[];
    gapBottom: number;
};

type SignalSourceSelectionProps = {
    signalName: string;
    varLetter: string;
    source: SourceMode;
    setSource: React.Dispatch<React.SetStateAction<SourceMode>>;
    gapBottom: number;
};

type TextBoxSlidersProps = {
    signalName: string;
    varLetter: string;
    strWidthAmp: string;
    isDiscrete: boolean;
    roundOnDiscrete: boolean;
    minRange: number;
    maxRange: number;
    stepRange: number;
    widthValue: number;
    setWidthValue: React.Dispatch<React.SetStateAction<number>>;
    widthText: string;
    setWidthText: React.Dispatch<React.SetStateAction<string>>;
};

export function ButtonToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void;}) {
  return (
    <button
        onClick={onClick}
        style={{
            height: 30,
            padding: "0 10px",
            borderRadius: 10,
            border: borderColor,
            background: active ? "rgba(255,255,255,0.12)" : "transparent",
            color: "white",
            fontWeight: 800,
            cursor: "pointer",
            whiteSpace: "nowrap",
            }}>
      {label}
    </button>
  );
}

export function TextBoxSliders({
    signalName, 
    varLetter, 
    strWidthAmp, 
    isDiscrete,
    roundOnDiscrete, 
    minRange, 
    maxRange, 
    stepRange,
    widthValue,
    setWidthValue,
    widthText,
    setWidthText,
    }:
    TextBoxSlidersProps){
    return (
        <div>
            <div style={ {fontWeight: 650, fontSize:11, opacity:0.95, display: "flex", gap: 8, alignItems: "center" } }>
                <span>{signalName}{varLetter} {strWidthAmp}:</span>
                {/* input text box */}
                <input 
                    type="text"
                    inputMode={isDiscrete && roundOnDiscrete ? "numeric" : "decimal"}
                    style={{
                        border:borderColor, 
                        height: 22, 
                        width: 72, 
                        borderRadius: 6,
                        outline: "none",
                        fontSize: 12,
                        fontFamily: "monospace",
                        padding: "0 6px",
                        color: "white",
                        background: backgroundColor
                    }}
                    value={widthText}
                    onChange={(e) => {
                        const s = e.target.value;
                        setWidthText(s);

                        const v = parseFloat(s);
                        if (!Number.isNaN(v)) {
                            setWidthValue(v);
                        }
                        
                    }}
                    onBlur={() => {
                        const v = parseFloat(widthText);

                        if (Number.isNaN(v)) {
                            setWidthText(isDiscrete && roundOnDiscrete ? String(widthValue) : widthValue.toFixed(2));
                            return;
                        }

                        let vv = v;
                        if (vv < minRange) vv = minRange;
                        if (vv > maxRange) vv = maxRange;
                        if (isDiscrete && roundOnDiscrete) vv = Math.round(vv);
                        // update slider bar also
                        setWidthValue(vv);
                        setWidthText(isDiscrete && roundOnDiscrete ? String(vv) : vv.toFixed(2));
                    }}
                    
                />                        
            </div>
            {/* Sliders bar*/}
            <input
                type="range"
                style={{ width: "100%", height: 14 }}
                min={minRange}
                max={maxRange}
                step={isDiscrete ? 1 : stepRange}
                value={widthValue}
                onChange={(e) => {
                    let v = parseFloat(e.target.value);
                    if (isDiscrete && roundOnDiscrete) v = Math.round(v);
                    setWidthValue(v);
                    // real time update of text box
                    setWidthText(isDiscrete && roundOnDiscrete ? String(v) : v.toFixed(2));
                }}
            />
        </div>
    );
}

export function SignalSourceSelection({
    signalName,
    varLetter,
    source,
    setSource,
    gapBottom
    }: 
    SignalSourceSelectionProps) {
    return (
        <div style={{ fontWeight:850, display:"flex", alignItems:"center", gap:8, marginBottom:gapBottom}}>
            <span>{signalName}{varLetter} source:</span>
            <ButtonToggle label="Preset" active={source === "preset"} onClick={() => setSource("preset")}/>
            <ButtonToggle label="Expression" active={source === "expression"} onClick={() => setSource("expression")}/>
            <ButtonToggle label="Draw" active={source === "draw"} onClick={() => setSource("draw")}/>
        </div>
    );  
}


export default function SignalSourcePreset({
    signalName,
    varLetter,
    selectedPreset,
    setSelectedPreset,
    presets,
    gapBottom
    }: 
    SignalSourcePresetProps) {
    return (
        <div>
            {/* dropdown list input */}
            <label>{/* input */}
                <div>
                    {signalName}
                    {varLetter} preset
                </div>
                {/* dropdown */}
                <select 
                value={selectedPreset} 
                onChange={(e) => setSelectedPreset(e.target.value as PresetInput)} 
                style={{ width: "100%", height: 34, borderRadius: 10, background: "black", color: "white", border: borderColor, marginBottom: gapBottom}} >
                {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.id}
                    </option>
                ))}
                </select>
            </label> 
        </div>
    );  
}
