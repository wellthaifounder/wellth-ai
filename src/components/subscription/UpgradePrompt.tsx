import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Sparkles } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface UpgradePromptProps {
  feature: string;
  requiredTier: 'plus' | 'premium';
  description?: string;
}

export const UpgradePrompt = ({ feature, requiredTier, description }: UpgradePromptProps) => {
  const { createCheckoutSession } = useSubscription();

  const tierInfo = {
    plus: {
      name: 'Plus',
      price: '$19/month',
      features: ['Unlimited expenses', 'OCR automation', 'Advanced analytics', 'Rewards optimization'],
    },
    premium: {
      name: 'Premium',
      price: '$49/month',
      features: ['Everything in Plus', 'Auto-submit reimbursements', 'Tax optimization', 'API access'],
    },
  };

  const info = tierInfo[requiredTier];

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <CardTitle>{feature}</CardTitle>
        </div>
        <CardDescription>
          {description || `Upgrade to ${info.name} to unlock this feature`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {info.name} - {info.price}
          </p>
          <ul className="space-y-1">
            {info.features.map((f, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <Button onClick={() => createCheckoutSession(requiredTier)} className="w-full">
          Upgrade to {info.name}
        </Button>
      </CardContent>
    </Card>
  );
};
