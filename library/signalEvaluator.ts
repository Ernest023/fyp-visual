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

export function getDrawnValue(
  inputX: number,
  axis: number[],
  drawnSamples: number[]
): number {
  if (axis.length === 0 || drawnSamples.length === 0) {
    return 0;
  }

  if (axis.length === 1) {
    return drawnSamples[0] ?? 0;
  }

  const step = axis[1] - axis[0];

  if (Math.abs(step) < Number.EPSILON) {
    return drawnSamples[0] ?? 0;
  }

  const index = Math.round(
    (inputX - axis[0]) / step
  );

  const clampedIndex = Math.max(
    0,
    Math.min(axis.length - 1, index)
  );

  return drawnSamples[clampedIndex] ?? 0;
}