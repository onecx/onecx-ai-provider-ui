import { selectAgentDetailsViewModel } from './agent-details.selectors'

describe('AgentDetails selectors', () => {
  describe('selectAgentDetailsViewModel', () => {
    it('should combine the input to be the viewmodel', () => {
      const details = { id: '10' }
      const detailsLoadingIndicator = true
      const providersState = { providers: [], providersLoadingIndicator: false, providersLoaded: true }
      const modelsState = { models: [], modelsLoadingIndicator: false, modelsLoaded: true }
      const scaffoldsState = { scaffolds: [], scaffoldsLoadingIndicator: false, scaffoldsLoaded: true }
      const toolsState = { tools: [], toolsLoadingIndicator: false, toolsLoaded: true }
      const groupsState = { groups: [], groupsLoadingIndicator: false, groupsLoaded: true }
      const backNavigationPossible = true
      const detailsLoaded = true
      const editMode = true
      const isSubmitting = true
      expect(
        selectAgentDetailsViewModel.projector(
          details,
          detailsLoadingIndicator,
          providersState,
          modelsState,
          scaffoldsState,
          toolsState,
          groupsState,
          backNavigationPossible,
          detailsLoaded,
          editMode,
          isSubmitting
        )
      ).toEqual({
        details,
        detailsLoadingIndicator,
        ...providersState,
        ...modelsState,
        ...scaffoldsState,
        ...toolsState,
        ...groupsState,
        backNavigationPossible,
        detailsLoaded,
        editMode,
        isSubmitting
      })
    })
  })
})
