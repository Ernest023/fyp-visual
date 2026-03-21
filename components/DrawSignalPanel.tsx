"use client";

import DrawSignalCanvas from "@/components/DrawSignalCanvas";

type DrawSignalPanelProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    tip?: string;

    tau: number[];
    samples: number[];
    onChange: (next: number[]) => void;
    onClear: () => void;

    yMin: number;
    yMax: number;
    canvasHeight: number;
    modalHeight: number;
    discrete?: boolean;
};

export default function DrawSignalPanel({
    open,
    onClose,
    title,
    tip = "Tip: draw with your mouse/trackpad. Press ESC to close.",
    tau,
    samples,
    onChange,
    onClear,
    yMin,
    yMax,
    canvasHeight,
    modalHeight,
    discrete = false,
    }: DrawSignalPanelProps) {
    if (!open) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.72)",
                zIndex: 9999,
                padding: 16,
                display: "grid",
                placeItems: "center",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                width: "min(1200px, 96vw)",
                height: `${modalHeight}px`,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.35)",
                background: "#0b0b0b",
                boxSizing: "border-box",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{title}</div>

                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                        onClick={onClear}
                        style={{
                            height: 32,
                            padding: "0 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.35)",
                            background: "transparent",
                            color: "white",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                        >
                        Clear
                        </button>

                        <button
                        onClick={onClose}
                        style={{
                            height: 32,
                            padding: "0 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.35)",
                            background: "rgba(255,255,255,0.08)",
                            color: "white",
                            fontWeight: 800,
                            cursor: "pointer",
                        }}
                        >
                        Done
                        </button>
                    </div>
                </div>

                <div style={{ fontSize: 12, opacity: 0.75 }}>{tip}</div>

                <div style={{ flex: 1, minHeight: 0 }}>
                    <DrawSignalCanvas
                        tau={tau}
                        samples={samples}
                        onChange={onChange}
                        yMin={yMin}
                        yMax={yMax}
                        height={canvasHeight}
                        discrete={discrete}
                    />
                </div>
            </div>
        </div>
    );
}