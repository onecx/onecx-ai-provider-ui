import {
  selectAgentDetailsCoreState,
  selectAgentDetailsViewModel,
  selectGroupsState,
  selectModelsState,
  selectProvidersState,
  selectScaffoldsState,
  selectToolsState
} from './agent-details.selectors'

describe('AgentDetails selectors', () => {
  describe('selectProvidersState', () => {
    it('should combine providers state', () => {
      const providers = [{ id: 'p1', name: 'Provider 1' }]
      expect(selectProvidersState.projector(providers, true, false)).toEqual({
        providers,
        providersLoadingIndicator: true,
        providersLoaded: false
      })
    })
  })

  describe('selectModelsState', () => {
    it('should combine models state', () => {
      const models = [{ id: 'm1', name: 'Model 1' }]
      expect(selectModelsState.projector(models, true, false)).toEqual({
        models,
        modelsLoadingIndicator: true,
        modelsLoaded: false
      })
    })
  })

  describe('selectScaffoldsState', () => {
    it('should combine scaffolds state', () => {
      const scaffolds = [{ id: 's1', name: 'Scaffold 1' }]
      expect(selectScaffoldsState.projector(scaffolds, true, false)).toEqual({
        scaffolds,
        scaffoldsLoadingIndicator: true,
        scaffoldsLoaded: false
      })
    })
  })

  describe('selectToolsState', () => {
    it('should combine tools state', () => {
      const tools = [{ id: 't1', name: 'Tool 1' }]
      expect(selectToolsState.projector(tools, true, false)).toEqual({
        tools,
        toolsLoadingIndicator: true,
        toolsLoaded: false
      })
    })
  })

  describe('selectGroupsState', () => {
    it('should combine groups state', () => {
      const groups = [{ id: 'g1', name: 'Group 1' }]
      expect(selectGroupsState.projector(groups, true, false)).toEqual({
        groups,
        groupsLoadingIndicator: true,
        groupsLoaded: false
      })
    })
  })

  describe('selectAgentDetailsCoreState', () => {
    it('should combine core details state', () => {
      const details = { id: '1' }
      expect(selectAgentDetailsCoreState.projector(details, true, false, true, false, true)).toEqual({
        details,
        detailsLoadingIndicator: true,
        detailsLoaded: false,
        editMode: true,
        isSubmitting: false,
        backNavigationPossible: true
      })
    })
  })

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
