import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { WellthLogo } from "./WellthLogo";

export const Navigation = () => {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="cursor-pointer group">
          {/* Show full logo on desktop, icon only on mobile */}
          <div className="hidden md:block">
            <WellthLogo size="sm" showTagline className="transition-transform group-hover:scale-105" />
          </div>
          <div className="md:hidden">
            <WellthLogo variant="icon" size="sm" className="transition-transform group-hover:scale-110" />
          </div>
        </Link>
        
        <div className="hidden items-center gap-8 md:flex">
          <a href="/#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="/#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            How It Works
          </a>
          <a href="/hsa-eligibility" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            HSA Guide
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
