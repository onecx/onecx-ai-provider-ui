import { ColumnType } from '@onecx/angular-accelerator'
import * as selectors from './configuration-search.selectors'

describe('ConfigurationSearch selectors', () => {
  describe('selectResults projector', () => {
    const cases = [
      {
        desc: 'should map results to RowListGridData[]',
        input: [
          { id: '1', name: 'A', description: 'desc', vdb: 'vdb1', vdbCollection: 'c1' },
          { id: '2', name: 'B', description: 'desc2', vdb: 'vdb2', vdbCollection: 'c2' }
        ],
        expected: [
          { imagePath: '', id: '1', name: 'A', description: 'desc', vdb: 'vdb1', vdbCollection: 'c1' },
          { imagePath: '', id: '2', name: 'B', description: 'desc2', vdb: 'vdb2', vdbCollection: 'c2' }
        ]
      },
      {
        desc: 'should use empty string fallback when item.id is falsy',
        input: [
          { id: undefined, name: 'A', description: 'desc' },
          { id: '', name: 'B', description: 'desc2' },
          { name: 'C', description: 'desc3' }
        ],
        expected: [
          { imagePath: '', id: '', name: 'A', description: 'desc' },
          { imagePath: '', id: '', name: 'B', description: 'desc2' },
          { imagePath: '', id: '', name: 'C', description: 'desc3' }
        ]
      }
    ]
    cases.forEach(({ desc, input, expected }) => {
      it(desc, () => {
        expect(selectors.selectResults.projector(input)).toEqual(expected)
      })
    })
  })

  describe('selectDisplayedColumns projector', () => {
    it('should map displayedColumns ids to columns', () => {
      const columns = [
        { id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING },
        { id: 'col2', nameKey: 'Col 2', columnType: ColumnType.STRING }
      ]
      const displayedColumns = ['col2', 'col1']
      expect(selectors.selectDisplayedColumns.projector(columns, displayedColumns)).toEqual([
        { id: 'col2', nameKey: 'Col 2', columnType: ColumnType.STRING },
        { id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING }
      ])
    })

    it('should return [] if displayedColumns is undefined', () => {
      const columns = [
        { id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING },
        { id: 'col2', nameKey: 'Col 2', columnType: ColumnType.STRING }
      ]
      expect(selectors.selectDisplayedColumns.projector(columns, null)).toEqual([])
    })
  })

  describe('selectConfigurationSearchViewModel projector', () => {
    it('should combine grouped selector results', () => {
      const coreState = {
        columns: [{ id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING }],
        searchCriteria: { name: 'Test Name' },
        results: [{ imagePath: '', id: '1' }],
        displayedColumns: [{ id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING }]
      }

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

      const result = selectors.selectConfigurationSearchViewModel.projector(coreState, componentStates, uiState)

      expect(result).toEqual({
        ...coreState,
        ...componentStates,
        ...uiState
      })
    })
  })

  describe('selectSearchCoreState projector', () => {
    it('should group core data correctly', () => {
      const columns = [{ id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING }]
      const searchCriteria = { name: 'test' }
      const results = [{ imagePath: '', id: '1' }]
      const displayedColumns = [{ id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING }]

      const result = selectors.selectSearchCoreState.projector(columns, searchCriteria, results, displayedColumns)

      expect(result).toEqual({
        columns,
        searchCriteria,
        results,
        displayedColumns
      })
    })
  })

  describe('selectComponentStates projector', () => {
    it('should group component states correctly', () => {
      const resultComponentState = { some: 'state' } as Partial<unknown>
      const searchHeaderComponentState = { header: 'state' } as Partial<unknown>
      const diagramComponentState = { diagram: 'state' } as Partial<unknown>

      const result = selectors.selectComponentStates.projector(
        resultComponentState,
        searchHeaderComponentState,
        diagramComponentState
      )

      expect(result).toEqual({
        resultComponentState,
        searchHeaderComponentState,
        diagramComponentState
      })
    })
  })

  describe('selectUiState projector', () => {
    it('should group UI state correctly', () => {
      const chartVisible = true
      const searchLoadingIndicator = false
      const searchExecuted = true

      const result = selectors.selectUiState.projector(chartVisible, searchLoadingIndicator, searchExecuted)

      expect(result).toEqual({
        chartVisible,
        searchLoadingIndicator,
        searchExecuted
      })
    })
  })
})
