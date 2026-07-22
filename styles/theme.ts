export const theme = {
  colors: {
    background: "#070b14",
    surface: "#0c1322",
    panelBackground: "#101a2b",
    panelElevated: "#152238",
    text: "#f8fafc",
    textMuted: "#9fb0c8",
    inputSignal: "#22c55e",
    inputSignalMuted: "rgba(34,197,94,0.42)",
    inputSignalSurface: "rgba(34,197,94,0.10)",
    kernelSignal: "#f97316",
    kernelSignalMuted: "rgba(249,115,22,0.42)",
    outputSignal: "#3b82f6",
    outputSignalMuted: "rgba(59,130,246,0.42)",
    danger: "#ef4444",
    dangerMuted: "rgba(239,68,68,0.22)",
    dangerSurface: "rgba(239,68,68,0.10)",
    warning: "#eab308",
    warningMuted: "rgba(234,179,8,0.10)",
    spectrumBase: "#8b5cf6",
    spectrumReplica: "#60a5fa",
    spectrumReplicaMuted: "rgba(96,165,250,0.78)",
    sampleStem: "rgba(59,130,246,0.72)",
    gridLine: "rgba(0,0,0,0.18)",
    zeroLine: "rgba(0,0,0,0.38)",
    plotAxis: "rgba(231,231,231,0.85)",
    plotAnnotation: "rgba(15,23,42,0.82)",
    plotAnnotationMuted: "rgba(15,23,42,0.62)",
    accent: "#38bdf8",
  },

  // Colours for multiple independent signal components. The first entries
  // follow the semantic input/kernel/output ordering used across the labs.
  chartSeries: [
    "#22c55e",
    "#f97316",
    "#3b82f6",
    "#8b5cf6",
    "#ef4444",
    "#14b8a6",
    "#eab308",
    "#ec4899",
  ],

  borders: {
    standard: "1px solid #263449",
    subtle: "1px solid #1d2a3d",
    active: "1px solid #7dd3fc",
  },

  spacing: {
    controlGap: 10,
    sectionGap: 14,
  },

  radii: {
    control: 10,
    card: 16,
  },

  // Shared responsive thresholds used by every laboratory.
  breakpoints: {
    mobile: 600,
    tablet: 1024,
    desktop: 1400,
  },
} as const;
