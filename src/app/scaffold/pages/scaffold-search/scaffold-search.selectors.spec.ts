import { ColumnType } from '@onecx/angular-accelerator'

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

  it('selectScaffoldSearchViewModel should combine all selector results', () => {
    // ACTION S11: Adjust test data
    const columns = [{ id: 'name', nameKey: 'Col 1', columnType: ColumnType.STRING }]
    const searchCriteria = {
      pageNumber: 1,
      pageSize: 10,
      name: 'A'
    }
    const results = [{ imagePath: '', id: '1', name: 'A test' }]
    const chartVisible = true

    const result = selectors.selectScaffoldSearchViewModel.projector(
      columns,
      searchCriteria,
      results,
      null,
      null,
      null,
      chartVisible,
      false,
      true
    )

    expect(result).toEqual({
      columns,
      searchCriteria,
      results,
      resultComponentState: null,
      searchHeaderComponentState: null,
      diagramComponentState: null,
      chartVisible,
      searchLoadingIndicator: false,
      searchExecuted: true
    })
  })
})
