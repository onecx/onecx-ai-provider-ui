import { ColumnType } from '@onecx/angular-accelerator'

import * as selectors from './skill-search.selectors'

describe('SkillSearch selectors', () => {
  describe('selectResults projector', () => {
    // ACTION S11: Adjust test data
    const cases = [
      {
        desc: 'should map results to RowListGridData[]',
        input: [
          { id: '1', changeMe: 'A' },
          { id: '2', changeMe: 'B' }
        ] as never[],
        expected: [
          { imagePath: '', id: '1', changeMe: 'A' },
          { imagePath: '', id: '2', changeMe: 'B' }
        ]
      },
      {
        desc: 'should omit results without a valid id',
        input: [
          { id: undefined, changeMe: 'A' },
          { changeMe: 'B' },
          { id: null, changeMe: 'C' },
          { id: 'keep-me', changeMe: 'D' }
        ] as never[],
        expected: [{ imagePath: '', id: 'keep-me', changeMe: 'D' }]
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
        name: 'A'
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
      const result = selectors.selectComponentState.projector(null, null, null, true)

      expect(result).toEqual({
        resultComponentState: null,
        searchHeaderComponentState: null,
        diagramComponentState: null,
        chartVisible: true
      })
    })
  })

  describe('selectSkillSearchViewModel projector', () => {
    it('should combine all selector results', () => {
      const columns = [
        {
          id: 'changeMe',
          nameKey: 'Col 1',
          columnType: ColumnType.STRING
        }
      ]

      const results = [
        {
          imagePath: '',
          id: '1',
          changeMe: 'A test'
        }
      ]

      const searchState = {
        searchCriteria: {
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

      const result = selectors.selectSkillSearchViewModel.projector(columns, results, searchState, componentState)

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
