import { InlineMath } from "react-katex";

// Keeps long Fourier-pair equations readable on smaller screens.
export default function FourierPairLabel({ math, isMobile }: { math: string; isMobile: boolean }) {
    return (
        <div
            style={{
                fontSize: "14px",
                transform: "scale(0.99)",
                transformOrigin: "center",
                whiteSpace: "nowrap",
                maxWidth: isMobile ? "calc(100vw - 72px)" : undefined,
                overflowX: isMobile ? "auto" : undefined,
            }}
        >
            <InlineMath math={math} />
        </div>
    );
}
