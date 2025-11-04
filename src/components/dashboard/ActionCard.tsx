import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface ActionCardProps {
  icon: string;
  title: string;
  count?: number;
  children: React.ReactNode;
  actions?: React.ReactNode;
  defaultOpen?: boolean;
  headerContent?: React.ReactNode;
  buttonText?: string;
}

export function ActionCard({ icon, title, count, children, actions, defaultOpen = false, headerContent, buttonText = 'Show all' }: ActionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <CardTitle className="text-lg">
              {title} {count !== undefined && `(${count})`}
            </CardTitle>
          </div>
          {actions}
        </div>
        {headerContent && (
          <div className="mt-4">
            {headerContent}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between mb-4">
              <span>{isOpen ? 'Hide details' : buttonText}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {children}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
