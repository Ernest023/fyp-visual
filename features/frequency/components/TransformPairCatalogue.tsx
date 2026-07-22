import type { PairMode, TransformPairConfig } from "@/features/frequency/types";
import { ButtonToggle } from "@/components/controls/ControlPanelSource";

// Renders the transform-pair catalogue independently from the page layout.
export default function TransformPairCatalogue({
    transformPairs,
    pairMode,
    setPairMode,
}: {
    transformPairs: Record<PairMode, TransformPairConfig>;
    pairMode: PairMode;
    setPairMode: (mode: PairMode) => void;
}) {
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(Object.keys(transformPairs) as PairMode[]).map((mode) => (
                <ButtonToggle
                    key={mode}
                    label={transformPairs[mode].label}
                    active={pairMode === mode}
                    onClick={() => setPairMode(mode)}
                />
            ))}
        </div>
    );
}
