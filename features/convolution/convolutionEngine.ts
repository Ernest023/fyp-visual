export type SignalEvaluator = (input: number) => number;

// Approximates the continuous convolution integral or evaluates the discrete
// convolution sum for every requested output position.
export function computeConvolutionSamples({
    isDiscrete,
    isHFlipped,
    tAxis,
    tau,
    dt,
    evaluateXSignal,
    evaluateHSignal,
}: {
    isDiscrete: boolean;
    isHFlipped: boolean;
    tAxis: number[];
    tau: number[];
    dt: number;
    evaluateXSignal: SignalEvaluator;
    evaluateHSignal: SignalEvaluator;
}): number[] {
    return tAxis.map((outputPosition) => {
        let sum = 0;
        for (const inputPosition of tau) {
            const xValue = evaluateXSignal(inputPosition);
            const hValue = isHFlipped
                ? evaluateHSignal(outputPosition - inputPosition)
                : evaluateHSignal(inputPosition - outputPosition);
            sum += xValue * hValue;
        }
        return isDiscrete ? sum : sum * dt;
    });
}
