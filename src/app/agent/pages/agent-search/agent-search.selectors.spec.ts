import { ColumnType } from '@onecx/angular-accelerator'
import * as selectors from './agent-search.selectors'

describe('AgentSearch selectors', () => {
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
        desc: 'should use empty string fallback when item.id is falsy',
        input: [
          { id: '', name: 'A' },
          { id: '', name: 'B' },
          { id: '', name: 'C' }
        ] as never[],
        expected: [
          { imagePath: '', id: '', name: 'A' },
          { imagePath: '', id: '', name: 'B' },
          { imagePath: '', id: '', name: 'C' }
        ]
      }
    ]

    cases.forEach(({ desc, input, expected }) => {
      it(desc, () => {
        expect(selectors.selectResults.projector(input)).toEqual(expected)
      })
    })
  })

  it('selectAgentSearchViewModel should combine all selector results', () => {
    // ACTION S11: Adjust test data
    const columns = [{ id: 'name', nameKey: 'Col 1', columnType: ColumnType.STRING }]
    const searchCriteria = {
      pageNumber: 1,
      pageSize: 10,
      name: 'A'
    }
    const results = [{ imagePath: '', id: '1', name: 'A test' }]
    const chartVisible = true

    const result = selectors.selectAgentSearchViewModel.projector(
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
