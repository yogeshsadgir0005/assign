import Image from "next/image";

type Props = { src?: string; title: string; size: number; className?: string };

/** Products added in-session may have no image; a letter tile beats a broken one. */
export function Thumb({ src, title, size, className = "" }: Props) {
  const box = `shrink-0 border border-line bg-sunken object-contain ${className}`;

  if (!src) {
    return (
      <div
        aria-hidden
        style={{ width: size, height: size, fontSize: Math.round(size / 2.6) }}
        className={`${box} flex items-center justify-center font-medium text-ink-3`}
      >
        {title.trim().charAt(0).toUpperCase() || "?"}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={box}
      unoptimized
    />
  );
}
