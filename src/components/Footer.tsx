import { WellbieAvatar } from "./WellbieAvatar";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <WellbieAvatar size="sm" />
              <div className="flex flex-col">
                <span className="text-xl font-heading font-bold">Wellth.ai</span>
                <span className="text-xs text-muted-foreground -mt-0.5">Smarter health. Wealthier you.</span>
              </div>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Your financial health companion. Optimize medical spending, maximize HSA benefits and rewards through smart automation and AI insights.
            </p>
            <p className="text-xs text-muted-foreground">
              © 2025 Wellth.ai. All rights reserved.
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Features</a></li>
              <li><a href="#" className="hover:text-foreground">Pricing</a></li>
              <li><a href="#" className="hover:text-foreground">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">About</a></li>
              <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
