import type { ProjectVideo } from "@/lib/data";

/** Un video con la sua didascalia. Parte solo se lo si avvia: niente audio a sorpresa. */
function Clip({ video, className = "" }: { video: ProjectVideo; className?: string }) {
  const vertical = video.aspect === "9/16";
  return (
    <figure className={className}>
      <div
        className={`overflow-hidden bg-black shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] ${
          vertical ? "rounded-[1.6rem] border-[5px] border-[#1c1c24] ring-1 ring-white/10" : "rounded-2xl border border-line"
        }`}
        style={{ aspectRatio: video.aspect }}
      >
        <video src={video.src} poster={video.poster} controls playsInline preload="metadata" className="h-full w-full object-cover">
          Il tuo browser non riesce a riprodurre questo video.
        </video>
      </div>
      <figcaption className="mt-3">
        <span className="block text-sm font-semibold">{video.title}</span>
        <span className="block text-xs text-mist">{video.caption}</span>
      </figcaption>
    </figure>
  );
}

/** Lo spot principale grande, sotto la versione verticale e le altre. */
export function VideoShowcase({ videos }: { videos: ProjectVideo[] }) {
  const [main, ...rest] = videos;
  const vertical = rest.filter((v) => v.aspect === "9/16");
  const horizontal = rest.filter((v) => v.aspect === "16/9");
  return (
    <div className="space-y-6">
      <Clip video={main} />
      <div className="grid grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] items-start gap-4 sm:gap-6">
        {vertical.map((v) => (
          <Clip key={v.src} video={v} />
        ))}
        <div className="space-y-6">
          {horizontal.map((v) => (
            <Clip key={v.src} video={v} />
          ))}
        </div>
      </div>
    </div>
  );
}
