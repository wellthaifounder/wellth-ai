import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { UpgradePrompt } from './UpgradePrompt';

interface FeatureGateProps {
  requiredTier: 'plus' | 'premium';
  feature: string;
  description?: string;
  children: React.ReactNode;
  blur?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  requiredTier,
  feature,
  description,
  children,
  blur = true,
}) => {
  const { checkFeatureAccess, loading } = useSubscription();

  if (loading) {
    return <div className="animate-pulse bg-muted h-32 rounded-lg" />;
  }

  const hasAccess = checkFeatureAccess(requiredTier);

  if (!hasAccess) {
    return (
      <div className="relative">
        {blur && (
          <div className="blur-sm pointer-events-none select-none opacity-50">
            {children}
          </div>
        )}
        <div className={blur ? "absolute inset-0 flex items-center justify-center p-4" : ""}>
          <UpgradePrompt feature={feature} requiredTier={requiredTier} description={description} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
