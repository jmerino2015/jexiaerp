import React from "react";

interface JexiaLogoProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
  className?: string;
  showTagline?: boolean;
}

export function JexiaLogo({
  width = 180,
  height = 50,
  className = "",
  showTagline = true,
  ...props
}: JexiaLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 350 96"
      width={width}
      height={height}
      fill="none"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient
          id="barOrangeLight"
          x1="18"
          y1="54"
          x2="32"
          y2="78"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient
          id="barBlueLight"
          x1="38"
          y1="40"
          x2="52"
          y2="78"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient
          id="barGreenLight"
          x1="58"
          y1="18"
          x2="72"
          y2="78"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path
        d="M25 71C25 77 34 80 45 80C56 80 65 77 65 71"
        stroke="#CBD5E1"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <rect x="18" y="54" width="14" height="24" rx="7" fill="url(#barOrangeLight)" />
      <rect x="38" y="40" width="14" height="38" rx="7" fill="url(#barBlueLight)" />
      <rect x="58" y="18" width="14" height="60" rx="7" fill="url(#barGreenLight)" />
      <text
        x="88"
        y="55"
        fill="#0F172A"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="37"
        fontWeight="900"
        letterSpacing="-0.03em"
      >
        Jexia
      </text>
      <text
        x="188"
        y="55"
        fill="#10B981"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="37"
        fontWeight="700"
        letterSpacing="-0.02em"
      >
        ERP
      </text>
      {showTagline && (
        <text
          x="90"
          y="74"
          fill="#64748B"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="11.5"
          fontWeight="600"
          letterSpacing="0.03em"
        >
          Ordena, controla y haz crecer tu negocio
        </text>
      )}
    </svg>
  );
}

export default JexiaLogo;
