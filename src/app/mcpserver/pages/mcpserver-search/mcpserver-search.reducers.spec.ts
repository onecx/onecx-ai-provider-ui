import { routerNavigatedAction } from "@ngrx/router-store"
import { MCPServerSearchActions } from "./mcpserver-search.actions"
import { mcpserverSearchReducer, initialState } from "./mcpserver-search.reducers"
import { mcpserverSearchCriteriasSchema } from "./mcpserver-search.parameters"
import { DiagramComponentState, DiagramType, SearchHeaderComponentState } from "@onecx/angular-accelerator"

describe('mcpserverSearchReducer', () => {
  it('should parse query params on routerNavigatedAction (success)', () => {
    const action = routerNavigatedAction({
      payload: {
        routerState: {
          root: {
            queryParams: { name: 'Test' }
          }
        }
      }
    } as any)
    const state = mcpserverSearchReducer(initialState, action)
    expect(state.criteria).toEqual({ name: 'Test' })
    expect(state.searchLoadingIndicator).toBe(true)
  })

  it('should not change state on routerNavigatedAction (fail)', () => {
    const action = routerNavigatedAction({
      payload: {
        routerState: {
          root: {
            queryParams: { invalid: 'value' }
          }
        }
      }
    } as any)

    jest.spyOn(mcpserverSearchCriteriasSchema, 'safeParse').mockReturnValue({ success: false, error: {} as any })
    const state = mcpserverSearchReducer(initialState, action)
    expect(state).toEqual(initialState)
  })

  it('should reset results and criteria on resetButtonClicked', () => {
    const prevState = { ...initialState, results: [{ id: '1' }], criteria: { name: 'Test' } }
    const action = MCPServerSearchActions.resetButtonClicked()
    const state = mcpserverSearchReducer(prevState, action)
    expect(state.results).toEqual([])
    expect(state.criteria).toEqual({})
  })

  it('should set loading and criteria on searchButtonClicked', () => {
    const action = MCPServerSearchActions.searchButtonClicked({ searchCriteria: { name: 'Test' } })
    const state = mcpserverSearchReducer(initialState, action)    
    expect(state.criteria).toEqual({ name: 'Test' })
  })

  it('should set results on mcpserverSearchResultsReceived', () => {
    const action = MCPServerSearchActions.mcpserverSearchResultsReceived({
      stream: [{ id: '1' }],
      totalElements: 1,
      number: 0,
      size: 10,
      totalPages: 1
    })
    const state = mcpserverSearchReducer(initialState, action)
    expect(state.results).toEqual([{ id: '1' }])
  })

  it('should clear results on mcpserverSearchResultsLoadingFailed', () => {
    const prevState = { ...initialState, results: [{ id: '1' }] }
    const action = MCPServerSearchActions.mcpserverSearchResultsLoadingFailed({ error: null })
    const state = mcpserverSearchReducer(prevState, action)
    expect(state.results).toEqual([])
  })

  it('should set chartVisible on chartVisibilityRehydrated', () => {
    const action = MCPServerSearchActions.chartVisibilityToggled()
    const state = mcpserverSearchReducer(initialState, action)
    expect(state.chartVisible).toBe(true)
  })

  it('should toggle chartVisible on chartVisibilityToggled', () => {
    const prevState = { ...initialState, chartVisible: false }
    const action = MCPServerSearchActions.chartVisibilityToggled()
    const state = mcpserverSearchReducer(prevState, action)
    expect(state.chartVisible).toBe(true)
  })

  it('should update resultComponentState on resultComponentStateChanged', () => {
    const componentState = { page: 1, pageSize: 10 }
    const action = MCPServerSearchActions.resultComponentStateChanged(componentState)
    const state = mcpserverSearchReducer(initialState, action)
    delete (state.resultComponentState as any).type // remove type property for comparison
    expect(state.resultComponentState).toEqual(componentState)
  })

  it('should update searchHeaderComponentState on searchHeaderComponentStateChanged', () => {
    const componentState: SearchHeaderComponentState = { activeViewMode: 'basic' }
    const action = MCPServerSearchActions.searchHeaderComponentStateChanged(componentState)
    const state = mcpserverSearchReducer(initialState, action)
    delete (state.searchHeaderComponentState as any).type // remove type property for comparison
    expect(state.searchHeaderComponentState).toEqual(componentState)
  })

  it('should update diagramComponentState on diagramComponentStateChanged', () => {
    const componentState: DiagramComponentState = { activeDiagramType: DiagramType.PIE }
    const action = MCPServerSearchActions.diagramComponentStateChanged(componentState)
    const state = mcpserverSearchReducer(initialState, action)
    delete (state.diagramComponentState as any).type // remove type property for comparison
    expect(state.diagramComponentState).toEqual(componentState)
  })

})
