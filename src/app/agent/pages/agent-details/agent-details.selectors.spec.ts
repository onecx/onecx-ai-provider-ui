import { selectAgentDetailsViewModel } from './agent-details.selectors'

describe('AgentDetails selectors', () => {
  describe('selectAgentDetailsViewModel', () => {
    it('should combine the input to be the viewmodel', () => {
      const details = { id: '10' }
      const detailsLoadingIndicator = true
      const backNavigationPossible = true
      const detailsLoaded = true
      const editMode = true
      const isSubmitting = true
      expect(
        selectAgentDetailsViewModel.projector(
          details,
          detailsLoadingIndicator,
          backNavigationPossible,
          detailsLoaded,
          editMode,
          isSubmitting
        )
      ).toEqual({
        details,
        detailsLoadingIndicator,
        backNavigationPossible,
        detailsLoaded,
        editMode,
        isSubmitting
      })
    })
  })
})
