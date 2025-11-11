import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { WellthLogo } from "./WellthLogo";
import { Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useState } from "react";

export const Navigation = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  const handleNavClick = (path: string) => {
    closeMenu();
    if (path.startsWith('/#')) {
      // Handle hash navigation
      const element = document.querySelector(path.substring(1));
      element?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm" aria-label="Main navigation">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="cursor-pointer group" aria-label="Wellth home">
          {/* Show full logo on desktop, icon only on mobile */}
          <div className="hidden md:block">
            <WellthLogo size="sm" showTagline className="transition-transform group-hover:scale-105" />
          </div>
          <div className="md:hidden">
            <WellthLogo variant="icon" size="sm" className="transition-transform group-hover:scale-110" />
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          <a 
            href="/#features" 
            className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
          >
            Features
          </a>
          <a 
            href="/#how-it-works" 
            className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
          >
            How It Works
          </a>
          <a 
            href="/#pricing" 
            className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
          >
            Pricing
          </a>
          <a 
            href="/install" 
            className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
          >
            Install App
          </a>
        </nav>
        
        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3" role="group" aria-label="Authentication">
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
          <Button size="sm" onClick={() => navigate('/auth')}>
            Get Started
          </Button>
        </div>

        {/* Mobile Hamburger Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              aria-label="Open navigation menu"
              aria-expanded={isOpen}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="right" 
            className="w-[300px] sm:w-[400px]"
            aria-label="Mobile navigation menu"
          >
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            
            <nav className="flex flex-col gap-6 mt-8" aria-label="Mobile navigation">
              {/* Navigation Links */}
              <div className="flex flex-col gap-4">
                <SheetClose asChild>
                  <a
                    href="/#features"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick('/#features');
                    }}
                    className="text-lg font-medium text-foreground transition-all duration-150 hover:text-primary py-2 px-4 rounded-md hover:bg-accent/5"
                  >
                    Features
                  </a>
                </SheetClose>
                
                <SheetClose asChild>
                  <a
                    href="/#how-it-works"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick('/#how-it-works');
                    }}
                    className="text-lg font-medium text-foreground transition-all duration-150 hover:text-primary py-2 px-4 rounded-md hover:bg-accent/5"
                  >
                    How It Works
                  </a>
                </SheetClose>
                
                <SheetClose asChild>
                  <a
                    href="/#pricing"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick('/#pricing');
                    }}
                    className="text-lg font-medium text-foreground transition-all duration-150 hover:text-primary py-2 px-4 rounded-md hover:bg-accent/5"
                  >
                    Pricing
                  </a>
                </SheetClose>
                
                <SheetClose asChild>
                  <a
                    href="/install"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick('/install');
                    }}
                    className="text-lg font-medium text-foreground transition-all duration-150 hover:text-primary py-2 px-4 rounded-md hover:bg-accent/5"
                  >
                    Install App
                  </a>
                </SheetClose>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-2" />

              {/* Auth Buttons */}
              <div className="flex flex-col gap-3">
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      closeMenu();
                      navigate('/auth');
                    }}
                  >
                    Sign In
                  </Button>
                </SheetClose>
                
                <SheetClose asChild>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      closeMenu();
                      navigate('/auth');
                    }}
                  >
                    Get Started
                  </Button>
                </SheetClose>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
