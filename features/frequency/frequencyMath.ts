// Wraps a phase angle into the standard interval from -π to π.
export function wrapPhase(angle: number): number {
    let wrapped = angle;
    while (wrapped > Math.PI) wrapped -= 2 * Math.PI;
    while (wrapped < -Math.PI) wrapped += 2 * Math.PI;
    return wrapped;
}

// Formats common phase angles using π notation and includes degrees.
export function formatPhase(phi: number): string {
    const tolerance = 0.02;
    const wrappedPhi = wrapPhase(phi);
    const phaseMap = [
        { value: -Math.PI, label: "-π", degree: -180 },
        { value: (-3 * Math.PI) / 4, label: "-3π/4", degree: -135 },
        { value: -Math.PI / 2, label: "-π/2", degree: -90 },
        { value: -Math.PI / 4, label: "-π/4", degree: -45 },
        { value: 0, label: "0", degree: 0 },
        { value: Math.PI / 4, label: "π/4", degree: 45 },
        { value: Math.PI / 2, label: "π/2", degree: 90 },
        { value: (3 * Math.PI) / 4, label: "3π/4", degree: 135 },
        { value: Math.PI, label: "π", degree: 180 },
    ];

    for (const phase of phaseMap) {
        if (Math.abs(wrappedPhi - phase.value) < tolerance) {
            return `${phase.label} rad (${phase.degree}°)`;
        }
    }

    const degrees = (wrappedPhi * 180) / Math.PI;
    return `${wrappedPhi.toFixed(2)} rad (${degrees.toFixed(0)}°)`;
}

export function getPhaseSymbol(phi: number): string {
    return formatPhase(phi).split(" rad")[0];
}

// Normalised sinc: sin(πx)/(πx).
export function sinc(x: number): number {
    if (Math.abs(x) < 1e-9) return 1;
    return Math.sin(Math.PI * x) / (Math.PI * x);
}

export function rect(x: number): number {
    return Math.abs(x) <= 0.5 ? 1 : 0;
}
