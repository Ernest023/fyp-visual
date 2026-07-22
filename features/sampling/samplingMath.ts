// Wraps a phase angle into the standard interval from -π to π.
export function wrapPhase(angle: number): number {
    let wrapped = angle;
    while (wrapped > Math.PI) wrapped -= 2 * Math.PI;
    while (wrapped < -Math.PI) wrapped += 2 * Math.PI;
    return wrapped;
}

// Normalised sinc used by the ideal reconstruction formula.
export function sinc(value: number): number {
    if (Math.abs(value) < 1e-10) return 1;
    return Math.sin(Math.PI * value) / (Math.PI * value);
}

/**
 * Maps a signal frequency into the principal sampled-frequency interval:
 *
 *      -fs/2 <= f_alias < fs/2
 *
 * This signed frequency produces the same sample values as the original
 * sinusoid.
 */
export function getSignedAliasFrequency(
    signalFrequency: number,
    samplingFrequency: number
): number {
    if (samplingFrequency <= 0) return 0;
    const shifted =
        ((signalFrequency + samplingFrequency / 2) % samplingFrequency +
            samplingFrequency) %
        samplingFrequency;
    return shifted - samplingFrequency / 2;
}

// Formats common phase values using familiar multiples of π.
export function formatPhase(phi: number): string {
    const wrapped = wrapPhase(phi);
    const tolerance = 0.02;
    const knownPhases = [
        { value: -Math.PI, label: "-π" },
        { value: (-3 * Math.PI) / 4, label: "-3π/4" },
        { value: -Math.PI / 2, label: "-π/2" },
        { value: -Math.PI / 4, label: "-π/4" },
        { value: 0, label: "0" },
        { value: Math.PI / 4, label: "π/4" },
        { value: Math.PI / 2, label: "π/2" },
        { value: (3 * Math.PI) / 4, label: "3π/4" },
        { value: Math.PI, label: "π" },
    ];
    const match = knownPhases.find(
        (phase) => Math.abs(wrapped - phase.value) < tolerance
    );
    return match?.label ?? wrapped.toFixed(2);
}
