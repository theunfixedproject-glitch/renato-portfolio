/** Bordo luminoso animato. Va messo come primo figlio di un elemento `relative` con angoli arrotondati. */
export function BeamBorder({ onHover = false }: { onHover?: boolean }) {
  return (
    <span aria-hidden className="beam-ring" data-hover={onHover ? "" : undefined}>
      <span className="beam-spin" />
    </span>
  );
}
