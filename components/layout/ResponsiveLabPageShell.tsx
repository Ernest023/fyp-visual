import Link from "next/link";
import type { CSSProperties, ReactNode, Ref } from "react";
import { theme } from "@/styles/theme";

// Shared responsive page shell. Individual labs can override mainStyle when
// they require a fixed-height desktop workspace, as convolution does.
export default function ResponsiveLabPageShell({
    title,
    isMobile,
    children,
    headerRef,
    mainStyle,
    mobileTitleSize = 18,
}: {
    title: string;
    isMobile: boolean;
    children: ReactNode;
    headerRef?: Ref<HTMLDivElement>;
    mainStyle?: CSSProperties;
    mobileTitleSize?: number;
}) {
    return (
        <main
            style={{
                minHeight: "100vh",
                padding: isMobile ? "8px 6px 28px" : "10px 12px 40px",
                boxSizing: "border-box",
                overflow: "auto",
                color: theme.colors.text,
                background: theme.colors.background,
                ...mainStyle,
            }}
        >
            <div
                ref={headerRef}
                style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "auto 1fr" : "1fr auto 1fr",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: theme.spacing.controlGap,
                }}
            >
                <div>
                    <Link
                        href="/"
                        style={{
                            display: "inline-block",
                            border: theme.borders.standard,
                            borderRadius: 10,
                            padding: "5px 10px",
                            fontWeight: 650,
                            fontSize: 13,
                        }}
                    >
                        ← Back
                    </Link>
                </div>
                <h1
                    style={{
                        margin: 0,
                        justifySelf: isMobile ? "start" : "center",
                        fontSize: isMobile ? mobileTitleSize : 22,
                        fontWeight: 750,
                        lineHeight: 1.2,
                    }}
                >
                    {title}
                </h1>
            </div>
            {children}
        </main>
    );
}
