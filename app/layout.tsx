import type { Metadata } from "next";
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
