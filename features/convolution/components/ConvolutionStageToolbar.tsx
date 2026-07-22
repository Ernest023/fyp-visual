import { ButtonToggle } from "@/components/controls/ControlPanelSource";

export type TimeMode = "continuous" | "discrete";

// Controls the convolution stage without owning any signal calculation state.
export default function ConvolutionStageToolbar({
    timeMode,
    setTimeMode,
    isHFlipped,
    setIsHFlipped,
    isMobile,
    gapBottom,
}: {
    timeMode: TimeMode;
    setTimeMode: (mode: TimeMode) => void;
    isHFlipped: boolean;
    setIsHFlipped: (flipped: boolean) => void;
    isMobile: boolean;
    gapBottom: number;
}) {
    return (
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: gapBottom }}>
            <ButtonToggle label="Continuous-time" active={timeMode === "continuous"} onClick={() => setTimeMode("continuous")} />
            <ButtonToggle label="Discrete-time" active={timeMode === "discrete"} onClick={() => setTimeMode("discrete")} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: isMobile ? 0 : "auto", flexBasis: isMobile ? "100%" : "auto", fontWeight: 800 }}>
                <span>Convolution kernel:</span>
                <ButtonToggle
                    label={isHFlipped ? "h flipped ✓" : "Flip h"}
                    active={isHFlipped}
                    onClick={() => setIsHFlipped(!isHFlipped)}
                />
            </div>
        </div>
    );
}
