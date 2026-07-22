import type { PairMode } from "@/features/frequency/types";

// Static catalogue metadata used by the transform-pair controls.
export const pairParameterLabel: Record<PairMode, string> = {
    "rect-to-sinc": "Width T",
    "sinc-to-rect": "Width T",
    triangle: "Width T",
    "exp-right": "Decay Constant a",
    "exp-left": "Decay Constant a",
    "double-exp": "Decay Constant a",
    cosine: "Frequency f₀",
    sine: "Frequency f₀",
    "complex-exp": "Frequency f₀",
    "impulse-train": "Period T₀",
    delta: "Parameter",
    constant: "Parameter",
    step: "Parameter",
};

export const showParameterSlider: Record<PairMode, boolean> = {
    "rect-to-sinc": true,
    "sinc-to-rect": true,
    triangle: true,
    "exp-right": true,
    "exp-left": true,
    "double-exp": true,
    cosine: true,
    sine: true,
    "complex-exp": true,
    "impulse-train": true,
    delta: false,
    constant: false,
    step: false,
};

// Select a domain large enough to show the important support or decay of the
// current pair. The limits remain symmetric so the time/frequency relationship
// stays easy to compare.
export function getTransformPairDomains(pairMode: PairMode, parameter: number) {
    const safeParameter = Math.max(parameter, 0.001);
    let timeLimit = 6;
    let frequencyLimit = 10;

    if (["exp-right", "exp-left", "double-exp"].includes(pairMode)) {
        timeLimit = Math.max(timeLimit, 6 / safeParameter);
        frequencyLimit = Math.max(frequencyLimit, safeParameter * 2.5);
    } else if (["rect-to-sinc", "triangle", "sinc-to-rect"].includes(pairMode)) {
        timeLimit = Math.max(timeLimit, safeParameter * 0.75);
        frequencyLimit = Math.max(frequencyLimit, 5 / safeParameter);
    } else if (pairMode === "impulse-train") {
        timeLimit = Math.max(timeLimit, safeParameter * 2.5);
        frequencyLimit = Math.max(frequencyLimit, 4 / safeParameter);
    } else if (["cosine", "sine", "complex-exp"].includes(pairMode)) {
        frequencyLimit = Math.max(frequencyLimit, safeParameter + 2);
    }

    return { timeLimit, frequencyLimit };
}
