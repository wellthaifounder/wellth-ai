import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureTooltipProps {
  title: string;
  description: string;
  show: boolean;
  onDismiss: () => void;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  children?: React.ReactNode;
  ctaText?: string;
  onCtaClick?: () => void;
}

export function FeatureTooltip({
  title,
  description,
  show,
  onDismiss,
  position = "bottom",
  className,
  children,
  ctaText,
  onCtaClick,
}: FeatureTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!show) return;
    const updatePosition = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const offset = 8;
      switch (position) {
        case "top":
          setCoords({ top: rect.top - offset, left: rect.left + rect.width / 2 });
          break;
        case "left":
          setCoords({ top: rect.top + rect.height / 2, left: rect.left - offset });
          break;
        case "right":
          setCoords({ top: rect.top + rect.height / 2, left: rect.right + offset });
          break;
        default:
          setCoords({ top: rect.bottom + offset, left: rect.left + rect.width / 2 });
      }
    };
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [show, position]);

  useEffect(() => {
    if (show) {
      // Delay to allow for smooth entrance animation
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  return (
    <div className="relative">
      <div ref={triggerRef} className="inline-block">
        {children}
      </div>
      {show &&
        createPortal(
          <div
            className={cn(
              "fixed z-[var(--z-toast)] transition-all duration-300",
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
              position === "bottom" && "-translate-x-1/2",
              position === "top" && "-translate-x-1/2 -translate-y-full",
              position === "left" && "-translate-x-full -translate-y-1/2",
              position === "right" && "-translate-y-1/2"
            )}
            style={{ top: coords.top, left: coords.left }}
          >
            <Card
              className={cn(
                "relative w-80 p-4 shadow-lg border-2 border-primary/50 bg-background",
                className
              )}
            >
              <button
                onClick={onDismiss}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss tooltip"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-3 pr-6">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {ctaText && onCtaClick && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onCtaClick();
                        onDismiss();
                      }}
                      className="flex-1"
                    >
                      {ctaText}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onDismiss}
                    className={cn(!ctaText && "flex-1")}
                  >
                    Got it
                  </Button>
                </div>
              </div>

              {/* Arrow indicator */}
              <div
                className={cn(
                  "absolute w-3 h-3 bg-background border-primary/50 rotate-45",
                  position === "bottom" && "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-2 border-l-2",
                  position === "top" && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-b-2 border-r-2",
                  position === "left" && "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-t-2 border-r-2",
                  position === "right" && "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-b-2 border-l-2"
                )}
              />
            </Card>
          </div>,
          document.body
        )}
    </div>
  );
}