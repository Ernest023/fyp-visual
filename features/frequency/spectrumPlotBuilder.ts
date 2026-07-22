import type { Data } from "plotly.js";
import { makeStemTraces } from "@/components/visualization/SignalPlot";
import { wrapPhase } from "@/features/frequency/frequencyMath";
import type { SineComponent } from "@/features/frequency/types";

export type SineSpectrum = {
    frequencies: number[];
    magnitudes: number[];
    phases: number[];
};

// Combines matching positive/negative frequency impulses as complex values.
export function buildSineSpectrum(components: SineComponent[]): SineSpectrum {
    type ComplexValue = { re: number; im: number };
    const spectrumMap = new Map<string, { frequency: number; value: ComplexValue }>();

    function addToSpectrum(frequency: number, magnitude: number, phase: number) {
        const key = frequency.toFixed(6);
        const re = magnitude * Math.cos(phase);
        const im = magnitude * Math.sin(phase);
        const existing = spectrumMap.get(key);
        if (existing) {
            existing.value.re += re;
            existing.value.im += im;
        } else {
            spectrumMap.set(key, { frequency, value: { re, im } });
        }
    }

    components.forEach((component) => {
        const magnitude = Math.abs(component.amplitude) / 2;
        addToSpectrum(component.frequency, magnitude, component.phase - Math.PI / 2);
        addToSpectrum(-component.frequency, magnitude, -component.phase + Math.PI / 2);
    });

    const sortedSpectrum = Array.from(spectrumMap.values())
        .map(({ frequency, value }) => {
            const magnitude = Math.sqrt(value.re ** 2 + value.im ** 2);
            return {
                frequency,
                magnitude,
                phase: magnitude < 1e-9 ? 0 : wrapPhase(Math.atan2(value.im, value.re)),
            };
        })
        .sort((first, second) => first.frequency - second.frequency);

    return {
        frequencies: sortedSpectrum.map((point) => point.frequency),
        magnitudes: sortedSpectrum.map((point) => point.magnitude),
        phases: sortedSpectrum.map((point) => point.phase),
    };
}

// Produces the paired magnitude and phase stem traces used by the page.
export function buildSpectrumPlotTraces(spectrum: SineSpectrum): { magnitudeTraces: Data[]; phaseTraces: Data[] } {
    return {
        magnitudeTraces: makeStemTraces(spectrum.frequencies, spectrum.magnitudes, "Magnitude spectrum", "rgba(37,99,235,0.95)"),
        phaseTraces: makeStemTraces(spectrum.frequencies, spectrum.phases, "Phase spectrum", "rgba(249,115,22,0.95)"),
    };
}
