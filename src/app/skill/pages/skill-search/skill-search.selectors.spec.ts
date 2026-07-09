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
        desc: 'should use empty string fallback when item.id is falsy',
        input: [
          { id: '', changeMe: 'A' },
          { id: '', changeMe: 'B' },
          { id: '', changeMe: 'C' }
        ] as never[],
        expected: [
          { imagePath: '', id: '', changeMe: 'A' },
          { imagePath: '', id: '', changeMe: 'B' },
          { imagePath: '', id: '', changeMe: 'C' }
        ]
      }
    ]

    cases.forEach(({ desc, input, expected }) => {
      it(desc, () => {
        expect(selectors.selectResults.projector(input)).toEqual(expected)
      })
    })
  })

  it('selectSkillSearchViewModel should combine all selector results', () => {
    // ACTION S11: Adjust test data
    const columns = [{ id: 'changeMe', nameKey: 'Col 1', columnType: ColumnType.STRING }]
    const searchCriteria = {
      name: 'A'
    }
    const results = [{ imagePath: '', id: '1', changeMe: 'A test' }]
    const chartVisible = true

    const result = selectors.selectSkillSearchViewModel.projector(
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
