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
        isSubmitting: false,
        isPublishingConfigurationVersion: false,
        configurationVersions: [],
        configurationVersionsLoadingIndicator: false,
        activatingConfigurationVersionId: undefined,
        configurationVersionDetails: {},
        loadingVersionDetailIds: []
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

      expect(nextState).toEqual({
        ...initialState,
        detailsLoadingIndicator: true,
        configurationVersionsLoadingIndicator: true
      })
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
    const intermediateState: AgentDetailsState = { ...initialState, editMode: true, isSubmitting: true }

    it('should set editMode to false on cancelEditConfirmClicked', () => {
      const action = agentDetailsActions.cancelEditConfirmClicked()
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({ ...initialState, editMode: false, isSubmitting: false })
    })

    it('should set editMode to false on cancelEditNotDirty', () => {
      const action = agentDetailsActions.cancelEditNotDirty()
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({ ...initialState, editMode: false, isSubmitting: false })
    })

    it('should set editMode to false on updateAgentCancelled', () => {
      const action = agentDetailsActions.updateAgentCancelled()
      const nextState = agentDetailsReducer(intermediateState, action)

      expect(nextState).toEqual({ ...initialState, editMode: false, isSubmitting: false })
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

  describe('publishConfigurationVersionSubmitted', () => {
    it('should set isPublishingConfigurationVersion to true', () => {
      const action = agentDetailsActions.publishConfigurationVersionSubmitted({
        agentId: 'agent-1',
        name: 'Release 1'
      })

      expect(agentDetailsReducer(initialState, action)).toEqual({
        ...initialState,
        isPublishingConfigurationVersion: true
      })
    })
  })

  describe('publishConfigurationVersionSucceeded', () => {
    it('should reset isPublishingConfigurationVersion and append the new version', () => {
      const action = agentDetailsActions.publishConfigurationVersionSucceeded({
        version: { id: 'version-1', name: 'Release 1', active: true }
      })

      expect(agentDetailsReducer({ ...initialState, isPublishingConfigurationVersion: true }, action)).toEqual({
        ...initialState,
        isPublishingConfigurationVersion: false,
        configurationVersions: [{ id: 'version-1', name: 'Release 1', active: true }]
      })
    })

    it('should deactivate the previous active version only when the new version is active', () => {
      const intermediateState: AgentDetailsState = {
        ...initialState,
        configurationVersions: [{ id: 'version-1', name: 'Release 1', active: true }]
      }

      const inactiveAction = agentDetailsActions.publishConfigurationVersionSucceeded({
        version: { id: 'version-2', name: 'Release 2', active: false }
      })
      expect(agentDetailsReducer(intermediateState, inactiveAction).configurationVersions).toEqual([
        { id: 'version-1', name: 'Release 1', active: true },
        { id: 'version-2', name: 'Release 2', active: false }
      ])

      const activeAction = agentDetailsActions.publishConfigurationVersionSucceeded({
        version: { id: 'version-2', name: 'Release 2', active: true }
      })
      expect(agentDetailsReducer(intermediateState, activeAction).configurationVersions).toEqual([
        { id: 'version-1', name: 'Release 1', active: false },
        { id: 'version-2', name: 'Release 2', active: true }
      ])
    })
  })

  describe('configurationVersionDetailRequested', () => {
    it('should mark a version without cached details as loading', () => {
      const action = agentDetailsActions.configurationVersionDetailRequested({ versionId: 'version-1' })

      expect(agentDetailsReducer(initialState, action).loadingVersionDetailIds).toEqual(['version-1'])
    })

    it('should not mark a version with cached details as loading', () => {
      const state: AgentDetailsState = {
        ...initialState,
        configurationVersionDetails: { 'version-1': { schemaVersion: '1' } as never }
      }
      const action = agentDetailsActions.configurationVersionDetailRequested({ versionId: 'version-1' })

      expect(agentDetailsReducer(state, action).loadingVersionDetailIds).toEqual([])
    })
  })

  describe('configurationVersionDetailReceived', () => {
    it('should cache the configuration and clear the loading flag', () => {
      const configuration = { schemaVersion: '1' } as never
      const state: AgentDetailsState = { ...initialState, loadingVersionDetailIds: ['version-1', 'version-2'] }
      const action = agentDetailsActions.configurationVersionDetailReceived({ versionId: 'version-1', configuration })

      const result = agentDetailsReducer(state, action)

      expect(result.configurationVersionDetails).toEqual({ 'version-1': configuration })
      expect(result.loadingVersionDetailIds).toEqual(['version-2'])
    })
  })

  describe('configurationVersionDetailLoadingFailed', () => {
    it('should clear the loading flag without caching details', () => {
      const state: AgentDetailsState = { ...initialState, loadingVersionDetailIds: ['version-1'] }
      const action = agentDetailsActions.configurationVersionDetailLoadingFailed({
        versionId: 'version-1',
        error: 'boom'
      })

      const result = agentDetailsReducer(state, action)

      expect(result.loadingVersionDetailIds).toEqual([])
      expect(result.configurationVersionDetails).toEqual({})
    })
  })

  describe('configurationVersionsReceived', () => {
    it('should store the versions and stop the loading indicator', () => {
      const state: AgentDetailsState = { ...initialState, configurationVersionsLoadingIndicator: true }
      const versions = [{ id: 'version-1', name: 'v1.0', active: true }]

      const result = agentDetailsReducer(state, agentDetailsActions.configurationVersionsReceived({ versions }))

      expect(result.configurationVersions).toEqual(versions)
      expect(result.configurationVersionsLoadingIndicator).toBe(false)
    })
  })

  describe('configurationVersionsLoadingFailed', () => {
    it('should clear the versions and stop the loading indicator', () => {
      const state: AgentDetailsState = {
        ...initialState,
        configurationVersions: [{ id: 'version-1', name: 'v1.0', active: false }],
        configurationVersionsLoadingIndicator: true
      }

      const result = agentDetailsReducer(state, agentDetailsActions.configurationVersionsLoadingFailed({ error: 'x' }))

      expect(result.configurationVersions).toEqual([])
      expect(result.configurationVersionsLoadingIndicator).toBe(false)
    })
  })

  describe('activateConfigurationVersion', () => {
    it('should mark the version as being activated when clicked', () => {
      const action = agentDetailsActions.activateConfigurationVersionClicked({ versionId: 'version-2' })

      expect(agentDetailsReducer(initialState, action).activatingConfigurationVersionId).toBe('version-2')
    })

    it('should make only the activated version active and clear the in-progress id on success', () => {
      const state: AgentDetailsState = {
        ...initialState,
        activatingConfigurationVersionId: 'version-2',
        configurationVersions: [
          { id: 'version-1', name: 'v1.0', active: true },
          { id: 'version-2', name: 'v2.0', active: false }
        ]
      }
      const action = agentDetailsActions.activateConfigurationVersionSucceeded({
        version: { id: 'version-2', name: 'v2.0', active: true }
      })

      const result = agentDetailsReducer(state, action)

      expect(result.activatingConfigurationVersionId).toBeUndefined()
      expect(result.configurationVersions).toEqual([
        { id: 'version-1', name: 'v1.0', active: false },
        { id: 'version-2', name: 'v2.0', active: true }
      ])
    })

    it('should clear the in-progress id on failure', () => {
      const state: AgentDetailsState = { ...initialState, activatingConfigurationVersionId: 'version-2' }

      const result = agentDetailsReducer(state, agentDetailsActions.activateConfigurationVersionFailed({ error: 'x' }))

      expect(result.activatingConfigurationVersionId).toBeUndefined()
    })

    it('should clear the in-progress id when the confirmation is cancelled', () => {
      const state: AgentDetailsState = { ...initialState, activatingConfigurationVersionId: 'version-2' }

      const result = agentDetailsReducer(state, agentDetailsActions.activateConfigurationVersionCancelled())

      expect(result.activatingConfigurationVersionId).toBeUndefined()
    })
  })

  describe('publishConfigurationVersionFailed', () => {
    it('should reset isPublishingConfigurationVersion', () => {
      const action = agentDetailsActions.publishConfigurationVersionFailed({ error: 'publish failed' })

      expect(agentDetailsReducer({ ...initialState, isPublishingConfigurationVersion: true }, action)).toEqual(
        initialState
      )
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
