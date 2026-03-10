"use client";

import { PresetInput } from "@/library/signal";
import { borderColor } from "@/app/convolution/page";

export type SourceMode = "preset" | "expression" | "draw";

type PresetOption = {
    id: PresetInput;
    label: string;
    fn: (t: number) => number;
};

type SignalSourcePanelProps = {
    signalName: string;
    varLetter: string;
    source: SourceMode;
    setSource: React.Dispatch<React.SetStateAction<SourceMode>>;
    selectedPreset: PresetInput;
    setSelectedPreset: React.Dispatch<React.SetStateAction<PresetInput>>;
    presets: PresetOption[];
    gapBottom: number;
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

export default function SignalSourcePanel({
  signalName,
  varLetter,
  source,
  setSource,
  selectedPreset,
  setSelectedPreset,
  presets,
  gapBottom,
}: SignalSourcePanelProps) {
  return (
    <div>
        <div style={{ fontWeight:850, display:"flex", alignItems:"center", gap:8, marginBottom:gapBottom}}>
            <span>{signalName}{varLetter} source:</span>
            <ButtonToggle label="Preset" active={source === "preset"} onClick={() => setSource("preset")}/>
            <ButtonToggle label="Expression" active={source === "expression"} onClick={() => setSource("expression")}/>
            <ButtonToggle label="Draw" active={source === "draw"} onClick={() => setSource("draw")}/>
        </div>


        {source === "preset" && (
            <label>{/* input */}
                <div>
                    {signalName}
                    {varLetter} preset
                </div>
                {/* dropdown */}
                <select 
                value={selectedPreset} 
                onChange={(e) => setSelectedPreset(e.target.value as PresetInput)} 
                style={{ width: "100%", height: 34, borderRadius: 10, background: "black", color: "white", border: borderColor}} >
                {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.id}
                    </option>
                ))}
                </select>
            </label>
        )}
    </div>
  );
}
