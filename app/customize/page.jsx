import { CustomStudio } from "@/components/CustomStudio";

export const metadata = {
  title: "Customize",
  description: "Design your own apparel in the Khud Custom Studio — add text and artwork to any printable area, approve your proof, and add it to your bag.",
  alternates: { canonical: "/customize" },
  openGraph: { url: "/customize", title: "The Custom Studio — Khud", description: "Design your own apparel — add text and artwork, approve your proof, and order." }
};

export default function CustomizePage() {
  return (
    <main>
      <section className="container builder-title">
        <div className="eyebrow eyebrow--brass">The Custom Studio</div>
        <h1 className="display display--large">
          Design <span className="italic-clay">yourself</span>.
        </h1>
        <p>
          Add text and artwork to any printable area, drag it into place, then approve your final
          proof before it goes in your bag.
        </p>
      </section>
      <CustomStudio />
    </main>
  );
}
