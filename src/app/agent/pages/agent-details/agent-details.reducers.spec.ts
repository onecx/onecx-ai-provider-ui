import { Agent, AgentGroup, Model, Provider, Scaffold, Tool } from 'src/app/shared/generated'
import { agentDetailsActions } from './agent-details.actions'
import { agentDetailsReducer, initialState } from './agent-details.reducers'
import { AgentDetailsState } from './agent-details.state'

describe('agentDetailsReducer', () => {
  const mockAgent: Agent = { id: '1', name: 'Test Agent' }
  const mockProvider: Provider = { id: 'p1', name: 'Provider 1' }
  const mockModel: Model = { id: 'm1', name: 'Model 1' }
  const mockScaffold: Scaffold = { id: 's1', name: 'Scaffold 1' }
  const mockTool: Tool = { id: 't1', name: 'Tool 1' }
  const mockGroup: AgentGroup = { id: 'g1', name: 'Group 1' }

  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(initialState).toEqual({
        details: undefined,
        detailsLoadingIndicator: true,
        detailsLoaded: false,
        providers: [],
        providersLoadingIndicator: true,
        providersLoaded: false,
        models: [],
        modelsLoadingIndicator: true,
        modelsLoaded: false,
        scaffolds: [],
        scaffoldsLoadingIndicator: true,
        scaffoldsLoaded: false,
        tools: [],
        toolsLoadingIndicator: true,
        toolsLoaded: false,
        groups: [],
        groupsLoadingIndicator: true,
        groupsLoaded: false,
        editMode: false,
        isSubmitting: false
      })
    })

    it('should return initial state when action is unknown', () => {
      const action = { type: 'UNKNOWN_ACTION' } as any

      const nextState = agentDetailsReducer(initialState, action)

      expect(nextState).toBe(initialState)
    })
  })

  describe('agentDetailsReceived', () => {
    it('should set details and set loading flags correctly', () => {
      const action = agentDetailsActions.agentDetailsReceived({ details: mockAgent })
      const nextState = agentDetailsReducer(initialState, action)

      expect(nextState).toEqual({
        ...initialState,
        details: mockAgent,
        detailsLoaded: true,
        detailsLoadingIndicator: false
      })
    })

    it('should override previous details with new data', () => {
      const intermediateState: AgentDetailsState = {
        ...initialState,
        details: { id: '2', name: 'Previous Agent' },
        detailsLoaded: true,
        detailsLoadingIndicator: false
      }

      const action = agentDetailsActions.agentDetailsReceived({ details: mockAgent })
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState.details).toEqual(mockAgent)
    })
  })

  describe('agentDetailsLoadingFailed', () => {
    it('should clear details and set loading flags correctly', () => {
      const intermediateState: AgentDetailsState = { ...initialState, details: mockAgent, detailsLoaded: true }

      const action = agentDetailsActions.agentDetailsLoadingFailed({ error: null })
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({
        ...initialState,
        details: undefined,
        detailsLoaded: false,
        detailsLoadingIndicator: false
      })
    })
  })

  describe('agentProvidersReceived', () => {
    it('should set providers and set loading flags correctly', () => {
      const action = agentDetailsActions.agentProvidersReceived({ providers: [mockProvider] })
      const nextState = agentDetailsReducer(initialState, action)

      expect(nextState).toEqual({
        ...initialState,
        providers: [mockProvider],
        providersLoaded: true,
        providersLoadingIndicator: false
      })
    })
  })

  describe('agentProvidersLoadingFailed', () => {
    it('should clear providers and set loading flags correctly', () => {
      const intermediateState: AgentDetailsState = { ...initialState, providers: [mockProvider], providersLoaded: true }

      const action = agentDetailsActions.agentProvidersLoadingFailed({ error: null })
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({
        ...initialState,
        providers: [],
        providersLoaded: false,
        providersLoadingIndicator: false
      })
    })
  })

  describe('agentModelsReceived', () => {
    it('should set models and set loading flags correctly', () => {
      const action = agentDetailsActions.agentModelsReceived({ models: [mockModel] })
      const nextState = agentDetailsReducer(initialState, action)

      expect(nextState).toEqual({
        ...initialState,
        models: [mockModel],
        modelsLoaded: true,
        modelsLoadingIndicator: false
      })
    })
  })

  describe('agentModelsLoadingFailed', () => {
    it('should clear models and set loading flags correctly', () => {
      const intermediateState: AgentDetailsState = { ...initialState, models: [mockModel], modelsLoaded: true }

      const action = agentDetailsActions.agentModelsLoadingFailed({ error: null })
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({
        ...initialState,
        models: [],
        modelsLoaded: false,
        modelsLoadingIndicator: false
      })
    })
  })

  describe('agentScaffoldsReceived', () => {
    it('should set scaffolds and set loading flags correctly', () => {
      const action = agentDetailsActions.agentScaffoldsReceived({ scaffolds: [mockScaffold] })
      const nextState = agentDetailsReducer(initialState, action)

      expect(nextState).toEqual({
        ...initialState,
        scaffolds: [mockScaffold],
        scaffoldsLoaded: true,
        scaffoldsLoadingIndicator: false
      })
    })
  })

  describe('agentScaffoldsLoadingFailed', () => {
    it('should clear scaffolds and set loading flags correctly', () => {
      const intermediateState: AgentDetailsState = { ...initialState, scaffolds: [mockScaffold], scaffoldsLoaded: true }

      const action = agentDetailsActions.agentScaffoldsLoadingFailed({ error: null })
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({
        ...initialState,
        scaffolds: [],
        scaffoldsLoaded: false,
        scaffoldsLoadingIndicator: false
      })
    })
  })

  describe('agentToolsReceived', () => {
    it('should set tools and set loading flags correctly', () => {
      const action = agentDetailsActions.agentToolsReceived({ tools: [mockTool] })
      const nextState = agentDetailsReducer(initialState, action)

      expect(nextState).toEqual({
        ...initialState,
        tools: [mockTool],
        toolsLoaded: true,
        toolsLoadingIndicator: false
      })
    })
  })

  describe('agentToolsLoadingFailed', () => {
    it('should clear tools and set loading flags correctly', () => {
      const intermediateState: AgentDetailsState = { ...initialState, tools: [mockTool], toolsLoaded: true }

      const action = agentDetailsActions.agentToolsLoadingFailed({ error: null })
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({
        ...initialState,
        tools: [],
        toolsLoaded: false,
        toolsLoadingIndicator: false
      })
    })
  })

  describe('agentGroupsReceived', () => {
    it('should set groups and set loading flags correctly', () => {
      const action = agentDetailsActions.agentGroupsReceived({ groups: [mockGroup] })
      const nextState = agentDetailsReducer(initialState, action)

      expect(nextState).toEqual({
        ...initialState,
        groups: [mockGroup],
        groupsLoaded: true,
        groupsLoadingIndicator: false
      })
    })
  })

  describe('agentGroupsLoadingFailed', () => {
    it('should clear groups and set loading flags correctly', () => {
      const intermediateState: AgentDetailsState = { ...initialState, groups: [mockGroup], groupsLoaded: true }

      const action = agentDetailsActions.agentGroupsLoadingFailed({ error: null })
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({
        ...initialState,
        groups: [],
        groupsLoaded: false,
        groupsLoadingIndicator: false
      })
    })
  })

  describe('createGroupInPlaceSucceeded', () => {
    it('should append the new group when it does not already exist', () => {
      const intermediateState: AgentDetailsState = { ...initialState, groups: [mockGroup] }
      const newGroup: AgentGroup = { id: 'g2', name: 'Group 2' }

      const action = agentDetailsActions.createGroupInPlaceSucceeded({ group: newGroup })
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({
        ...intermediateState,
        groups: [mockGroup, newGroup]
      })
    })

    it('should not duplicate a group that already exists', () => {
      const intermediateState: AgentDetailsState = { ...initialState, groups: [mockGroup] }

      const action = agentDetailsActions.createGroupInPlaceSucceeded({ group: mockGroup })
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual(intermediateState)
    })
  })

  describe('navigatedToDetailsPage', () => {
    it('should reset state to initial state', () => {
      const intermediateState: AgentDetailsState = {
        ...initialState,
        details: mockAgent,
        detailsLoaded: true,
        detailsLoadingIndicator: false,
        editMode: true
      }

      const action = agentDetailsActions.navigatedToDetailsPage({ id: '1' })
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({ ...initialState, detailsLoadingIndicator: true })
    })
  })

  describe('editButtonClicked', () => {
    it('should set editMode to true', () => {
      const action = agentDetailsActions.editButtonClicked()
      const nextState = agentDetailsReducer(initialState, action)

      expect(nextState).toEqual({ ...initialState, editMode: true })
    })
  })

  describe('saveButtonClicked', () => {
    it('should set isSubmitting to true', () => {
      const action = agentDetailsActions.saveButtonClicked({ details: mockAgent })
      const nextState = agentDetailsReducer(initialState, action)

      expect(nextState).toEqual({ ...initialState, isSubmitting: true })
    })
  })

  describe('cancel actions (cancelEditConfirmClicked, cancelEditNotDirty, updateAgentCancelled)', () => {
    const intermediateState: AgentDetailsState = { ...initialState, editMode: true }

    it('should set editMode to false on cancelEditConfirmClicked', () => {
      const action = agentDetailsActions.cancelEditConfirmClicked()
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({ ...initialState, editMode: false })
    })

    it('should set editMode to false on cancelEditNotDirty', () => {
      const action = agentDetailsActions.cancelEditNotDirty()
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({ ...initialState, editMode: false })
    })

    it('should set editMode to false on updateAgentCancelled', () => {
      const action = agentDetailsActions.updateAgentCancelled()
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({ ...initialState, editMode: false })
    })
  })

  describe('updateAgentSucceeded', () => {
    it('should update details and reset editMode and isSubmitting', () => {
      const intermediateState: AgentDetailsState = { ...initialState, editMode: true, isSubmitting: true }

      const action = agentDetailsActions.updateAgentSucceeded({ details: mockAgent })
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({
        ...initialState,
        details: mockAgent,
        editMode: false,
        isSubmitting: false
      })
    })
  })

  describe('updateAgentFailed', () => {
    it('should set isSubmitting to false', () => {
      const intermediateState: AgentDetailsState = { ...initialState, isSubmitting: true }

      const action = agentDetailsActions.updateAgentFailed({ error: null })
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({ ...initialState, isSubmitting: false })
    })
  })

  describe('state immutability', () => {
    it('should not mutate the original state', () => {
      const originalState = { ...initialState }
      const action = agentDetailsActions.agentDetailsReceived({ details: mockAgent })

      agentDetailsReducer(initialState, action)

      expect(initialState).toEqual(originalState)
    })

    it('should create a new state object for each action', () => {
      const action1 = agentDetailsActions.agentDetailsReceived({ details: mockAgent })
      const nextState1 = agentDetailsReducer(initialState, action1)

      const action2 = agentDetailsActions.editButtonClicked()
      const nextState2 = agentDetailsReducer(nextState1, action2)

      expect(nextState1).not.toBe(initialState)
      expect(nextState2).not.toBe(nextState1)
      expect(nextState2).not.toBe(initialState)
    })
  })
})
