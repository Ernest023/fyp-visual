// ----- Presets -----
export type PresetInput =
  | "imp"   // unit impulse
  | "step"  // unit step
  | "ramp"  // unit ramp
  | "sine"  // sinusoid
  | "exp"   // exponential
  | "rect"  // rectangular
  | "tri"   // triangular
  | "sgn";  // signum


// ----- Signals Function -----
export function rect(t: number, width = 1): number {
  return Math.abs(t) <= width / 2 ? 1 : 0;
}

export function tri(t: number, width = 1): number {
  const a = width / 2;
  const at = Math.abs(t);
  if (at >= a) return 0;
  return 1 - at / a;
}

export function u(t: number): number {
  return t >= 0 ? 1 : 0;
}

export function ramp(t: number): number {
  return t >= 0 ? t : 0;
}

export function sgn(t: number): number {
  if (t > 0) return 1;
  if (t < 0) return -1;
  return 0;
}

export function expDecay(t: number, a = 2): number {
  return t >= 0 ? Math.exp(-a * t) : 0;
}

export function sine(t: number, f = 1): number {
  return Math.sin(2 * Math.PI * f * t);
}

export const PRESETS: { id: PresetInput; label: string; fn: (t: number) => number }[] = [
  { id: "step", label: "Unit Step u(t)", fn: (t) => u(t) },
  { id: "ramp", label: "Unit Ramp r(t)=t·u(t)", fn: (t) => ramp(t) },
  { id: "sgn",  label: "Signum sgn(t)", fn: (t) => sgn(t) },
  { id: "rect", label: "Rectangular rect(t) (width=1)", fn: (t) => rect(t, 1) },
  { id: "tri",  label: "Triangular tri(t) (width=1)", fn: (t) => tri(t, 1) },
  { id: "exp",  label: "Exponential e^(−2t)·u(t)", fn: (t) => expDecay(t, 2) },
  { id: "sine", label: "Sinusoidal sin(2π·1·t)", fn: (t) => sine(t, 1) },
];