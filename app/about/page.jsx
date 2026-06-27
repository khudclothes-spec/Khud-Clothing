import Link from "next/link";
import { ArrowRight, Check } from "@/components/Icons";
import { aboutBlocks, promises } from "@/lib/data";

export const metadata = {
  title: "About - Khud"
};

export default function AboutPage() {
  return (
    <main>
      <section className="container container--narrow about-hero">
        <img src="/images/logo-black-writing.png" alt="Khud" />
        <h1 className="display display--large">The mark you leave.</h1>
        <p>
          Khud takes its name from the Urdu word for <strong>yourself</strong>. We build clothing around
          that single idea: that what you wear should carry something of who you are.
        </p>
      </section>

      <section className="container" style={{ paddingTop: 40, paddingBottom: 90 }}>
        <div className="about-grid">
          {aboutBlocks.map((block) => (
            <article className="about-block" key={block.no}>
              <div className="about-block__no">{block.no}</div>
              <h2>{block.title}</h2>
              <p>{block.body}</p>
            </article>
          ))}
        </div>

        <div className="promise-panel">
          <h2 className="display display--section" style={{ color: "var(--bone)" }}>
            Our quality
            <br />
            promise.
          </h2>
          <div className="promise-list">
            {promises.map((promise) => (
              <div className="promise-item" key={promise.title}>
                <Check />
                <div>
                  <div className="promise-item__title">{promise.title}</div>
                  <div className="promise-item__body">{promise.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="about-cta">
          <Link href="/customize" className="button button--outline">
            Make your imprint
            <ArrowRight />
          </Link>
        </div>
      </section>
    </main>
  );
}
