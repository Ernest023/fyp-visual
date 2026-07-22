"use client";

import { useId, useState, type ReactNode } from "react";
import { theme } from "@/styles/theme";

// Consistent container for formulas, derivations, and learning observations.
export default function EducationalExplanationCard({
    title,
    children,
    marginTop = 12,
    defaultExpanded = true,
    accentColor,
}: {
    title: string;
    children: ReactNode;
    marginTop?: number;
    defaultExpanded?: boolean;
    accentColor?: string;
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const contentId = useId();

    return (
        <section
            style={{
                marginTop,
                borderRadius: 12,
                border: theme.borders.subtle,
                borderLeft: accentColor ? `4px solid ${accentColor}` : undefined,
                background: theme.colors.panelBackground,
                overflow: "hidden",
            }}
        >
            <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={contentId}
                onClick={() => setIsExpanded((expanded) => !expanded)}
                style={{
                    width: "100%",
                    minHeight: 44,
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    border: 0,
                    background: "transparent",
                    color: theme.colors.text,
                    font: "inherit",
                    fontWeight: 800,
                    textAlign: "left",
                    cursor: "pointer",
                }}
            >
                <span>{title}</span>
                <span
                    aria-hidden="true"
                    style={{
                        color: theme.colors.textMuted,
                        fontSize: 16,
                        lineHeight: 1,
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 160ms ease",
                    }}
                >
                    ▾
                </span>
            </button>

            {isExpanded ? (
                <div
                    id={contentId}
                    style={{
                        padding: "0 12px 12px",
                        overflowX: "auto",
                    }}
                >
                    {children}
                </div>
            ) : null}
        </section>
    );
}
