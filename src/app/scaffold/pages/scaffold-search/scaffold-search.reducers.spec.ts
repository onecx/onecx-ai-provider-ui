import {
  DiagramType,
  GroupByCountDiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'

import { scaffoldSearchActions } from './scaffold-search.actions'
import * as reducers from './scaffold-search.reducers'

describe('scaffoldSearchReducer', () => {
  it('should reset results and criteria on resetButtonClicked', () => {
    const preState = { ...reducers.initialState, results: [{ id: '1' }], criteria: { name: 'val' } }
    const action = scaffoldSearchActions.resetButtonClicked()
    const nextState = reducers.scaffoldSearchReducer(preState, action)

    expect(nextState.results).toEqual([])
    expect(nextState.criteria).toEqual({})
  })

  it('should set searchLoadingIndicator and criteria on searchButtonClicked', () => {
    const searchCriteria = { name: 'foo' }
    const action = scaffoldSearchActions.searchButtonClicked({ searchCriteria })
    const nextState = reducers.scaffoldSearchReducer(reducers.initialState, action)

    expect(nextState.searchLoadingIndicator).toBe(true)
    expect(nextState.criteria).toEqual(searchCriteria)
  })

  it('should set results on scaffoldSearchResultsReceived', () => {
    const stream = [{ id: '1' }, { id: '2' }]
    const action = scaffoldSearchActions.scaffoldSearchResultsReceived({
      stream,
      size: 2,
      number: 0,
      totalElements: 2,
      totalPages: 1
    })
    const nextState = reducers.scaffoldSearchReducer(reducers.initialState, action)

    expect(nextState.results).toEqual(stream)
  })

  it('should clear results on scaffoldSearchResultsLoadingFailed', () => {
    const preState = { ...reducers.initialState, results: [{ id: '1' }] }
    const action = scaffoldSearchActions.scaffoldSearchResultsLoadingFailed({ error: null })
    const nextState = reducers.scaffoldSearchReducer(preState, action)

    expect(nextState.results).toEqual([])
  })

  it('should toggle chartVisible on chartVisibilityToggled', () => {
    const initialStateWithChartHidden = { ...reducers.initialState, chartVisible: false }
    const action = scaffoldSearchActions.chartVisibilityToggled()
    let nextState = reducers.scaffoldSearchReducer(initialStateWithChartHidden, action)

    expect(nextState.chartVisible).toBe(true)

    const stateWithChartVisible = { ...reducers.initialState, chartVisible: true }
    nextState = reducers.scaffoldSearchReducer(stateWithChartVisible, action)

    expect(nextState.chartVisible).toBe(false)
  })

  it('should update resultComponentState when resultComponentStateChanged', () => {
    const newComponentState: InteractiveDataViewComponentState = {}
    const action = scaffoldSearchActions.resultComponentStateChanged(newComponentState)
    const nextState = reducers.scaffoldSearchReducer(reducers.initialState, action)

    expect(nextState.resultComponentState).toBeDefined()
    expect(nextState).not.toBe(reducers.initialState)
  })

  it('should update searchHeaderComponentState when searchHeaderComponentStateChanged', () => {
    const newHeaderState: SearchHeaderComponentState = {
      activeViewMode: 'basic',
      selectedSearchConfig: 'config1'
    }
    const action = scaffoldSearchActions.searchHeaderComponentStateChanged(newHeaderState)
    const nextState = reducers.scaffoldSearchReducer(reducers.initialState, action)

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
    const action = scaffoldSearchActions.diagramComponentStateChanged(newDiagramState)
    const nextState = reducers.scaffoldSearchReducer(reducers.initialState, action)

    expect(nextState.diagramComponentState).toBeDefined()
    if (nextState.diagramComponentState) {
      expect(nextState.diagramComponentState.activeDiagramType).toBe('PIE')
    }
    expect(nextState).not.toBe(reducers.initialState)
  })

  it('should set criteria and searchLoadingIndicator=true when routerNavigatedAction succeeds and queryParams present', () => {
    const { routerNavigatedAction } = require('@ngrx/router-store')
    const mockSchema = require('./scaffold-search.parameters')
    jest.spyOn(mockSchema.scaffoldSearchCriteriasSchema, 'safeParse').mockReturnValue({
      success: true,
      data: { foo: 'bar' }
    })
    const preState = { ...reducers.initialState, criteria: {}, searchLoadingIndicator: false }
    const action = routerNavigatedAction({ payload: { routerState: { root: { queryParams: { foo: 'bar' } } } } })
    const nextState = reducers.scaffoldSearchReducer(preState, action)

    expect(nextState.criteria).toEqual({ foo: 'bar' })
    expect(nextState.searchLoadingIndicator).toBe(true)
  })

  it('should store skills on scaffoldSkillsReceived', () => {
    const skills = [{ id: '1', name: 'Skill 1' }, { id: '2', name: 'Skill 2' }]
    const action = scaffoldSearchActions.scaffoldSkillsReceived({ skills })
    const nextState = reducers.scaffoldSearchReducer(reducers.initialState, action)

    expect(nextState.skills).toEqual(skills)
  })

  it('should clear skills and leave searchLoadingIndicator untouched on scaffoldSkillsLoadingFailed', () => {
    const preState = { ...reducers.initialState, skills: [{ id: '1', name: 'Skill 1' }], searchLoadingIndicator: true }
    const action = scaffoldSearchActions.scaffoldSkillsLoadingFailed({ error: null })
    const nextState = reducers.scaffoldSearchReducer(preState, action)

    expect(nextState.skills).toEqual([])
    expect(nextState.searchLoadingIndicator).toBe(true)
  })

  it('should not change state when routerNavigatedAction fails schema parse', () => {
    const { routerNavigatedAction } = require('@ngrx/router-store')
    const mockSchema = require('./scaffold-search.parameters')
    jest.spyOn(mockSchema.scaffoldSearchCriteriasSchema, 'safeParse').mockReturnValue({
      success: false
    })
    const preState = { ...reducers.initialState, criteria: { name: 'bar' }, searchLoadingIndicator: true }
    const action = routerNavigatedAction({ payload: { routerState: { root: { queryParams: { foo: 'bar' } } } } })
    const nextState = reducers.scaffoldSearchReducer(preState, action)

    expect(nextState).toBe(preState)
  })
})
