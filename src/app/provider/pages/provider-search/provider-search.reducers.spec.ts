import { routerNavigatedAction } from "@ngrx/router-store"
import { ProviderSearchActions } from "./provider-search.actions"
import { ProviderSearchReducer, initialState } from "./provider-search.reducers"

describe('ProviderSearchReducer', () => {
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
    const state = ProviderSearchReducer(initialState, action)
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
    jest.spyOn(require('./provider-search.parameters').ProviderSearchCriteriasSchema, 'safeParse').mockReturnValue({ success: false })
    const state = ProviderSearchReducer(initialState, action)
    expect(state).toEqual(initialState)
  })

  it('should reset results and criteria on resetButtonClicked', () => {
    const prevState = { ...initialState, results: [{ id: '1', name: 'Test', modelName: 'model' }], criteria: { name: 'Test' } }
    const action = ProviderSearchActions.resetButtonClicked()
    const state = ProviderSearchReducer(prevState, action)
    expect(state.results).toEqual([])
    expect(state.criteria).toEqual({})
  })

  it('should set loading and criteria on searchButtonClicked', () => {
    const action = ProviderSearchActions.searchButtonClicked({ searchCriteria: { name: 'Test' } })
    const state = ProviderSearchReducer(initialState, action)
    expect(state.searchLoadingIndicator).toBe(true)
    expect(state.criteria).toEqual({ name: 'Test' })
  })

  it('should set results on providerSearchResultsReceived', () => {
    const action = ProviderSearchActions.providerSearchResultsReceived({
      results: [{ id: '1', name: 'Test', modelName: 'model' }],
      totalNumberOfResults: 1
    })
    const state = ProviderSearchReducer(initialState, action)
    expect(state.results).toEqual([{ id: '1', name: 'Test', modelName: 'model' }])
  })

  it('should clear results on providerSearchResultsLoadingFailed', () => {
    const prevState = { ...initialState, results: [{ id: '1', name: 'Test', modelName: 'model' }] }
    const action = ProviderSearchActions.providerSearchResultsLoadingFailed({ error: null })
    const state = ProviderSearchReducer(prevState, action)
    expect(state.results).toEqual([])
  })

  it('should set chartVisible on chartVisibilityRehydrated', () => {
    const action = ProviderSearchActions.chartVisibilityRehydrated({ visible: true })
    const state = ProviderSearchReducer(initialState, action)
    expect(state.chartVisible).toBe(true)
  })

  it('should toggle chartVisible on chartVisibilityToggled', () => {
    const prevState = { ...initialState, chartVisible: false }
    const action = ProviderSearchActions.chartVisibilityToggled()
    const state = ProviderSearchReducer(prevState, action)
    expect(state.chartVisible).toBe(true)
  })

  it('should set viewMode on viewModeChanged', () => {
    const action = ProviderSearchActions.viewModeChanged({ viewMode: 'advanced' })
    const state = ProviderSearchReducer(initialState, action)
    expect(state.viewMode).toBe('advanced')
  })

  it('should set displayedColumns on displayedColumnsChanged', () => {
    const action = ProviderSearchActions.displayedColumnsChanged({
      displayedColumns: [
        { id: 'col1' },
        { id: 'col2' }
      ] as any
    })
    const state = ProviderSearchReducer(initialState, action)
    expect(state.displayedColumns).toEqual(['col1', 'col2'])
  })
})
