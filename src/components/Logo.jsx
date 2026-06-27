import { useId } from "react";

const SIZES = { small: 32, medium: 48, large: 96 };

export default function Logo({ size = "medium", className = "" }) {
  const px = SIZES[size] || SIZES.medium;
  const gradId = useId();

  return (
    <svg width={px} height={px} viewBox="0 0 96 96" className={className} role="img" aria-label="ZaboniAI logo">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <circle cx="48" cy="48" r="46" fill={`url(#${gradId})`} />
      <text
        x="48"
        y="54"
        textAnchor="middle"
        fontSize="42"
        fontWeight="800"
        fill="white"
        fontFamily="Inter, system-ui, sans-serif"
      >
        Z
      </text>
      <text
        x="48"
        y="76"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="#f0a500"
        fontFamily="Inter, system-ui, sans-serif"
        letterSpacing="1.5"
      >
        AI
      </text>
    </svg>
  );
}
