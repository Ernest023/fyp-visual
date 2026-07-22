import { InlineMath } from "react-katex";

// Keeps long Fourier-pair equations readable on smaller screens.
export default function FourierPairLabel({ math, isMobile }: { math: string; isMobile: boolean }) {
    return (
        <div
            className="responsive-math-text"
            style={{
                width: "100%",
                minWidth: 0,
                fontSize: isMobile ? "12px" : "14px",
                lineHeight: 1.5,
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                textAlign: "center",
            }}
        >
            <InlineMath math={math} />
        </div>
    );
}
