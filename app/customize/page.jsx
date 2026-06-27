import { CustomizeBuilder } from "@/components/CustomizeBuilder";

export const metadata = {
  title: "Customize - Khud"
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
          Pick a blank, upload your artwork, tell us where it goes. We proof every design with you before
          anything is printed.
        </p>
      </section>
      <CustomizeBuilder />
    </main>
  );
}
