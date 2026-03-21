import { useState } from "react";

export function HintPopover({ title = "Expression help", children }: { title?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        title={title}
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.35)",
          display: "inline-grid",
          placeItems: "center",
          fontSize: 12,
          fontWeight: 900,
          opacity: 0.9,
          cursor: "help",
          userSelect: "none",
        }}
      >
        ?
      </span>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 0,
            zIndex: 50,
            width: 360,
            maxWidth: "60vw",
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.28)",
            background: "rgba(0,0,0,0.92)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
            lineHeight: 1.35,
            fontSize: 12,
          }}
        >
          {children}
        </div>
      )}
    </span>
  );
}