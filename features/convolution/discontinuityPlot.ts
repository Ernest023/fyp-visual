import type { SignalEvaluator } from "@/features/convolution/convolutionEngine";

export type PlotSamples = {
    x: number[];
    y: number[];
};

const PROBE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1] as const;
const MIN_DOMINANT_CHANGE_RATIO = 0.8;
const MIN_VISIBLE_CHANGE = 1e-7;
const BINARY_SEARCH_STEPS = 24;

// Finds a jump inside one sampled interval. A true discontinuity produces one
// dominant change between the probe values; a smooth curve distributes its
// change across the interval instead.
function findJump(
    leftX: number,
    rightX: number,
    evaluateSignal: SignalEvaluator
): { position: number; leftValue: number; rightValue: number } | null {
    const intervalWidth = rightX - leftX;
    const probeX = PROBE_FRACTIONS.map(
        (fraction) => leftX + intervalWidth * fraction
    );
    const probeY = probeX.map(evaluateSignal);

    const changes = probeY.slice(0, -1).map(
        (value, index) => Math.abs(probeY[index + 1] - value)
    );
    const totalVariation = changes.reduce((sum, change) => sum + change, 0);

    if (totalVariation <= MIN_VISIBLE_CHANGE) return null;

    let largestChangeIndex = 0;
    for (let index = 1; index < changes.length; index++) {
        if (changes[index] > changes[largestChangeIndex]) {
            largestChangeIndex = index;
        }
    }

    const largestChange = changes[largestChangeIndex];
    if (largestChange / totalVariation < MIN_DOMINANT_CHANGE_RATIO) {
        // sgn(0) = 0 creates two adjacent changes (-1 -> 0 -> 1) when a
        // probe lands exactly on the discontinuity. Treat that isolated
        // middle value as the mathematical jump rather than drawing two
        // diagonal half-steps.
        for (let index = 0; index < changes.length - 1; index++) {
            const adjacentChange = changes[index] + changes[index + 1];
            if (adjacentChange / totalVariation < MIN_DOMINANT_CHANGE_RATIO) {
                continue;
            }

            return {
                position: probeX[index + 1],
                leftValue: probeY[index],
                rightValue: probeY[index + 2],
            };
        }

        return null;
    }

    let jumpLeftX = probeX[largestChangeIndex];
    let jumpRightX = probeX[largestChangeIndex + 1];
    let jumpLeftValue = probeY[largestChangeIndex];
    let jumpRightValue = probeY[largestChangeIndex + 1];

    // Narrow the interval while retaining one value from each side of the
    // jump. This positions the vertical display edge independently of the
    // numerical sampling density used by the convolution calculation.
    for (let step = 0; step < BINARY_SEARCH_STEPS; step++) {
        const midpoint = (jumpLeftX + jumpRightX) / 2;
        const midpointValue = evaluateSignal(midpoint);
        const distanceFromLeft = Math.abs(midpointValue - jumpLeftValue);
        const distanceFromRight = Math.abs(midpointValue - jumpRightValue);

        if (distanceFromLeft <= distanceFromRight) {
            jumpLeftX = midpoint;
            jumpLeftValue = midpointValue;
        } else {
            jumpRightX = midpoint;
            jumpRightValue = midpointValue;
        }
    }

    return {
        position: (jumpLeftX + jumpRightX) / 2,
        leftValue: jumpLeftValue,
        rightValue: jumpRightValue,
    };
}

// Adds two plot-only points at every detected jump. Repeating the horizontal
// coordinate lets Plotly draw a vertical edge while smooth sections continue
// to use ordinary linear interpolation. The original numerical samples are
// not changed and remain the inputs to the convolution engine.
export function buildDiscontinuityAwarePlotSamples(
    axis: ReadonlyArray<number>,
    samples: ReadonlyArray<number>,
    evaluateSignal: SignalEvaluator
): PlotSamples {
    if (axis.length !== samples.length || axis.length < 2) {
        return { x: Array.from(axis), y: Array.from(samples) };
    }

    const plotX: number[] = [];
    const plotY: number[] = [];

    for (let index = 0; index < axis.length - 1; index++) {
        const leftX = axis[index];
        const rightX = axis[index + 1];

        plotX.push(leftX);
        plotY.push(samples[index]);

        const jump = findJump(leftX, rightX, evaluateSignal);
        if (!jump) continue;

        plotX.push(jump.position, jump.position);
        plotY.push(jump.leftValue, jump.rightValue);
    }

    plotX.push(axis[axis.length - 1]);
    plotY.push(samples[samples.length - 1]);

    return { x: plotX, y: plotY };
}
