/**
 * Harbor Area Map Configuration
 *
 * The Harbor is a coastal area with docking facilities.
 * Features include the Wharf.
 */

import { markRaw } from 'vue'
import type { AreaMapConfig } from '@/types/areaMapConfig'
import WharfFeature from '@/components/features/WharfFeature.vue'

export const harborConfig: AreaMapConfig = {
  areaType: 'harbor',
  background: '#d3d3d3', // Light gray

  // Layout configurations for different screen sizes
  layouts: {
    // Desktop layout: single centered feature
    desktop: {
      mode: '1x2',
      viewBoxWidth: 300,
      viewBoxHeight: 300,
      canvasWidth: 1600,
      canvasHeight: 1200,
      minWidth: 1400,
    },
    // Mobile layout: same as desktop (single feature)
    mobile: {
      mode: '1x2',
      viewBoxWidth: 300,
      viewBoxHeight: 300,
      canvasWidth: 1000,
      canvasHeight: 1200,
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
      positions: {
        desktop: { x: 0, y: 0 }, // Centered
        mobile: { x: 0, y: 0 }, // Centered
      },
      state: 'locked',
      isActive: false,
      interactionType: 'navigation',
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
