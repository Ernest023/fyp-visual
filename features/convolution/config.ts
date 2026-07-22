import { createDefaultSignalState } from "@/library/types";

// Shared visual spacing used between convolution controls.
export const gapBottom = 7;

// Panel colours remain here so the page logic is not mixed with visual constants.
export const borderColor = "1px solid rgba(255,255,255,0.35)";
export const backgroundColor = "rgb(0, 0, 0)";

// Initial signals shown when the convolution laboratory opens.
export const defaultXSignal = createDefaultSignalState("rect");
export const defaultHSignal = createDefaultSignalState("step");

// Behaviour, control limits, numerical resolution, and responsive thresholds
// used throughout the convolution laboratory.
export const convolutionConfig = {
    defaults: {
        timeMode: "continuous",
        isHFlipped: false,
        slidePosition: -2.5,
        discreteSlidePosition: -2,
        expressionSlidePosition: -15,
        viewportWidth: 1280,
    },
    controls: {
        continuousWidth: { min: 0.2, max: 3, step: 0.01 },
        discreteWidth: { min: 1, max: 20, step: 1 },
        amplitude: { min: -10, max: 10, step: 0.01 },
        drawingAmplitude: { min: -10, max: 10, step: 0.01 },
    },
    sampling: {
        densityMultiplier: 1,
        continuousInputPoints: 1400,
        continuousOutputPoints: 700,
        fixedContinuousDomain: 30,
        continuousBaseDomain: 2,
        continuousDomainPadding: 0.5,
        fixedDiscreteIndex: 60,
        minimumDiscreteIndex: 40,
        discreteDomainPadding: 6,
    },
    layout: {
        initialViewportHeight: 800,
        mobilePlotHeight: 230,
        tabletPlotHeight: 250,
        desktopPlotHeight: 250,
        maximumDrawModalHeight: 760,
        drawModalViewportRatio: 0.92,
        drawModalReservedHeight: 120,
        minimumDrawCanvasHeight: 260,
    },
} as const;
