import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Check, Crown, Sparkles } from "lucide-react";
import { formatDistance } from "date-fns";

export const SubscriptionManagement = () => {
  const { tier, isSubscribed, subscriptionEnd, createCheckoutSession, openCustomerPortal, loading } = useSubscription();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const tierInfo = {
    free: {
      name: 'Starter',
      icon: <Sparkles className="h-5 w-5" />,
      color: 'secondary',
    },
    plus: {
      name: 'Plus',
      icon: <Check className="h-5 w-5" />,
      color: 'default',
    },
    premium: {
      name: 'Premium',
      icon: <Crown className="h-5 w-5" />,
      color: 'default',
    },
  };

  const currentTier = tierInfo[tier];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              {tier === 'free' ? 'Manage your subscription and upgrade options' : 'Manage your subscription'}
            </CardDescription>
          </div>
          <Badge variant={currentTier.color as any} className="flex items-center gap-2">
            {currentTier.icon}
            {currentTier.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {tier === 'free' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You're currently on the free Starter plan with up to 50 expenses per month.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Plus</CardTitle>
                  <CardDescription>$19/month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Unlimited expenses
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      OCR automation
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Advanced analytics
                    </li>
                  </ul>
                  <Button 
                    onClick={() => createCheckoutSession('plus')} 
                    className="w-full"
                  >
                    Upgrade to Plus
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Premium
                  </CardTitle>
                  <CardDescription>$49/month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Everything in Plus
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      AI-powered insights
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Tax optimization
                    </li>
                  </ul>
                  <Button 
                    onClick={() => createCheckoutSession('premium')} 
                    className="w-full"
                  >
                    Upgrade to Premium
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {isSubscribed && subscriptionEnd && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                Your subscription renews{' '}
                {formatDistance(new Date(subscriptionEnd), new Date(), { addSuffix: true })}
              </p>
            </div>
            <Button onClick={openCustomerPortal} variant="outline" className="w-full">
              Manage Billing & Subscription
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Update payment method, view billing history, or cancel subscription
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
