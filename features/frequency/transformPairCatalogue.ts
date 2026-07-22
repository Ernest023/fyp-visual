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
