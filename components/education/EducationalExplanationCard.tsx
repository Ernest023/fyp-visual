import type { ReactNode } from "react";
import { theme } from "@/styles/theme";

// Consistent container for formulas, derivations, and learning observations.
export default function EducationalExplanationCard({
    title,
    children,
    marginTop = 12,
}: {
    title: string;
    children: ReactNode;
    marginTop?: number;
}) {
    return (
        <section
            style={{
                marginTop,
                padding: 12,
                borderRadius: 12,
                border: theme.borders.subtle,
                background: theme.colors.panelBackground,
                overflowX: "auto",
            }}
        >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
            {children}
        </section>
    );
}
