import { createDefaultSignalState } from "@/library/types";

// Shared visual spacing used between convolution controls.
export const gapBottom = 7;

// Panel colours remain here so the page logic is not mixed with visual constants.
export const borderColor = "1px solid rgba(255,255,255,0.35)";
export const backgroundColor = "rgb(0, 0, 0)";

// Initial signals shown when the convolution laboratory opens.
export const defaultXSignal = createDefaultSignalState("rect");
export const defaultHSignal = createDefaultSignalState("step");
