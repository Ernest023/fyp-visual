import { PresetInput } from "./signal";

export type SignalSource = "preset" | "expression" | "draw";

export interface SignalState {
    source: SignalSource;

    preset: PresetInput;

    width: number;
    amplitude: number;

    expression: string;

    drawnSamples: number[];
}

export function createDefaultSignalState(preset: PresetInput): SignalState {
  return {
    source: "preset",
    preset,
    width: 1,
    amplitude: 1,
    expression: "",
    drawnSamples: [],
  };
}