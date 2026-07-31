import { ColumnType } from '@onecx/angular-accelerator'

import { initialState } from './mcpserver-search.reducers'
import * as selectors from './mcpserver-search.selectors'

describe('McpServerSearch selectors', () => {
  describe('selectResults projector', () => {
    it('should map MCPServer results to RowListGridData[]', () => {
      const input = [
        { id: '1', name: 'A', description: 'desc', url: 'http://a', apiKey: 'key1' },
        { id: '2', name: 'B', description: 'desc2', url: 'http://b', apiKey: 'key2' }
      ]
      const expected = [
        { imagePath: '', id: '1', name: 'A', description: 'desc', url: 'http://a', apiKey: 'key1' },
        { imagePath: '', id: '2', name: 'B', description: 'desc2', url: 'http://b', apiKey: 'key2' }
      ]
      expect(selectors.selectResults.projector(input)).toEqual(expected)
    })

    it('should set empty id when source id is undefined', () => {
      const input = [{ name: 'NoId' }]
      expect(selectors.selectResults.projector(input as any)).toEqual([{ imagePath: '', id: '', name: 'NoId' }])
    })
  })

  it('selectMCPServerSearchViewModel projector should merge three state groups', () => {
    const columns = [{ id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING }]
    const searchCriteria = { name: 'Test Name' }
    const results = [{ imagePath: '', id: '1', name: 'A', description: 'desc' }]
    const coreState = { columns, searchCriteria, results }
    const componentStates = {
      resultComponentState: null,
      searchHeaderComponentState: null,
      diagramComponentState: null
    }
    const uiState = {
      chartVisible: true,
      searchLoadingIndicator: false,
      searchExecuted: true
    }

    const result = selectors.selectMCPServerSearchViewModel.projector(coreState as any, componentStates, uiState)

    expect(result).toEqual({
      ...coreState,
      ...componentStates,
      ...uiState
    })
  })

  it('selectMCPServerSearchViewModel should combine values from store state', () => {
    const state = {
      mcpserver: {
        search: {
          ...initialState,
          columns: [{ id: 'name', nameKey: 'NAME', columnType: ColumnType.STRING }],
          criteria: { name: 'foo' },
          results: [{ id: '99', name: 'Server 99' }],
          resultComponentState: { layout: 'table' },
          searchHeaderComponentState: { activeViewMode: 'basic' },
          diagramComponentState: { activeDiagramType: 'pie' },
          chartVisible: true,
          searchLoadingIndicator: true,
          searchExecuted: true
        }
      }
    }

    const vm = selectors.selectMCPServerSearchViewModel(state as any)

    expect(vm.columns).toEqual([{ id: 'name', nameKey: 'NAME', columnType: ColumnType.STRING }])
    expect(vm.searchCriteria).toEqual({ name: 'foo' })
    expect(vm.results).toEqual([{ imagePath: '', id: '99', name: 'Server 99' }])
    expect(vm.resultComponentState).toEqual({ layout: 'table' })
    expect(vm.searchHeaderComponentState).toEqual({ activeViewMode: 'basic' })
    expect(vm.diagramComponentState).toEqual({ activeDiagramType: 'pie' })
    expect(vm.chartVisible).toBe(true)
    expect(vm.searchLoadingIndicator).toBe(true)
    expect(vm.searchExecuted).toBe(true)
  })
})
