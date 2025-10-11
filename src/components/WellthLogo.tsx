/**
 * WellthLogo Component
 * 
 * Primary brand logo for Wellth.ai featuring the "Wellness Pulse" concept.
 * 
 * USAGE GUIDE:
 * ------------
 * - Use this as the PRIMARY logo in navigation, marketing pages, and headers
 * - Use WellbieAvatar for conversational moments, loading states, and chat interfaces
 * 
 * VARIANTS:
 * - full: Icon + wordmark (default for desktop navigation)
 * - icon: Icon only (mobile navigation, favicons)
 * - wordmark: Wordmark only (for contexts where icon is already present)
 * 
 * COLOR MODES:
 * - color: Full brand colors (default)
 * - monochrome: Single color, inherits text color
 * - white: For dark backgrounds
 * 
 * SIZING:
 * - sm: 20px height (mobile nav)
 * - md: 32px height (desktop nav)
 * - lg: 48px height (hero sections)
 * - xl: 64px height (splash screens)
 */

interface WellthLogoProps {
  variant?: "full" | "icon" | "wordmark";
  colorMode?: "color" | "monochrome" | "white";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
}

export const WellthLogo = ({ 
  variant = "full",
  colorMode = "color",
  size = "md",
  className = "",
  showTagline = false
}: WellthLogoProps) => {
  const heights = {
    sm: "h-5",
    md: "h-8",
    lg: "h-12",
    xl: "h-16"
  };

  const renderIcon = () => {
    const primaryColor = colorMode === "white" 
      ? "white" 
      : colorMode === "monochrome" 
      ? "currentColor" 
      : "hsl(178, 100%, 33%)"; // --primary teal
    
    const accentColor = colorMode === "white" 
      ? "rgba(255,255,255,0.9)" 
      : colorMode === "monochrome" 
      ? "currentColor" 
      : "hsl(43, 88%, 61%)"; // --accent gold

    return (
      <svg
        viewBox="0 0 120 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${heights[size]} w-auto transition-transform hover:scale-105`}
      >
        {/* W Lettermark */}
        <path
          d="M 15 10 L 25 70 L 40 30 L 60 65 L 80 30 L 95 70 L 105 10"
          stroke={primaryColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Wellness Pulse Line - integrated through center */}
        <path
          d="M 25 40 L 35 40 L 40 30 L 45 50 L 50 38 L 60 38 L 65 50 L 70 30 L 75 40 L 95 40"
          stroke={accentColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.95"
        />
      </svg>
    );
  };

  const renderWordmark = () => {
    const textColor = colorMode === "white" 
      ? "text-white" 
      : colorMode === "monochrome" 
      ? "text-current" 
      : "text-secondary";

    return (
      <div className="flex flex-col">
        <span className={`font-heading font-bold ${textColor} ${
          size === 'sm' ? 'text-xl' : 
          size === 'md' ? 'text-2xl' : 
          size === 'lg' ? 'text-4xl' : 
          'text-5xl'
        }`}>
          Wellth.ai
        </span>
        {showTagline && (
          <span className={`${
            colorMode === "white" ? "text-white/70" : "text-muted-foreground"
          } ${
            size === 'sm' ? 'text-[10px] -mt-1' : 
            size === 'md' ? 'text-xs -mt-1' : 
            'text-sm -mt-1.5'
          }`}>
            Smarter health. Wealthier you.
          </span>
        )}
      </div>
    );
  };

  if (variant === "icon") {
    return <div className={className}>{renderIcon()}</div>;
  }

  if (variant === "wordmark") {
    return <div className={className}>{renderWordmark()}</div>;
  }

  // Full variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {renderIcon()}
      {renderWordmark()}
    </div>
  );
};
