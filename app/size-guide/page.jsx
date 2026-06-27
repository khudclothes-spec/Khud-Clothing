import { fitCards, measureTips, sizeRows } from "@/lib/data";

export const metadata = {
  title: "Size Guide - Khud"
};

export default function SizeGuidePage() {
  return (
    <main className="container container--narrow" style={{ paddingBottom: 90 }}>
      <section className="page-title" style={{ marginBottom: 40 }}>
        <div className="eyebrow">Fit and Sizing</div>
        <h1 className="display display--large">Size guide.</h1>
        <p style={{ maxWidth: 560, fontSize: 15.5, lineHeight: 1.6 }}>
          All measurements in inches, laid flat. Khud tees and hoodies run{" "}
          <strong style={{ color: "var(--ink)" }}>oversized</strong> by design. Size down for a regular fit.
        </p>
      </section>

      <div className="size-table-wrap">
        <table className="size-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>Chest</th>
              <th>Length</th>
              <th>Shoulder</th>
              <th>Sleeve</th>
            </tr>
          </thead>
          <tbody>
            {sizeRows.map((row) => (
              <tr key={row.size}>
                <td>{row.size}</td>
                <td>{row.chest}</td>
                <td>{row.length}</td>
                <td>{row.shoulder}</td>
                <td>{row.sleeve}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="fit-grid">
        {fitCards.map((card) => (
          <article className="fit-card" key={card.title}>
            <div className="fit-card__icon">{card.icon}</div>
            <div className="fit-card__title">{card.title}</div>
            <div className="fit-card__body">{card.body}</div>
          </article>
        ))}
      </div>

      <section className="measure-section">
        <h2 className="display display--section" style={{ fontSize: "clamp(28px, 4vw, 44px)", marginBottom: 28 }}>
          How to measure.
        </h2>
        <div className="measure-grid">
          {measureTips.map((tip) => (
            <article className="measure-card" key={tip.no}>
              <div className="measure-card__no">{tip.no}</div>
              <div className="measure-card__title">{tip.title}</div>
              <div className="measure-card__body">{tip.body}</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
