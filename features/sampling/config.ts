import { theme } from "@/styles/theme";

// Static defaults, control limits, numerical accuracy, and display settings for
// the sampling and aliasing laboratory.
export const samplingConfig = {
    defaults: {
        viewportWidth: 1280,
        amplitude: 1,
        signalFrequency: 8,
        samplingFrequency: 20,
        phase: 0,
    },
    controls: {
        amplitude: { min: 0.1, max: 5, step: 0.01 },
        signalFrequency: { min: 0.5, max: 20, step: 0.1 },
        samplingFrequency: { min: 1, max: 50, step: 0.1 },
        phase: { min: -Math.PI, max: Math.PI, step: 0.01 },
    },
    timeDomain: {
        pointCount: 5000,
        visibleCycles: 4,
        minimumHalfWindow: 0.25,
        maximumHalfWindow: 2,
    },
    reconstruction: {
        interpolationPadding: 128,
    },
    nyquist: {
        tolerance: 0.001,
    },
    spectrum: {
        replicaCount: 3,
        minimumFrequencyLimit: 20,
        frequencyPadding: 2,
    },
    plotHeights: {
        mobile: 330,
        tablet: 355,
        desktop: 300,
    },
    statusStyles: {
        nyquist: {
            color: theme.colors.warning,
            background: theme.colors.warningMuted,
            border: `1px solid ${theme.colors.warning}`,
        },
        safe: {
            color: theme.colors.inputSignal,
            background: theme.colors.inputSignalSurface,
            border: `1px solid ${theme.colors.inputSignal}`,
        },
        aliasing: {
            color: theme.colors.danger,
            background: theme.colors.dangerSurface,
            border: `1px solid ${theme.colors.danger}`,
        },
    },
} as const;
