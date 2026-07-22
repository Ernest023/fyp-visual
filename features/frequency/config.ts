import type { PageMode, PairMode, SineComponent } from "@/features/frequency/types";
import { theme } from "@/styles/theme";

// Static defaults and limits for the frequency-domain laboratory. Calculated
// spectra and Plotly traces remain in their dedicated builder modules.
export const frequencyConfig = {
    defaults: {
        viewportWidth: 1280,
        pageMode: "sine-builder" as PageMode,
        pairMode: "exp-right" as PairMode,
        pairWidth: 1,
        components: [
            { id: 1, frequency: 1, amplitude: 1, phase: 0 },
            { id: 2, frequency: 2, amplitude: 0.5, phase: 0 },
            { id: 3, frequency: 3, amplitude: 0.25, phase: 0 },
        ] satisfies SineComponent[],
    },
    limits: {
        maximumSines: 8,
        frequency: { min: 0.1, max: 15, step: 0.1 },
        amplitude: { min: 0, max: 5, step: 0.01 },
        phase: { min: -Math.PI, max: Math.PI, step: 0.01 },
        pairParameter: { min: 0.2, max: 10, step: 0.01 },
    },
    axes: {
        signalTime: { points: 1600 },
        adaptiveSignalTime: { cycles: 4, minimumHalfWindow: 0.5, maximumHalfWindow: 4 },
        pairTime: { min: -6, max: 6, points: 6000 },
        pairFrequency: { min: -10, max: 10, points: 6000 },
        spectrumPadding: 1,
    },
    plotHeights: {
        mobile: 315,
        tablet: 350,
        desktop: 240,
    },
    componentColors: theme.chartSeries,
} as const;

export function createInitialComponentTexts() {
    return Object.fromEntries(
        frequencyConfig.defaults.components.map((component) => [
            component.id,
            {
                frequency: component.frequency.toFixed(2),
                amplitude: component.amplitude.toFixed(2),
                phase: component.phase.toFixed(2),
            },
        ])
    ) as Record<number, { frequency: string; amplitude: string; phase: string }>;
}
