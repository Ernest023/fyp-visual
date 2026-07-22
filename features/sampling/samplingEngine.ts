import { sinc } from "@/features/sampling/samplingMath";
import { samplingConfig } from "@/features/sampling/config";

// Ideal band-limited reconstruction using a padded sinc interpolation sum.
export function reconstructSignal({
    continuousTimeAxis,
    amplitude,
    phase,
    signalFrequency,
    samplingFrequency,
    timeMin,
    timeMax,
}: {
    continuousTimeAxis: number[];
    amplitude: number;
    phase: number;
    signalFrequency: number;
    samplingFrequency: number;
    timeMin: number;
    timeMax: number;
}): number[] {
    const interpolationPadding = samplingConfig.reconstruction.interpolationPadding;
    const firstIndex = Math.floor(timeMin * samplingFrequency) - interpolationPadding;
    const lastIndex = Math.ceil(timeMax * samplingFrequency) + interpolationPadding;
    const interpolationSamples = Array.from({ length: lastIndex - firstIndex + 1 }, (_, offset) => {
        const index = firstIndex + offset;
        const sampleTime = index / samplingFrequency;
        return {
            index,
            value: amplitude * Math.sin(2 * Math.PI * signalFrequency * sampleTime + phase),
        };
    });

    return continuousTimeAxis.map((time) =>
        interpolationSamples.reduce(
            (sum, sample) => sum + sample.value * sinc(samplingFrequency * time - sample.index),
            0
        )
    );
}
