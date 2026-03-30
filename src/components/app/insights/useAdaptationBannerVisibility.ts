import React from 'react';
import type { AdaptationProgress } from '../../../hooks/analysis/useLanguageAdapter';

export function useAdaptationBannerVisibility(adaptationProgress?: AdaptationProgress) {
  const [bannerDismissed, setBannerDismissed] = React.useState(false);

  React.useEffect(() => {
    if (adaptationProgress?.active && adaptationProgress.active !== 'idle') {
      setBannerDismissed(false);
    }
  }, [adaptationProgress?.active]);

  return {
    showBanner: !!adaptationProgress && adaptationProgress.active !== 'idle' && !bannerDismissed,
    dismissBanner: () => setBannerDismissed(true),
  };
}
