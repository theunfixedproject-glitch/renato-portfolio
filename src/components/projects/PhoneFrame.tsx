import Image from "next/image";

type PhoneFrameProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** Cornice da smartphone per gli screenshot verticali. */
export function PhoneFrame({ src, alt, className = "", sizes = "220px", priority }: PhoneFrameProps) {
  return (
    <div
      className={`relative aspect-[9/20] overflow-hidden rounded-[1.6rem] border-[5px] border-[#1c1c24] bg-black shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10 ${className}`}
    >
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />
    </div>
  );
}
