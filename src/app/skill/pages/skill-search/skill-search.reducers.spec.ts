import {
  DiagramType,
  GroupByCountDiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'

import { skillSearchActions } from './skill-search.actions'
import * as reducers from './skill-search.reducers'

// ACTION S11: Change test data in the whole document
describe('skillSearchReducer', () => {
  it('should reset results and criteria on resetButtonClicked', () => {
    const preState = { ...reducers.initialState, results: [{ id: '1' }], criteria: { name: 'val' } }
    const action = skillSearchActions.resetButtonClicked()
    const nextState = reducers.skillSearchReducer(preState, action)

    expect(nextState.results).toEqual([])
    expect(nextState.criteria).toEqual({})
  })

  it('should set searchLoadingIndicator and criteria on searchButtonClicked', () => {
    const searchCriteria = { name: 'foo' }
    const action = skillSearchActions.searchButtonClicked({ searchCriteria })
    const nextState = reducers.skillSearchReducer(reducers.initialState, action)

    expect(nextState.searchLoadingIndicator).toBe(true)
    expect(nextState.criteria).toEqual(searchCriteria)
  })

  it('should set results on skillSearchResultsReceived', () => {
    const stream = [{ id: '1' }, { id: '2' }]
    const action = skillSearchActions.skillSearchResultsReceived({
      stream,
      size: 2,
      number: 0,
      totalElements: 2,
      totalPages: 1
    })
    const nextState = reducers.skillSearchReducer(reducers.initialState, action)

    expect(nextState.results).toEqual(stream)
  })

  it('should clear results on skillSearchResultsLoadingFailed', () => {
    const preState = { ...reducers.initialState, results: [{ id: '1' }] }
    const action = skillSearchActions.skillSearchResultsLoadingFailed({ error: null })
    const nextState = reducers.skillSearchReducer(preState, action)

    expect(nextState.results).toEqual([])
  })

  it('should toggle chartVisible on chartVisibilityToggled', () => {
    const initialStateWithChartHidden = { ...reducers.initialState, chartVisible: false }
    const action = skillSearchActions.chartVisibilityToggled()
    let nextState = reducers.skillSearchReducer(initialStateWithChartHidden, action)

    expect(nextState.chartVisible).toBe(true)

    const stateWithChartVisible = { ...reducers.initialState, chartVisible: true }
    nextState = reducers.skillSearchReducer(stateWithChartVisible, action)

    expect(nextState.chartVisible).toBe(false)
  })

  it('should update resultComponentState when resultComponentStateChanged', () => {
    const newComponentState: InteractiveDataViewComponentState = {}
    const action = skillSearchActions.resultComponentStateChanged(newComponentState)
    const nextState = reducers.skillSearchReducer(reducers.initialState, action)

    expect(nextState.resultComponentState).toBeDefined()
    expect(nextState).not.toBe(reducers.initialState)
  })

  it('should update searchHeaderComponentState when searchHeaderComponentStateChanged', () => {
    const newHeaderState: SearchHeaderComponentState = {
      activeViewMode: 'basic',
      selectedSearchConfig: 'config1'
    }
    const action = skillSearchActions.searchHeaderComponentStateChanged(newHeaderState)
    const nextState = reducers.skillSearchReducer(reducers.initialState, action)

    expect(nextState.searchHeaderComponentState).toBeDefined()
    if (nextState.searchHeaderComponentState) {
      expect(nextState.searchHeaderComponentState.activeViewMode).toBe('basic')
      expect(nextState.searchHeaderComponentState.selectedSearchConfig).toBe('config1')
    }
    expect(nextState).not.toBe(reducers.initialState)
  })

  it('should update diagramComponentState when diagramComponentStateChanged', () => {
    const newDiagramState: GroupByCountDiagramComponentState = {
      activeDiagramType: DiagramType.PIE
    }
    const action = skillSearchActions.diagramComponentStateChanged(newDiagramState)
    const nextState = reducers.skillSearchReducer(reducers.initialState, action)

    expect(nextState.diagramComponentState).toBeDefined()
    if (nextState.diagramComponentState) {
      expect(nextState.diagramComponentState.activeDiagramType).toBe('PIE')
    }
    expect(nextState).not.toBe(reducers.initialState)
  })

  it('should set criteria and searchLoadingIndicator=true when routerNavigatedAction succeeds and queryParams present', () => {
    const { routerNavigatedAction } = require('@ngrx/router-store')
    const mockSchema = require('./skill-search.parameters')
    jest.spyOn(mockSchema.skillSearchCriteriasSchema, 'safeParse').mockReturnValue({
      success: true,
      data: { foo: 'bar' }
    })
    const preState = { ...reducers.initialState, criteria: {}, searchLoadingIndicator: false }
    const action = routerNavigatedAction({ payload: { routerState: { root: { queryParams: { foo: 'bar' } } } } })
    const nextState = reducers.skillSearchReducer(preState, action)

    expect(nextState.criteria).toEqual({ foo: 'bar' })
    expect(nextState.searchLoadingIndicator).toBe(true)
  })

  it('should not change state when routerNavigatedAction fails schema parse', () => {
    const { routerNavigatedAction } = require('@ngrx/router-store')
    const mockSchema = require('./skill-search.parameters')
    jest.spyOn(mockSchema.skillSearchCriteriasSchema, 'safeParse').mockReturnValue({
      success: false
    })
    const preState = { ...reducers.initialState, criteria: { name: 'bar' }, searchLoadingIndicator: true }
    const action = routerNavigatedAction({ payload: { routerState: { root: { queryParams: { foo: 'bar' } } } } })
    const nextState = reducers.skillSearchReducer(preState, action)

    expect(nextState).toBe(preState)
  })
})
