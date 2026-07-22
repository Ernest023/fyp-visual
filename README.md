# Signal Studio

Signal Studio is an interactive Signals and Systems learning application. It contains three browser-based laboratories:

- Convolution Canvas
- Frequency Domain Explorer
- Sampling & Aliasing Laboratory

## Running the project

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful verification commands:

```bash
npm run lint
npx tsc --noEmit
npm run build -- --webpack
```

## Project structure

```text
app/
  page.tsx                 Landing page
  convolution/page.tsx     Convolution laboratory orchestration and UI
  frequency/page.tsx       Frequency laboratory orchestration and UI
  sampling/page.tsx        Sampling laboratory orchestration and UI

components/
  controls/                Reusable buttons, sliders, and expression inputs
  drawing/                 Canvas-based signal drawing interface
  visualization/           Shared Plotly plot and visualization helpers

features/
  convolution/             Convolution defaults and configuration
  frequency/               Fourier types, mathematics, plot helpers, and labels
  sampling/                Sampling mathematics and spectrum plot helpers

library/                   Signal definitions, evaluation, and shared domain types
styles/                    Application-wide design tokens
```

## Code organisation guidelines

- Page files coordinate state and assemble the laboratory interface.
- Pure mathematical functions belong in the matching `features/<lab>` folder.
- Reusable interface elements belong in `components` and are grouped by purpose.
- Signal-domain logic shared by multiple laboratories belongs in `library`.
- Shared colours, borders, spacing, and radii belong in `styles/theme.ts`.
- Keep mathematical comments near the function or calculation they explain.
- Preserve the existing signal naming convention: `x` for the input, `h` for the kernel/system response, and `y` for the calculated output.

## Main technologies

- Next.js and React
- TypeScript
- Plotly for interactive plots
- KaTeX for mathematical notation
- `expr-eval` for custom signal expressions
