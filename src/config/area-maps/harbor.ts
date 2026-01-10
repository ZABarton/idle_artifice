/**
 * Harbor Area Map Configuration
 *
 * The Harbor is a coastal area with docking facilities.
 * Features include the Wharf.
 */

import { markRaw } from 'vue'
import type { AreaMapConfig } from '@/types/areaMapConfig'
import WharfFeature from '@/components/features/WharfFeature.vue'
import StatusText from '@/components/displays/StatusText.vue'

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
      interactionType: 'navigation',
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

  // Event triggers for the Harbor
  triggers: [
    // First visit to Harbor: show harbormaster intro dialog
    {
      event: 'onFirstVisit',
      description: 'Show harbormaster introduction on first Harbor visit',
      actions: [
        {
          type: 'showDialogTree',
          dialogId: 'harbormaster-intro',
        },
      ],
    },
  ],
}
