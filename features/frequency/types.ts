import type { ReactNode } from "react";
import type { Data } from "plotly.js";

// The two learning modes available in the frequency-domain laboratory.
export type PageMode = "sine-builder" | "transform-pair";

export type PairMode =
    | "exp-right"
    | "exp-left"
    | "double-exp"
    | "delta"
    | "constant"
    | "complex-exp"
    | "cosine"
    | "sine"
    | "step"
    | "rect-to-sinc"
    | "triangle"
    | "sinc-to-rect"
    | "impulse-train";

export type TransformPairConfig = {
    label: ReactNode;
    formula: string;
    timeTitle: ReactNode;
    freqTitle: ReactNode;
    timeName: string;
    freqName: string;
    timeSamples: number[];
    freqSamples: number[];
    timeImpulseTraces?: Data[];
    freqImpulseTraces?: Data[];
    timeYRange?: [number, number];
    freqYRange?: [number, number];
};

export type SineComponent = {
    id: number;
    frequency: number;
    amplitude: number;
    phase: number;
};
