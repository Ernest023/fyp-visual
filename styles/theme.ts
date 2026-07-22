export const theme = {
  colors: {
    background: "#070b14",
    surface: "#0c1322",
    panelBackground: "#101a2b",
    panelElevated: "#152238",
    text: "#f8fafc",
    textMuted: "#9fb0c8",
    inputSignal: "#22c55e",
    kernelSignal: "#f97316",
    outputSignal: "#3b82f6",
    danger: "#ef4444",
    spectrumBase: "#8b5cf6",
    spectrumReplica: "#60a5fa",
    accent: "#38bdf8",
  },

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
} as const;
