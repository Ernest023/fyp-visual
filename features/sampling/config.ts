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
        min: -0.5,
        max: 0.5,
        pointCount: 5000,
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
    breakpoints: {
        mobile: 600,
        tablet: 1024,
    },
    plotHeights: {
        mobile: 330,
        tablet: 355,
        desktop: 365,
    },
    statusStyles: {
        nyquist: {
            color: "#eab308",
            background: "rgba(234,179,8,0.10)",
            border: "1px solid rgba(234,179,8,0.55)",
        },
        safe: {
            color: "#22c55e",
            background: "rgba(34,197,94,0.10)",
            border: "1px solid rgba(34,197,94,0.55)",
        },
        aliasing: {
            color: "#ef4444",
            background: "rgba(239,68,68,0.10)",
            border: "1px solid rgba(239,68,68,0.55)",
        },
    },
} as const;
