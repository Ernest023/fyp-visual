"use client";

import { PresetInput } from "@/library/signal";
import { borderColor, backgroundColor } from "@/app/convolution/page";
import { InlineMath } from "react-katex";

export type SourceMode = "preset" | "expression" | "draw";

type PresetOption = {
    id: PresetInput;
    label: string;
    fn: (t: number) => number;
};

type SignalSourcePresetProps = {
    selectedPreset: PresetInput;
    setSelectedPreset: React.Dispatch<React.SetStateAction<PresetInput>>;
    presets: PresetOption[];
    gapBottom: number;
    amplitude: number;
    width: number;
    displaySignalLabel: string;
    inputExpr: string;
};

type SignalSourceSelectionProps = {
    signalName: string;
    varLetter: string;
    source: SourceMode;
    setSource: React.Dispatch<React.SetStateAction<SourceMode>>;
    gapBottom: number;
    isHSignal: boolean;
    isHFlipped: boolean;
    setIsHFlipped: React.Dispatch<React.SetStateAction<boolean>> | (() => void);
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
    signalLabel?: string;
};

type TSlidersProps = {
    tminRange: number;
    tmaxRange: number;
    tStepSize: number;
    tvalue: number;
    setTValue: React.Dispatch<React.SetStateAction<number>>;
    yValue: number;
    isDiscrete: boolean;
};

export function ButtonToggle({ label, active, onClick }: { label: React.ReactNode; active: boolean; onClick: () => void;}) {
  return (
    <button
        onClick={onClick}
        style={{
            height: 30,
            padding: "2px 10px 30px 10px",
            borderRadius: 10,
            border: borderColor,
            background: active ? "rgba(255, 255, 255, 0.25)" : "transparent",
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
    signalLabel
    }:
    TextBoxSlidersProps){
    return (
        <div>
            <div style={ {fontWeight: 650, fontSize:11, opacity:0.95, display: "flex", gap: 8, alignItems: "center",flexWrap: "wrap", } }>
                {/* if signallabel is undefine or null return right else return signallabel*/}
                <span>{signalLabel ?? `${signalName}${varLetter}`} {strWidthAmp}:</span>
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
                    // on Enter, do the same thing as blur
                    onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                    
                />
                <span> range: [ {minRange} , {maxRange} ]</span>                        
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

export function TSliders({
    tminRange,
    tmaxRange,
    tStepSize,
    tvalue,
    setTValue,
    yValue,
    isDiscrete,
}: TSlidersProps) {
    return (
        <div>
            <div style={{ fontWeight: 650, fontSize: 11, opacity: 0.95, display: "flex", gap: 8, alignItems: "center" }}>
                <span>
                    Slide {isDiscrete ? "n" : "t"}: {isDiscrete ? Math.round(tvalue) : tvalue.toFixed(2)}
                    {" | "}
                    {isDiscrete ? `overlap sum = ${yValue.toFixed(1)}` : `Area under the product curve = ${yValue.toFixed(4)}`}
                    {" | "} range: [{tminRange.toFixed(1)}, {tmaxRange.toFixed(1)}]
                </span>
            </div>

            <input
                type="range"
                style={{ width: "100%", height: 14 }}
                min={tminRange}
                max={tmaxRange}
                step={tStepSize}
                value={tvalue}
                onChange={(e) => setTValue(parseFloat(e.target.value))}
            />
        </div>
    );
}

export function SignalSourceSelection({
    signalName,
    varLetter,
    source,
    setSource,
    gapBottom,
    isHSignal,
    isHFlipped,
    setIsHFlipped,
    }: 
    SignalSourceSelectionProps) {
    return (
        <div style={{ fontWeight:850, display:"flex", alignItems:"center", gap:8, marginBottom:gapBottom, flexWrap: "wrap",}}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <InlineMath math={`${signalName}${varLetter}`} />
                <span>source:</span>
            </span>
            <ButtonToggle label="Preset" active={source === "preset"} onClick={() => setSource("preset")}/>
            <ButtonToggle label="Custom Expression" active={source === "expression"} onClick={() => setSource("expression")}/>
            <ButtonToggle label="Draw" active={source === "draw"} onClick={() => setSource("draw")}/>
            {isHSignal && (
                <>
                    <span>Flip h for convolution:</span>
                    <ButtonToggle label="Flip" active={isHFlipped} onClick={() => setIsHFlipped((prev: boolean) => !prev)}/>
                </>
            )}
        </div>
    );  
}

function formatPresetExpression(
    preset: PresetInput,
    amplitude: number,
    width: number,
    inputExpr: string
): string {
    const ampStr = amplitude === 1 ? "" : amplitude === -1 ? "-" : `${amplitude}`;
    // const scaledExpr = width === 1 ? inputExpr : `(${inputExpr})/${width}`;
    const scaledExpr = width === 1 ? inputExpr : `\\frac{${inputExpr}}{${width}}`;

    switch (preset) {
        case "rect":
            return `${ampStr}rect(${scaledExpr})`;

        case "tri":
            return `${ampStr}tri(${scaledExpr})`;

        case "step":
            return `${ampStr}u(${scaledExpr})`;

        case "ramp":
            return `${ampStr}ramp(${scaledExpr})`;

        case "sgn":
            return `${ampStr}sgn(${scaledExpr})`;

        case "sine":
            return `${ampStr}sin(2π·${scaledExpr})`;

        case "exp":
            return `${ampStr}e^{-2${scaledExpr}}u(${scaledExpr})`;

        case "imp":
            return `${ampStr}δ(${scaledExpr})`;

        default:
            return `${ampStr}${preset}(${scaledExpr})`;
    }
}

export default function SignalSourcePreset({
    selectedPreset,
    setSelectedPreset,
    presets,
    gapBottom,
    amplitude,
    width,
    displaySignalLabel,
    inputExpr,
    }: 
    SignalSourcePresetProps) {
        const presetText = formatPresetExpression(selectedPreset, amplitude, width, inputExpr);
        return (
            <div>
                {/* dropdown list input */}
                <label>{/* input */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                        <span>Preset:</span>
                        <InlineMath math={`${displaySignalLabel}=${presetText}`} />
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

export function ParameterSlider({
  label,
  value,
  setValue,
  text,
  setText,
  minRange,
  maxRange,
  stepRange,
  roundOnBlur = false,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
  text: string;
  setText: (text: string) => void;
  minRange: number;
  maxRange: number;
  stepRange: number;
  roundOnBlur?: boolean;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          fontWeight: 650,
          fontSize: 11,
          opacity: 0.95,
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 3,
        }}
      >
        <span>{label}:</span>

        <input
          type="text"
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            const s = e.target.value;
            setText(s);

            const v = parseFloat(s);
            if (!Number.isNaN(v)) {
              setValue(v);
            }
          }}
          onBlur={() => {
            const v = parseFloat(text);

            if (Number.isNaN(v)) {
              setText(value.toFixed(2));
              return;
            }

            let vv = v;

            if (vv < minRange) vv = minRange;
            if (vv > maxRange) vv = maxRange;

            if (roundOnBlur) {
              vv = Math.round(vv);
            }

            setValue(vv);
            setText(roundOnBlur ? String(vv) : vv.toFixed(2));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          style={{
            border: "1px solid rgba(255,255,255,0.35)",
            height: 22,
            width: 72,
            borderRadius: 6,
            outline: "none",
            fontSize: 12,
            fontFamily: "monospace",
            padding: "0 6px",
            color: "white",
            background: "black",
          }}
        />

        <span>
          [{minRange.toFixed(2)}, {maxRange.toFixed(2)}]
        </span>
      </div>

      <input
        type="range"
        style={{
          width: "100%",
          height: 14,
        }}
        min={minRange}
        max={maxRange}
        step={stepRange}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);

          setValue(v);
          setText(v.toFixed(2));
        }}
      />
    </div>
  );
}