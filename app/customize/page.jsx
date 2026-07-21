import { CustomStudio } from "@/components/CustomStudio";
import { OG_IMAGE } from "@/lib/seo";

export const metadata = {
  title: "Customize",
  description: "Design your own apparel in the Char Meem custom studio — add text and artwork to any printable area, approve your proof, and add it to your bag.",
  alternates: { canonical: "/customize" },
  openGraph: { url: "/customize", type: "website", title: "The Custom Studio — Char Meem Clothing", description: "Design your own apparel — add text and artwork, approve your proof, and order.", images: [OG_IMAGE] }
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
        <p className="studio-device-note" role="note">
          <span aria-hidden="true">💻</span> For the best experience, design on a laptop or a larger screen.
        </p>
      </section>
      <CustomStudio />
    </main>
  );
}
