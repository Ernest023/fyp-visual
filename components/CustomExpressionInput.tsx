"use client";

import { borderColor, backgroundColor } from "@/app/convolution/page";

type CustomExpressionInputProps = {
  title: string;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  error?: string;
  gapBottom: number;
  placeholder?: string;
};

export default function CustomExpressionInput({
  title,
  value,
  setValue,
  error = "",
  gapBottom,
  placeholder = "Enter expression...",
}: CustomExpressionInputProps) {
  return (
    <div style={{ marginBottom: gapBottom }}>
      <div style={{ marginBottom: 4, fontWeight: 850, fontSize: 12 }}>
        {title}
      </div>

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

      {error && (
        <div style={{ color: "rgb(248,113,113)", fontSize: 12, marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}