import {
  ColumnType,
  DiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'

import * as selectors from './scaffold-search.selectors'

describe('ScaffoldSearch selectors', () => {
  describe('selectResults projector', () => {
    // ACTION S11: Adjust test data
    const cases = [
      {
        desc: 'should map results to RowListGridData[]',
        input: [
          { id: '1', name: 'A' },
          { id: '2', name: 'B' }
        ] as never[],
        expected: [
          { imagePath: '', id: '1', name: 'A' },
          { imagePath: '', id: '2', name: 'B' }
        ]
      },
      {
        desc: 'should omit results without a valid id',
        input: [
          { id: null, name: 'A' },
          { id: undefined, name: 'B' },
          { id: 'keep-me', name: 'C' }
        ] as never[],
        expected: [{ imagePath: '', id: 'keep-me', name: 'C' }]
      }
    ]

    cases.forEach(({ desc, input, expected }) => {
      it(desc, () => {
        expect(selectors.selectResults.projector(input)).toEqual(expected)
      })
    })
  })

  describe('selectSearchState projector', () => {
    it('should combine search-related state', () => {
      const searchCriteria = {
        pageNumber: 1,
        pageSize: 10,
        name: 'test'
      }

      const result = selectors.selectSearchState.projector(searchCriteria, false, true)

      expect(result).toEqual({
        searchCriteria,
        searchLoadingIndicator: false,
        searchExecuted: true
      })
    })
  })

  describe('selectComponentState projector', () => {
    it('should combine component-related state', () => {
      const resultComponentState = {} as InteractiveDataViewComponentState
      const searchHeaderComponentState = {} as SearchHeaderComponentState
      const diagramComponentState = {} as DiagramComponentState
      const chartVisible = true

      const result = selectors.selectComponentState.projector(
        resultComponentState,
        searchHeaderComponentState,
        diagramComponentState,
        chartVisible
      )

      expect(result).toEqual({
        resultComponentState,
        searchHeaderComponentState,
        diagramComponentState,
        chartVisible
      })
    })
  })

  describe('selectScaffoldSearchViewModel projector', () => {
    it('selectScaffoldSearchViewModel should combine all selector results', () => {
      const columns = [{ id: 'name', nameKey: 'Col 1', columnType: ColumnType.STRING }]
      const results = [{ imagePath: '', id: '1', name: 'A test' }]

      const searchState = {
        searchCriteria: {
          pageNumber: 1,
          pageSize: 10,
          name: 'A'
        },
        searchLoadingIndicator: false,
        searchExecuted: true
      }

      const componentState = {
        resultComponentState: null,
        searchHeaderComponentState: null,
        diagramComponentState: null,
        chartVisible: true
      }

      const result = selectors.selectScaffoldSearchViewModel.projector(columns, results, searchState, componentState)

      expect(result).toEqual({
        columns,
        results,
        searchCriteria: searchState.searchCriteria,
        searchLoadingIndicator: false,
        searchExecuted: true,
        resultComponentState: null,
        searchHeaderComponentState: null,
        diagramComponentState: null,
        chartVisible: true
      })
    })
  })
})
