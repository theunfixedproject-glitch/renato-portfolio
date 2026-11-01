import Image from "next/image";

type PhoneFrameProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Proporzioni dello schermo, es. "12/25". Di base quelle di un telefono (9/20). */
  aspect?: string;
};

/** Cornice da smartphone per gli screenshot verticali. */
export function PhoneFrame({ src, alt, className = "", sizes = "220px", priority, aspect = "9/20" }: PhoneFrameProps) {
  return (
    <div
      style={{ aspectRatio: aspect }}
      className={`relative overflow-hidden rounded-[1.6rem] border-[5px] border-[#1c1c24] bg-black shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10 ${className}`}
    >
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />
    </div>
  );
}
