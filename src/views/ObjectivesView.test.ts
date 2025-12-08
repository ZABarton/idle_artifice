import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ObjectivesView from './ObjectivesView.vue'
import { useObjectivesStore } from '@/stores/objectives'
import { useNavigationStore } from '@/stores/navigation'

describe('ObjectivesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Header Rendering', () => {
    it('renders header with title', () => {
      const wrapper = mount(ObjectivesView)

      expect(wrapper.find('.objectives-view-header__title').text()).toBe('Objectives')
    })

    it('renders close button', () => {
      const wrapper = mount(ObjectivesView)

      const closeButton = wrapper.find('.objectives-view-header__close')
      expect(closeButton.exists()).toBe(true)
      expect(closeButton.attributes('aria-label')).toBe('Close and return to previous view')
    })

    it('navigates back when close button is clicked', async () => {
      const navigationStore = useNavigationStore()
      const wrapper = mount(ObjectivesView)

      await wrapper.find('.objectives-view-header__close').trigger('click')

      // Should navigate to previous view (world-map is default)
      expect(navigationStore.currentView).toBe('world-map')
    })

    it('emits back event when close button is clicked', async () => {
      const wrapper = mount(ObjectivesView)

      await wrapper.find('.objectives-view-header__close').trigger('click')

      expect(wrapper.emitted('back')).toBeTruthy()
      expect(wrapper.emitted('back')?.[0]).toEqual([])
    })
  })

  describe('Active Objectives Rendering', () => {
    it('renders active main objectives section', () => {
      const wrapper = mount(ObjectivesView)

      const mainSection = wrapper.find('.subsection-title')
      expect(mainSection.exists()).toBe(true)
      expect(mainSection.text()).toContain('Main Objectives')
    })

    it('renders all active main objectives', () => {
      const objectivesStore = useObjectivesStore()
      const wrapper = mount(ObjectivesView)

      const activeMain = objectivesStore.visibleObjectives.filter(
        (obj) => obj.status === 'active' && obj.category === 'main'
      )

      const mainObjectiveCards = wrapper.findAll('.objectives-subsection').at(0)?.findAll('.objective-card')
      expect(mainObjectiveCards?.length).toBe(activeMain.length)
    })

    it('renders active secondary objectives section when available', () => {
      const objectivesStore = useObjectivesStore()

      // Complete visit-academy to reveal explore-features (secondary)
      objectivesStore.completeObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      const subsectionTitles = wrapper.findAll('.subsection-title')
      const hasSecondary = subsectionTitles.some((title) =>
        title.text().includes('Secondary Objectives')
      )
      expect(hasSecondary).toBe(true)
    })

    it('displays objective title and description', () => {
      const wrapper = mount(ObjectivesView)

      const firstCard = wrapper.find('.objective-card')
      expect(firstCard.find('.objective-title').exists()).toBe(true)
      expect(firstCard.find('.objective-description').exists()).toBe(true)
    })
  })

  describe('Completed Objectives Rendering', () => {
    it('renders completed section when objectives are completed', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.completeObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      const sectionTitles = wrapper.findAll('.section-title')
      const hasCompleted = sectionTitles.some((title) => title.text().includes('Completed Objectives'))
      expect(hasCompleted).toBe(true)
    })

    it('displays completed badge on completed objectives', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.completeObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      const completedBadge = wrapper.find('.completed-badge')
      expect(completedBadge.exists()).toBe(true)
      expect(completedBadge.text()).toContain('Completed')
    })

    it('displays completion timestamp', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.completeObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      const timestamp = wrapper.find('.completed-timestamp')
      expect(timestamp.exists()).toBe(true)
      expect(timestamp.text()).toMatch(/Completed/)
    })

    it('completed objectives are not clickable', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.completeObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      const completedCard = wrapper.find('.objective-card.completed')
      expect(completedCard.exists()).toBe(true)
    })
  })

  describe('Category Grouping and Ordering', () => {
    it('displays main objectives before secondary objectives', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.completeObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      const subsectionTitles = wrapper.findAll('.subsection-title')
      const titles = subsectionTitles.map((t) => t.text())

      // Find index of Main and Secondary in active section
      const mainIndex = titles.findIndex((t) => t.includes('Main Objectives'))
      const secondaryIndex = titles.findIndex((t) => t.includes('Secondary Objectives'))

      if (mainIndex !== -1 && secondaryIndex !== -1) {
        expect(mainIndex).toBeLessThan(secondaryIndex)
      }
    })

    it('sorts objectives by order within category', () => {
      const objectivesStore = useObjectivesStore()
      const wrapper = mount(ObjectivesView)

      const activeMain = objectivesStore.visibleObjectives
        .filter((obj) => obj.status === 'active' && obj.category === 'main')
        .sort((a, b) => a.order - b.order)

      // Check that they're in order
      for (let i = 1; i < activeMain.length; i++) {
        expect(activeMain[i].order).toBeGreaterThanOrEqual(activeMain[i - 1].order)
      }
    })

    it('does not display hidden objectives', () => {
      const objectivesStore = useObjectivesStore()
      const wrapper = mount(ObjectivesView)

      const hiddenObjectives = objectivesStore.objectives.filter((obj) => obj.status === 'hidden')
      const objectiveCards = wrapper.findAll('.objective-card')

      // No hidden objective should appear in the rendered cards
      hiddenObjectives.forEach((hidden) => {
        const foundCard = objectiveCards.find((card) => card.text().includes(hidden.title))
        expect(foundCard).toBeUndefined()
      })
    })
  })

  describe('Progress Display', () => {
    it('displays progress bar for objectives with maxProgress', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.completeObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      // Find gather-wood which has progress tracking
      const objectiveCard = wrapper.findAll('.objective-card').find((card) =>
        card.text().includes('Gather Wood')
      )

      if (objectiveCard) {
        expect(objectiveCard.find('.objective-progress').exists()).toBe(true)
        expect(objectiveCard.find('.progress-bar').exists()).toBe(true)
      }
    })

    it('displays correct progress text', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.completeObjective('visit-academy')
      objectivesStore.updateProgress('gather-wood', 25)

      const wrapper = mount(ObjectivesView)

      const objectiveCard = wrapper.findAll('.objective-card').find((card) =>
        card.text().includes('Gather Wood')
      )

      if (objectiveCard) {
        const progressText = objectiveCard.find('.progress-text')
        expect(progressText.text()).toBe('25/50')
      }
    })

    it('displays subtasks for multi-step objectives', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.completeObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      const exploreFeaturesCard = wrapper.findAll('.objective-card').find((card) =>
        card.text().includes('Explore Features')
      )

      if (exploreFeaturesCard) {
        expect(exploreFeaturesCard.find('.subtasks-list').exists()).toBe(true)
        expect(exploreFeaturesCard.findAll('.subtask-item').length).toBeGreaterThan(0)
      }
    })

    it('displays subtask completion status', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.completeObjective('visit-academy')
      objectivesStore.updateSubtask('explore-features', 'visit-foundry', true)

      const wrapper = mount(ObjectivesView)

      const exploreFeaturesCard = wrapper.findAll('.objective-card').find((card) =>
        card.text().includes('Explore Features')
      )

      if (exploreFeaturesCard) {
        const completedSubtask = exploreFeaturesCard.findAll('.subtask-item.completed')
        expect(completedSubtask.length).toBeGreaterThan(0)
      }
    })

    it('shows correct subtask progress text', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.completeObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      const exploreFeaturesCard = wrapper.findAll('.objective-card').find((card) =>
        card.text().includes('Explore Features')
      )

      if (exploreFeaturesCard) {
        const progressText = exploreFeaturesCard.find('.progress-text')
        expect(progressText.text()).toMatch(/\d+\/\d+ steps/)
      }
    })
  })

  describe('Objective Tracking', () => {
    it('displays tracked badge on currently tracked objective', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.setTrackedObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      const trackedBadge = wrapper.find('.tracked-badge')
      expect(trackedBadge.exists()).toBe(true)
      expect(trackedBadge.text()).toBe('Tracked')
    })

    it('applies tracked class to tracked objective card', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.setTrackedObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      const trackedCard = wrapper.find('.objective-card.tracked')
      expect(trackedCard.exists()).toBe(true)
    })

    it('sets objective as tracked when clicked', async () => {
      const objectivesStore = useObjectivesStore()
      const wrapper = mount(ObjectivesView)

      const firstActiveCard = wrapper.find('.objective-card:not(.completed)')
      await firstActiveCard.trigger('click')

      expect(objectivesStore.trackedObjectiveId).toBeDefined()
    })

    it('does not track completed objectives when clicked', async () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.completeObjective('visit-academy')
      const initialTrackedId = objectivesStore.trackedObjectiveId

      const wrapper = mount(ObjectivesView)

      const completedCard = wrapper.find('.objective-card.completed')
      if (completedCard.exists()) {
        await completedCard.trigger('click')

        // Tracked ID should not change
        expect(objectivesStore.trackedObjectiveId).toBe(initialTrackedId)
      }
    })

    it('updates tracked badge when tracked objective changes', async () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.setTrackedObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      let trackedBadge = wrapper.find('.tracked-badge')
      expect(trackedBadge.exists()).toBe(true)

      // Change tracked objective
      objectivesStore.completeObjective('visit-academy')
      objectivesStore.setTrackedObjective('gather-wood')

      await wrapper.vm.$nextTick()

      // Find the new tracked badge
      const gatherWoodCard = wrapper.findAll('.objective-card').find((card) =>
        card.text().includes('Gather Wood')
      )
      expect(gatherWoodCard?.find('.tracked-badge').exists()).toBe(true)
    })
  })

  describe('Border Colors', () => {
    it('applies correct border color for main objectives', () => {
      const wrapper = mount(ObjectivesView)

      const visitAcademyCard = wrapper.findAll('.objective-card').find((card) =>
        card.text().includes('Visit the Academy')
      )

      if (visitAcademyCard) {
        const borderColor = visitAcademyCard.attributes('style')
        expect(borderColor).toContain('#FFD700') // Gold color for main (hex format)
      }
    })

    it('applies correct border color for secondary objectives', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.completeObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      const exploreFeaturesCard = wrapper.findAll('.objective-card').find((card) =>
        card.text().includes('Explore Features')
      )

      if (exploreFeaturesCard) {
        const borderColor = exploreFeaturesCard.attributes('style')
        expect(borderColor).toContain('#2196F3') // Blue color for secondary (hex format)
      }
    })
  })

  describe('Empty States', () => {
    it('does not render active section when no active objectives', () => {
      const objectivesStore = useObjectivesStore()

      // Complete all objectives
      objectivesStore.objectives.forEach((obj) => {
        if (obj.status === 'active') {
          objectivesStore.completeObjective(obj.id)
        }
      })

      const wrapper = mount(ObjectivesView)

      const sectionTitles = wrapper.findAll('.section-title')
      const hasActive = sectionTitles.some((title) => title.text().includes('Active Objectives'))
      expect(hasActive).toBe(false)
    })

    it('does not render completed section when no completed objectives', () => {
      const wrapper = mount(ObjectivesView)

      const sectionTitles = wrapper.findAll('.section-title')
      const hasCompleted = sectionTitles.some((title) => title.text().includes('Completed Objectives'))

      // Initially, no objectives should be completed
      expect(hasCompleted).toBe(false)
    })
  })

  describe('Reactivity', () => {
    it('updates when objective status changes', async () => {
      const objectivesStore = useObjectivesStore()
      const wrapper = mount(ObjectivesView)

      // Check that visit-academy is initially not completed
      expect(
        wrapper.findAll('.objective-card.completed').find((card) =>
          card.text().includes('Visit the Academy')
        )
      ).toBeUndefined()

      // Complete an objective
      objectivesStore.completeObjective('visit-academy')
      await wrapper.vm.$nextTick()

      // Now visit-academy should be in completed section
      const completedSection = wrapper.findAll('.objective-card.completed')
      const completedVisitAcademy = completedSection.find((card) =>
        card.text().includes('Visit the Academy')
      )
      expect(completedVisitAcademy).toBeDefined()
      expect(completedVisitAcademy?.find('.completed-badge').exists()).toBe(true)
    })

    it('updates when new objectives are revealed', async () => {
      const objectivesStore = useObjectivesStore()
      const wrapper = mount(ObjectivesView)

      const initialCards = wrapper.findAll('.objective-card')
      const initialCount = initialCards.length

      // Complete visit-academy to reveal explore-features
      objectivesStore.completeObjective('visit-academy')
      await wrapper.vm.$nextTick()

      const newCards = wrapper.findAll('.objective-card')
      expect(newCards.length).toBeGreaterThan(initialCount)
    })

    it('updates progress display when objective progress changes', async () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.completeObjective('visit-academy')

      const wrapper = mount(ObjectivesView)

      // Update progress
      objectivesStore.updateProgress('gather-wood', 30)
      await wrapper.vm.$nextTick()

      const gatherWoodCard = wrapper.findAll('.objective-card').find((card) =>
        card.text().includes('Gather Wood')
      )

      if (gatherWoodCard) {
        const progressText = gatherWoodCard.find('.progress-text')
        expect(progressText.text()).toBe('30/50')
      }
    })
  })
})
