import Link from 'next/link';

// Provisional home — the full showcase (fluid background, draggable cards…) lands in a later phase.
export default function Home() {
  return (
    <main className="home">
      <section className="hero">
        <p className="doc-eyebrow">Vizzele UI · v0.1</p>
        <h1 className="vz-display hero-title">
          Liquid light
          <br />
          <span className="vz-text-iridescent" data-animate>
            for the web
          </span>
        </h1>
        <p className="hero-lead">
          Components, gestures and effects with weight, inertia and iridescence. Throw them. Stretch
          them. Watch them catch the light.
        </p>
        <div className="demo-row hero-ctas">
          <Link
            href="/docs"
            className="vz-button"
            data-variant="liquid"
            data-size="lg"
            data-vz-magnetic
          >
            Get started
          </Link>
          <Link
            href="/docs/magnetic"
            className="vz-button"
            data-variant="holo"
            data-size="lg"
            data-vz-magnetic
          >
            Browse components
          </Link>
        </div>
      </section>
    </main>
  );
}
