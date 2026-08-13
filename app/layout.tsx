import type { Metadata } from "next";
import ThemeToggle from "@/components/layout/ThemeToggle";
import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: {
    default: "Signal Studio",
    template: "%s | Signal Studio",
  },
  description:
    "Interactive convolution, Fourier transform, and sampling laboratories for exploring Signals and Systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var saved =
                    localStorage.getItem("signal-studio-theme-v2");

                  var theme =
                    saved === "light" || saved === "dark"
                      ? saved
                      : "dark";

                  localStorage.removeItem("signal-studio-theme");

                  document.documentElement.dataset.theme = theme;
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {
                  document.documentElement.dataset.theme = "dark";
                }
              })();
            `,
          }}
        />
      </head>

      <body>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
