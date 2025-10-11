import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { WellbieAvatar } from "./WellbieAvatar";

export const Navigation = () => {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 cursor-pointer group">
          <WellbieAvatar size="sm" className="transition-transform group-hover:scale-110" />
          <div className="flex flex-col">
            <span className="text-xl font-heading font-bold text-foreground">Wellth.ai</span>
            <span className="text-[10px] text-muted-foreground -mt-1">Smarter health. Wealthier you.</span>
          </div>
        </Link>
        
        <div className="hidden items-center gap-8 md:flex">
          <a href="/#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="/#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            How It Works
          </a>
          <a href="/#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/auth'}>
            Sign In
          </Button>
          <Button size="sm" onClick={() => window.location.href = '/auth'}>
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
};
