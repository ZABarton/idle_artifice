/**
 * Harbor Area Map Configuration
 *
 * The Harbor is a coastal area with docking facilities.
 * Features include the Wharf.
 */

import { markRaw } from 'vue'
import type { AreaMapConfig, AreaTrigger } from '@/types/areaMapConfig'
import WharfFeature from '@/components/features/WharfFeature.vue'
import StatusText from '@/components/displays/StatusText.vue'
import areaTriggers from '@/config/area-triggers.json'

export const harborConfig: AreaMapConfig = {
  areaType: 'harbor',
  background: '#d3d3d3', // Light gray

  // Layout configurations for different screen sizes
  layouts: {
    // Desktop layout: single centered feature
    desktop: {
      mode: '1x2',
      maxFeatureWidth: 1200,
      minWidth: 1400,
    },
    // Mobile layout: same as desktop (single feature)
    mobile: {
      mode: '1x2',
      maxFeatureWidth: 800,
      maxWidth: 1399,
    },
  },

  // Features in the Harbor
  features: [
    {
      id: 'harbor-wharf',
      type: 'wharf',
      component: markRaw(WharfFeature),
      name: 'The Wharf',
      icon: '⚓',
      state: 'locked',
      isActive: false,
      interactionType: 'inline',
      minimizedDisplays: [
        {
          component: markRaw(StatusText),
          props: {
            text: 'Locked - Complete prerequisites to access',
            variant: 'warning',
            icon: '🔒',
          },
        },
      ],
    },
  ],

  // Event triggers for the Harbor - imported from area-triggers.json
  triggers: areaTriggers.triggers.filter(
    (t) => t.areaType === 'harbor'
  ) as AreaTrigger[],
}
