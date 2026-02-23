/**
 * Academy Area Map Configuration
 *
 * The Academy is the player's home base where they manage crafting,
 * resources, and explorers. Features include the Foundry, Quartermaster, and Tavern.
 */

import { markRaw } from 'vue'
import type { AreaMapConfig, AreaTrigger } from '@/types/areaMapConfig'
import FoundryFeature from '@/components/features/FoundryFeature.vue'
import FoundryScreen from '@/components/screens/FoundryScreen.vue'
import QuartermasterFeature from '@/components/features/QuartermasterFeature.vue'
import TavernFeature from '@/components/features/TavernFeature.vue'
import StatusText from '@/components/displays/StatusText.vue'
import NavigationButton from '@/components/displays/NavigationButton.vue'
import areaTriggers from '@/config/area-triggers.json'

export const academyConfig: AreaMapConfig = {
  areaType: 'academy',
  background: '#e8dcc4', // Light beige/stone color

  // Layout configurations for different screen sizes
  layouts: {
    // Desktop layout: wider max width
    desktop: {
      mode: '2x2',
      maxFeatureWidth: 1200,
      minWidth: 1400, // Breakpoint: use this layout at 1400px and above
    },
    // Mobile layout: narrower max width
    mobile: {
      mode: '1x4',
      maxFeatureWidth: 800,
      maxWidth: 1399, // Breakpoint: use this layout below 1400px
    },
  },

  // Features in the Academy
  features: [
    {
      id: 'academy-foundry',
      type: 'foundry',
      component: markRaw(FoundryFeature),
      screenComponent: markRaw(FoundryScreen),
      name: 'Foundry',
      description: 'Craft equipment for your explorers.',
      icon: '🔨',
      state: 'unlocked',
      isActive: false,
      interactionType: 'inline',
      npcIds: ['anton'],
      minimizedDisplays: [
        {
          component: markRaw(StatusText),
          props: {
            text: 'Crafting available',
            variant: 'success',
            icon: '✓',
          },
        },
        {
          component: markRaw(NavigationButton),
          props: {
            label: 'Enter Foundry',
            featureId: 'academy-foundry',
            icon: '🔨',
            variant: 'primary',
            // disabled is now computed from feature state in FeatureCard
          },
        },
      ],
    },
    {
      id: 'academy-quartermaster',
      type: 'quartermaster',
      component: markRaw(QuartermasterFeature),
      name: 'Quartermaster',
      description: "Manage your camp's supplies.",
      icon: '📦',
      state: 'unlocked',
      isActive: false,
      interactionType: 'inline',
      npcIds: ['quartermaster'],
      minimizedDisplays: [
        {
          component: markRaw(StatusText),
          props: {
            text: 'Supplies ready',
            variant: 'success',
            icon: '✓',
          },
        },
      ],
    },
    {
      id: 'academy-tavern',
      type: 'tavern',
      component: markRaw(TavernFeature),
      name: 'Tavern',
      description: "Manage your camp's explorers.",
      icon: '🍺',
      state: 'unlocked',
      isActive: false,
      interactionType: 'navigation',
      npcIds: ['tavern-keeper'],
      minimizedDisplays: [
        {
          component: markRaw(StatusText),
          props: {
            text: 'New explorers available',
            variant: 'info',
            icon: 'ℹ️',
          },
        },
      ],
    },
  ],

  // Event triggers for the Academy - imported from area-triggers.json
  triggers: areaTriggers.triggers.filter(
    (t) => t.areaType === 'academy'
  ) as AreaTrigger[],
}
