import Link from "next/link";
import { ArrowRight, Check } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { aboutBlocks, promises } from "@/lib/data";
import { OG_IMAGE } from "@/lib/seo";

export const metadata = {
  title: "About",
  description: "Char Meem Clothing is four founders and one shared initial. The name means four Ms. Intentional clothing in small runs, plus a custom studio for pieces that are only yours.",
  alternates: { canonical: "/about" },
  openGraph: { url: "/about", type: "website", title: "About — Char Meem Clothing", description: "Four founders, one shared initial. The story behind Char Meem Clothing.", images: [OG_IMAGE] }
};

export default function AboutPage() {
  return (
    <main>
      <section className="container container--narrow about-hero" data-reveal>
        <img src="/images/charmeem-logo-black.png" alt="Char Meem Clothing logo — the 4م monogram" />
        <h1 className="display display--large">Four names, one letter.</h1>
        <p>
          Char Meem Clothing is four founders and one shared initial. Char meem means{" "}
          <strong>four Ms</strong>: a headcount, not a slogan. We make intentional clothing in small
          runs, and a custom studio where you can make a piece that is only yours.
        </p>
      </section>

      <section className="container" style={{ paddingTop: 40, paddingBottom: 90 }}>
        <div className="about-grid" data-reveal>
          {aboutBlocks.map((block) => (
            <article className="about-block" key={block.no}>
              <div className="about-block__no">{block.no}</div>
              <h2>{block.title}</h2>
              <p>{block.body}</p>
            </article>
          ))}
        </div>

        <Reveal delay={0.1}>
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
        </Reveal>

        <Reveal delay={0.08} className="about-cta">
          <Link href="/customize" className="button button--outline">
            Make your imprint
            <ArrowRight />
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
