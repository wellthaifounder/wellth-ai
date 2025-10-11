interface WellbieAvatarProps {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

export const WellbieAvatar = ({ 
  size = "md", 
  animate = false,
  className = "" 
}: WellbieAvatarProps) => {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={animate ? "animate-bounce" : ""}
      >
        {/* Wellbie - Friendly teal orb with gold accent */}
        <defs>
          <linearGradient id="wellbie-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(178, 100%, 33%)" />
            <stop offset="100%" stopColor="hsl(178, 80%, 45%)" />
          </linearGradient>
        </defs>
        
        {/* Main body - rounded friendly shape */}
        <circle cx="50" cy="50" r="40" fill="url(#wellbie-gradient)" />
        
        {/* Gold accent - small leaf/heartbeat shape */}
        <path
          d="M 50 30 Q 58 30 58 38 Q 58 42 54 46 L 50 50 L 46 46 Q 42 42 42 38 Q 42 30 50 30 Z"
          fill="hsl(43, 88%, 61%)"
        />
        
        {/* Friendly eyes */}
        <circle cx="40" cy="45" r="3" fill="white" opacity="0.9" />
        <circle cx="60" cy="45" r="3" fill="white" opacity="0.9" />
        
        {/* Gentle smile */}
        <path
          d="M 38 58 Q 50 65 62 58"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
      </svg>
    </div>
  );
};
