// next.js link component to move between pages in app
import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "24px" }}>
      <h1>FYP</h1>
      <p>Choose a lab:</p>

      <ul>
        <li>
          <Link href="/convolution">Convolution Lab</Link>
        </li>
        <li>
          <Link href="/frequency">Frequency Lab</Link>
        </li>
        <li>
          <Link href="/sampling">Sampling Lab</Link>
        </li>
      </ul>
    </main>
  );
}