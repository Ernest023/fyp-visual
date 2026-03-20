import { Parser } from "expr-eval";
//npm install expr-eval

//rect, tri, u, ramp, sgn are not built-ins from expr-eval, must define them
export function rectExpr(t: number): number {
  return Math.abs(t) <= 0.5 ? 1 : 0;
}

export function triExpr(t: number): number {
  const at = Math.abs(t);
  return at >= 1 ? 0 : 1 - at;
}

export function stepExpr(t: number): number {
  return t >= 0 ? 1 : 0;
}

export function rampExpr(t: number): number {
  return t >= 0 ? t : 0;
}

export function sgnExpr(t: number): number {
  if (t > 0) return 1;
  if (t < 0) return -1;
  return 0;
}

// input: number; output: number
export type ExpressionEvaluator = (x: number) => number;

export function buildExpressionEvaluator(expr: string): ExpressionEvaluator {
    //parser object, read math strings and understand as math expression
    const parser = new Parser();

    //declare own signal that is not part of built in.
    parser.functions.rect = rectExpr;
    parser.functions.tri = triExpr;
    parser.functions.u = stepExpr;
    parser.functions.ramp = rampExpr;
    parser.functions.sgn = sgnExpr;
    //turn text into a usable math formula
    const parsed = parser.parse(expr);

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
    const evaluator = buildExpressionEvaluator(expr);
    evaluator(0); // test once so undefined variables/functions also get caught
    return { ok: true, error: "" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Invalid expression",
    };
  }
}