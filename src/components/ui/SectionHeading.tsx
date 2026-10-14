import { Reveal } from "./Reveal";

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
};

export function SectionHeading({ id, eyebrow, title, intro }: SectionHeadingProps) {
  return (
    <Reveal className="mb-14 max-w-3xl md:mb-20">
      <p className="eyebrow mb-5">{eyebrow}</p>
      <h2 id={id} className="heading">
        {title}
      </h2>
      {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">{intro}</p>}
    </Reveal>
  );
}
