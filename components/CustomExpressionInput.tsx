"use client";

import { borderColor, backgroundColor } from "@/app/convolution/page";

type CustomExpressionInputProps = {
  title: string;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  error?: string;
  gapBottom: number;
  placeholder?: string;

  parsedOk?: boolean;
  quickSnippets?: string[];
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
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
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
            border: borderColor,
            background: backgroundColor,
            color: "white",
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
            <span style={{ color: "rgba(34,197,94,0.95)" }}>✅ Parsed OK</span>
          ) : (
            <span style={{ color: "rgba(239,68,68,0.95)" }}>
              ❌ {error || "Parse error"}
            </span>
          )}
        </div>
      )}
      
      {quickSnippets.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {quickSnippets.map((snippet) => {
            let tooltip: string | undefined;

            if (!isDiscrete && snippet === "sin(2*PI*t)") {
              tooltip =
                "f is omitted because the default continuous-time frequency is f = 1, so sin(2πft) becomes sin(2πt).";
            }

            if (isDiscrete && snippet === "sin[PI*n/4]") {
              tooltip =
                "In discrete time, the sine is written as sin(ωn). Here ω = π/4, which gives a period of 8 samples.";
            }

            return (
              <button
                key={snippet}
                onClick={() => onAppendSnippet?.(snippet)}
                title={tooltip}
                style={{
                  height: 26,
                  padding: "0 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.30)",
                  background: "transparent",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
              >
                {snippet}
              </button>
            );
          })}
        </div>
      )}
      
    </div>
  );
}