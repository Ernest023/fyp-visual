import { PRESETS, PresetInput } from "./signal";

// evaluate the chosen preset signal at that x-value
export function getPresetValue(
    presetId: PresetInput,
    inputX: number,
    width: number,
    amplitude: number,
    isDiscrete: boolean
): number {
    const safeWidth = Math.abs(width) < Number.EPSILON ? 1 : width;
    // DT sine uses different formula due to signal lib setup
    if (presetId === "sine") {
        if (isDiscrete) {
            return amplitude * Math.sin((Math.PI / 4) * inputX);
        }
        return amplitude * Math.sin(2 * Math.PI * (inputX / safeWidth));
    }
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return 0;

    // width scales horizontally, amplitude scales vertically
    return amplitude * preset.fn(inputX / safeWidth);
}