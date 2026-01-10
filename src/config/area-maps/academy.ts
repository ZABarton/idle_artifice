/**
 * Academy Area Map Configuration
 *
 * The Academy is the player's home base where they manage crafting,
 * resources, and explorers. Features include the Foundry, Quartermaster, and Tavern.
 */

import { markRaw } from 'vue'
import type { AreaMapConfig } from '@/types/areaMapConfig'
import FoundryFeature from '@/components/features/FoundryFeature.vue'
import QuartermasterFeature from '@/components/features/QuartermasterFeature.vue'
import TavernFeature from '@/components/features/TavernFeature.vue'
import NPCIndicator from '@/components/displays/NPCIndicator.vue'
import StatusText from '@/components/displays/StatusText.vue'

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
      name: 'Foundry',
      description: 'Craft equipment for your explorers.',
      icon: '🔨',
      state: 'unlocked',
      isActive: false,
      interactionType: 'navigation',
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
      minimizedDisplays: [
        {
          component: markRaw(NPCIndicator),
          props: {
            npcName: 'Quartermaster Jones',
            icon: '📦',
            hasAvailableConversation: false,
            showBadge: false,
          },
        },
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
      minimizedDisplays: [
        {
          component: markRaw(NPCIndicator),
          props: {
            npcName: 'Tavern Keeper',
            icon: '🍺',
            hasAvailableConversation: true,
            showBadge: true,
            badgeText: '!',
          },
        },
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

  // Event triggers for the Academy
  triggers: [
    // First visit to Academy: show intro dialog and complete objective
    {
      event: 'onFirstVisit',
      description: 'Show headmaster introduction on first Academy visit',
      actions: [
        {
          type: 'showDialogTree',
          dialogId: 'headmaster-intro',
        },
        {
          type: 'completeObjective',
          objectiveId: 'visit-academy',
        },
      ],
    },

    // Foundry interaction: show foundry master dialog and update objective
    {
      event: 'onFeatureInteract',
      featureId: 'academy-foundry',
      description: 'Show foundry master introduction on first foundry interaction',
      callback: async (context) => {
        const { dialogs } = context.stores

        // Only show dialog if haven't completed the dialog tree yet
        if (!dialogs.hasCompletedDialogTree('foundry-master-intro')) {
          await dialogs.showDialogTree('foundry-master-intro')
        }
      },
    },

    // Quartermaster interaction: show quartermaster dialog and update objective
    {
      event: 'onFeatureInteract',
      featureId: 'academy-quartermaster',
      description: 'Show quartermaster introduction on first quartermaster interaction',
      callback: async (context) => {
        const { dialogs } = context.stores

        // Only show dialog if haven't completed the dialog tree yet
        if (!dialogs.hasCompletedDialogTree('quartermaster-intro')) {
          await dialogs.showDialogTree('quartermaster-intro')
        }
      },
    },

    // Tavern interaction: show tavern keeper dialog and update objective
    {
      event: 'onFeatureInteract',
      featureId: 'academy-tavern',
      description: 'Show tavern keeper introduction on first tavern interaction',
      callback: async (context) => {
        const { dialogs } = context.stores

        // Only show dialog if haven't completed the dialog tree yet
        if (!dialogs.hasCompletedDialogTree('tavern-keeper-intro')) {
          await dialogs.showDialogTree('tavern-keeper-intro')
        }
      },
    },
  ],
}
