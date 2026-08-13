"use client";

import { theme } from "@/styles/theme";
import { InlineMath } from "react-katex";

export type QuickSnippet = {
  text: string;
  display: string;
};

type CustomExpressionInputProps = {
  title: string;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  error?: string;
  gapBottom: number;
  placeholder?: string;

  parsedOk?: boolean;
  quickSnippets?: QuickSnippet[];
  onAppendSnippet?: (snippet: string) => void;
  clearAriaLabel?: string;

  isDiscrete: boolean;
};

const clearBtnStyle: React.CSSProperties = {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    width: 22,
    height: 22,
    borderRadius: 999,
    border: "1px solid var(--app-border)",
    background: "var(--control-muted)",
    color: "var(--app-text)",
    cursor: "pointer",
    fontWeight: 900,
    lineHeight: "20px",
    display: "grid",
    placeItems: "center",
  };

export default function CustomExpressionInput({
  title,
  value,
  setValue,
  error = "",
  gapBottom,
  placeholder = "Enter expression...",
  parsedOk = false,
  quickSnippets = [],
  onAppendSnippet,
  clearAriaLabel = "Clear expression",
  isDiscrete,
}: CustomExpressionInputProps) {
  const trimmedValue = value.trim();
  return (
    <div style={{ marginBottom: gapBottom }}>
      <div style={{ marginBottom: 4, fontWeight: 850, fontSize: 12 }}>
        {title}
      </div>
      <div style={{position: "relative"}}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          style={{
            width: "100%",
            height: 34,
            borderRadius: 8,
            border: theme.borders.standard,
            background: theme.colors.background,
            color: theme.colors.text,
            padding: "0 8px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {!! trimmedValue && (
          <button onClick={()=> setValue("")} style={clearBtnStyle} title="Clear" aria-label={clearAriaLabel}>
            x
          </button>
        )}
      </div>

      {trimmedValue.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 12 }}>
          {parsedOk ? (
            <span style={{ color: theme.colors.inputSignal }}>✅ Parsed OK</span>
          ) : (
            <span style={{ color: theme.colors.danger }}>
              ❌ {error || "Parse error"}
            </span>
          )}
        </div>
      )}
      
      {quickSnippets.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {quickSnippets.map((snippet) => {
            let tooltip: string | undefined;

            if (!isDiscrete && snippet.text === "sin(2*PI*t)") {
              tooltip =
                "f is omitted because the default continuous-time frequency is f = 1, so sin(2πft) becomes sin(2πt).";
            }

            if (isDiscrete && snippet.text === "sin[PI*n/4]") {
              tooltip =
                "In discrete time, the sine is written as sin(ωn). Here ω = π/4, which gives a period of 8 samples.";
            }

            return (
              <button
                key={snippet.text}
                onClick={() => onAppendSnippet?.(snippet.text)}
                title={tooltip}
                style={{
                  height: 26,
                  padding: "0 10px",
                  borderRadius: 10,
                  border: theme.borders.standard,
                  background: "transparent",
                  color: theme.colors.text,
                  cursor: "pointer",
                  fontWeight: 800,
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
              >
                <InlineMath math={snippet.display} />
              </button>
            );
          })}
        </div>
      )}
      
    </div>
  );
}
