import Image from "next/image";

export function EntityImage({
  src,
  alt,
  size = 40,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  size?: number;
  className?: string;
}) {
  if (!src) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-foreground)] ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {alt.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={`shrink-0 rounded-lg object-cover ${className}`}
        unoptimized
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`shrink-0 rounded-lg object-cover ${className}`}
    />
  );
}
