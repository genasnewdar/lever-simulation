import Image from "next/image";

interface LogoProps {
  className?: string;
  /** Height of the logo in pixels. Default: 40. Width auto-scales by aspect ratio. */
  size?: number;
  priority?: boolean;
}

const W = 1865;
const H = 1140;

/**
 * Lever edu brand mark — renders the official `/logo.png` asset.
 * Use everywhere a logo is needed.
 */
export function Logo({ className = "", size = 40, priority = false }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Lever edu"
      width={W}
      height={H}
      priority={priority}
      className={className}
      style={{ height: size, width: "auto" }}
    />
  );
}

export default Logo;
