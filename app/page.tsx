import Link from "next/link";
import type { CSSProperties } from "react";

const labs = [
  {
    href: "/convolution",
    index: "LAB 01",
    title: "Convolution Canvas",
    description: "Flip, slide, and overlap two signals to build an intuitive picture of convolution.",
    difficulty: "Foundational",
    accent: "#22c55e",
    bars: [32, 32, 64, 64, 64, 44, 24, 50, 50, 28],
    outcomes: ["Connect overlap area to the output", "Compare continuous and discrete time"],
  },
  {
    href: "/frequency",
    index: "LAB 02",
    title: "Frequency Domain Explorer",
    description: "Compose signals and see their magnitude and phase spectra respond immediately.",
    difficulty: "Intermediate",
    accent: "#8b5cf6",
    bars: [16, 24, 36, 58, 82, 58, 36, 24, 16, 10],
    outcomes: ["Link waveform shape to spectral content", "Explore harmonics, magnitude, and phase"],
  },
  {
    href: "/sampling",
    index: "LAB 03",
    title: "Sampling & Aliasing Laboratory",
    description: "Change the sampling rate and watch reconstruction succeed or fold into an alias.",
    difficulty: "Intermediate",
    accent: "#3b82f6",
    bars: [66, 20, 58, 28, 48, 38, 38, 48, 28, 58, 20, 66],
    outcomes: ["Recognise the Nyquist threshold", "Relate spectral replicas to aliasing"],
  },
];

export default function HomePage() {
  return (
    <main className="home-shell">
      <h1 className="landing-title">Signal Studio</h1>
      <section className="lab-grid" aria-label="Signals and Systems laboratories">
        {labs.map((lab) => (
          <Link
            key={lab.href}
            href={lab.href}
            className="lab-card"
            style={{ "--card-accent": lab.accent } as CSSProperties}
          >
            <div className="lab-card-topline">
              <span className="lab-index">{lab.index}</span>
            </div>
            <div className="lab-illustration" aria-hidden="true">
              {lab.bars.map((height, index) => <span key={index} style={{ height }} />)}
            </div>
            <h2>{lab.title}</h2>
            <p className="lab-description">{lab.description}</p>
            <div className="lab-meta"><span>{lab.difficulty}</span></div>
            <ul className="outcomes">{lab.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
            <span className="lab-cta">Open laboratory <span aria-hidden="true">→</span></span>
          </Link>
        ))}
      </section>
    </main>
  );
}
