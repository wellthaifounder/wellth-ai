import React, { useEffect, useRef } from 'react';
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
  const promptRef = useRef<HTMLDivElement>(null);

  const hasAccess = checkFeatureAccess(requiredTier);

  useEffect(() => {
    if (!loading && !hasAccess && promptRef.current) {
      promptRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, hasAccess]);

  if (loading) {
    return <div className="animate-pulse bg-muted h-32 rounded-lg" />;
  }

  if (!hasAccess) {
    return (
      <div ref={promptRef} className="space-y-4">
        <UpgradePrompt feature={feature} requiredTier={requiredTier} description={description} />
        {blur && (
          <div className="blur-sm pointer-events-none select-none opacity-50">
            {children}
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
