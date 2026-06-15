import { routerNavigatedAction } from '@ngrx/router-store'
import { ScaffoldSearchActions } from './scaffold-search.actions'
import { scaffoldSearchReducer, initialState } from './scaffold-search.reducers'
import { scaffoldSearchCriteriasSchema } from './scaffold-search.parameters'

describe('scaffoldSearchReducer', () => {
  it('should parse query params on routerNavigatedAction (success)', () => {
    const action = routerNavigatedAction({
      payload: {
        routerState: { root: { queryParams: { name: 'Test' } } }
      }
    } as any)
    const state = scaffoldSearchReducer(initialState, action)
    
    expect(state.criteria).toEqual({ name: 'Test' })
    expect(state.searchLoadingIndicator).toBe(true)
  })

  it('should not change state on routerNavigatedAction (fail)', () => {
    jest.spyOn(scaffoldSearchCriteriasSchema, 'safeParse').mockReturnValue({ success: false, error: {} as any })
    const action = routerNavigatedAction({
      payload: {
        routerState: { root: { queryParams: { invalid: 'value' } } }
      }
    } as any)
    const state = scaffoldSearchReducer(initialState, action)
    
    expect(state).toEqual(initialState)
  })

  it('should reset results and criteria on resetButtonClicked', () => {
    const prevState = { ...initialState, results: [{ id: '1' }], criteria: { name: 'Test' } }
    const state = scaffoldSearchReducer(prevState as any, ScaffoldSearchActions.resetButtonClicked())
    
    expect(state.results).toEqual([])
    expect(state.criteria).toEqual({})
  })

  it('should set loading and criteria on searchButtonClicked', () => {
    const state = scaffoldSearchReducer(
      initialState,
      ScaffoldSearchActions.searchButtonClicked({ searchCriteria: { name: 'Test' } })
    )
    
    expect(state.criteria).toEqual({ name: 'Test' })
    expect(state.searchLoadingIndicator).toBe(true)
  })

  it('should set results on scaffoldSearchResultsReceived', () => {
    const state = scaffoldSearchReducer(
      initialState,
      ScaffoldSearchActions.scaffoldSearchResultsReceived({
        results: [{ id: '1', name: 'Scaffold A' }],
        totalNumberOfResults: 1
      })
    )

    expect(state.results).toEqual([{ id: '1', name: 'Scaffold A' }])
    expect(state.searchLoadingIndicator).toBe(false)
  })

  it('should toggle chart visibility', () => {
    const state = scaffoldSearchReducer(initialState, ScaffoldSearchActions.chartVisibilityToggled())
    
    expect(state.chartVisible).toBe(true)
  })

  it('should clear results and loading on scaffoldSearchResultsLoadingFailed', () => {
    const state = scaffoldSearchReducer(
      { ...initialState, results: [{ id: '1' }], searchLoadingIndicator: true } as any,
      ScaffoldSearchActions.scaffoldSearchResultsLoadingFailed({ error: 'error' })
    )

    expect(state.results).toEqual([])
    expect(state.searchLoadingIndicator).toBe(false)
  })

  it('should set chartVisible on chartVisibilityRehydrated', () => {
    const state = scaffoldSearchReducer(initialState, ScaffoldSearchActions.chartVisibilityRehydrated({ visible: true }))
    
    expect(state.chartVisible).toBe(true)
  })

  it('should set viewMode on viewModeChanged', () => {
    const state = scaffoldSearchReducer(initialState, ScaffoldSearchActions.viewModeChanged({ viewMode: 'advanced' }))
    
    expect(state.viewMode).toBe('advanced')
  })

  it('should set displayedColumns on displayedColumnsChanged', () => {
    const state = scaffoldSearchReducer(
      initialState,
      ScaffoldSearchActions.displayedColumnsChanged({
        displayedColumns: [{ id: 'name', nameKey: 'Name', columnType: undefined as any }]
      })
    )

    expect(state.displayedColumns).toEqual(['name'])
  })
})
