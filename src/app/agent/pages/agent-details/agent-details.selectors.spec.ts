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
      const coreState = {
        details,
        detailsLoadingIndicator,
        detailsLoaded,
        editMode,
        isSubmitting,
        backNavigationPossible
      }
      expect(
        selectAgentDetailsViewModel.projector(
          coreState,
          providersState,
          modelsState,
          scaffoldsState,
          toolsState,
          groupsState
        )
      ).toEqual({
        ...coreState,
        ...providersState,
        ...modelsState,
        ...scaffoldsState,
        ...toolsState,
        ...groupsState
      })
    })
  })
})
