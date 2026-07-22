export type SignalEvaluator = (input: number) => number;

// Discrete convolution repeatedly requests the same integer signal positions.
// This wrapper evaluates each position once and reuses the stored value.
export function createCachedSignalEvaluator(evaluateSignal: SignalEvaluator): SignalEvaluator {
    const cache = new Map<number, number>();

    return (input: number) => {
        const cachedValue = cache.get(input);
        if (cachedValue !== undefined || cache.has(input)) return cachedValue ?? 0;

        const value = evaluateSignal(input);
        cache.set(input, value);
        return value;
    };
}

// Approximates the continuous convolution integral or evaluates the discrete
// convolution sum for every requested output position.
export function computeConvolutionSamples({
    isDiscrete,
    isHFlipped,
    tAxis,
    tau,
    dt,
    xSamples,
    evaluateHSignal,
}: {
    isDiscrete: boolean;
    isHFlipped: boolean;
    tAxis: number[];
    tau: number[];
    dt: number;
    xSamples: ReadonlyArray<number>;
    evaluateHSignal: SignalEvaluator;
}): number[] {
    // Typed buffers keep the tight numerical loop compact while the returned
    // plain array remains directly compatible with Plotly and React state.
    const cachedX = Float64Array.from(xSamples);
    const outputSamples = new Float64Array(tAxis.length);

    for (let outputIndex = 0; outputIndex < tAxis.length; outputIndex++) {
        const outputPosition = tAxis[outputIndex];
        let sum = 0;

        for (let inputIndex = 0; inputIndex < tau.length; inputIndex++) {
            const inputPosition = tau[inputIndex];
            const hValue = isHFlipped
                ? evaluateHSignal(outputPosition - inputPosition)
                : evaluateHSignal(inputPosition - outputPosition);
            sum += cachedX[inputIndex] * hValue;
        }

        outputSamples[outputIndex] = isDiscrete ? sum : sum * dt;
    }

    return Array.from(outputSamples);
}
