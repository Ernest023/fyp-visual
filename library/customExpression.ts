import { Parser } from "expr-eval";
import { ramp, rect, sgn, tri, u } from "./signal";
//npm install expr-eval

// rect, tri, u, ramp, and sgn are not built into expr-eval. These wrappers
// deliberately reuse the preset functions so both input methods always
// produce the same base waveform.
export function rectExpr(t: number): number {
  return rect(t);
}

export function triExpr(t: number): number {
  return tri(t);
}

export function stepExpr(t: number): number {
  return u(t);
}

export function rampExpr(t: number): number {
  return ramp(t);
}

export function sgnExpr(t: number): number {
  return sgn(t);
}

// input: number; output: number
export type ExpressionEvaluator = (x: number) => number;

// Discrete-time notation is shown to learners with square brackets, such as
// u[n] and rect[n/3]. expr-eval expects function calls to use parentheses, so
// convert only at the parser boundary while keeping the visible notation.
export function normalizeExpressionSyntax(
  expr: string,
  isDiscrete: boolean
): string {
  return isDiscrete ? expr.replaceAll("[", "(").replaceAll("]", ")") : expr;
}

function createExpressionParser() {
    //parser object, read math strings and understand as math expression
    const parser = new Parser();

    //declare own signal that is not part of built in.
    parser.functions.rect = rectExpr;
    parser.functions.tri = triExpr;
    parser.functions.u = stepExpr;
    parser.functions.ramp = rampExpr;
    parser.functions.sgn = sgnExpr;

    return parser;
}

export function buildExpressionEvaluator(
  expr: string,
  isDiscrete = false
): ExpressionEvaluator {
    const parser = createExpressionParser();
    const normalizedExpression = normalizeExpressionSyntax(expr, isDiscrete);

    //turn text into a usable math formula
    const parsed = parser.parse(normalizedExpression);

    return (x: number) => {
        const result = parsed.evaluate({
        //if the expression uses t, replace it with x
        //if the expression uses n, replace it with x
        //if it uses pi, use Math.PI
        //if it uses e, use Math.E
        t: x,
        n: x,
        pi: Math.PI,
        e: Math.E,
        });
        //Safety if the result is a valid finite number, return it otherwise return 0
        //preventing Infinity, NaN,non-number result
        return typeof result === "number" && Number.isFinite(result) ? result : 0;
    };
}

//checks whether the typed expression is valid
export function validateExpression(
  expr: string,
  isDiscrete: boolean
): { ok: boolean; error: string } {
  if (expr.trim() === "") {
    return { ok: true, error: "" };
  }
  
  if (!isDiscrete && (expr.includes("[") || expr.includes("]"))) {
    return { ok: false, error: "Continuous-time mode uses () and variable t." };
  }

  if (isDiscrete && (expr.includes("(") || expr.includes(")"))) {
    return { ok: false, error: "Discrete-time mode uses [] and variable n." };
  }

  if (isDiscrete && /\bt\b/.test(expr)) {
    return { ok: false, error: "Discrete-time mode only allows n, not t." };
  }

  if (!isDiscrete && /\bn\b/.test(expr)) {
    return { ok: false, error: "Continuous-time mode only allows t, not n." };
  }

  try {
    const parser = createExpressionParser();
    const normalizedExpression = normalizeExpressionSyntax(expr, isDiscrete);
    const parsed = parser.parse(normalizedExpression);

    // Test representative negative, zero, and positive indices/positions so
    // undefined functions and non-numeric results are not reported as valid.
    for (const inputX of [-1, 0, 1]) {
      const result = parsed.evaluate({
        t: inputX,
        n: inputX,
        pi: Math.PI,
        e: Math.E,
      });

      if (typeof result !== "number" || !Number.isFinite(result)) {
        return { ok: false, error: "Expression must produce finite numbers." };
      }
    }

    return { ok: true, error: "" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Invalid expression",
    };
  }
}
