import { selectProviderSearchViewModel, selectDisplayedColumns, selectResults } from "./provider-search.selectors"

describe('ProviderSearch selectors', () => {
  it('should map results to RowListGridData', () => {
    const results = [
      {
        id: '1',
        name: 'Test',
        description: 'Desc',
        llmUrl: 'url',
        modelName: 'model',
      }
    ]
    const mapped = selectResults.projector(results)
    expect(mapped).toEqual([
      {
        imagePath: '',
        id: '1',
        name: 'Test',
        description: 'Desc',
        llmUrl: 'url',
        modelName: 'model',
      }
    ])
  })

  it('should filter and map displayed columns', () => {
    const columns = [
      { id: 'col1', nameKey: 'Col1' },
      { id: 'col2', nameKey: 'Col2' }
    ] as any
    const displayedColumns = ['col2', 'col1']
    const mapped = selectDisplayedColumns.projector(columns, displayedColumns)
    expect(mapped).toEqual([
      { id: 'col2', nameKey: 'Col2' },
      { id: 'col1', nameKey: 'Col1' }
    ])
  })

  it('should build ProviderSearchViewModel', () => {
    const columns = [{ id: 'col1', nameKey: 'Col1' }] as any
    const searchCriteria = { name: 'Test' }
    const results = [{ id: '1', name: 'Test', modelName: 'model' }]
    const viewMode = 'basic'
    const chartVisible = true

    const vm = selectProviderSearchViewModel.projector(
      columns,
      searchCriteria,
      selectResults.projector(results),
      selectDisplayedColumns.projector(columns, ['col1']),
      viewMode,
      chartVisible
    )
    expect(vm).toEqual({
      columns,
      searchCriteria,
      results: [
        {
          imagePath: '',
          id: '1',
          name: 'Test',
          description: undefined,
          llmUrl: undefined,
          modelName: 'model',
        }
      ],
      displayedColumns: [{ id: 'col1', nameKey: 'Col1' }],
      viewMode,
      chartVisible
    })
  })

  it('should return empty array when displayedColumns is null', () => {
    const columns = [
      { id: 'col1', nameKey: 'Col1' },
      { id: 'col2', nameKey: 'Col2' }
    ] as any
    const displayedColumns = null
    const mapped = selectDisplayedColumns.projector(columns, displayedColumns)
    expect(mapped).toEqual([])
  })

  it('should return empty array when displayedColumns is empty array', () => {
    const columns = [
      { id: 'col1', nameKey: 'Col1' },
      { id: 'col2', nameKey: 'Col2' }
    ] as any
    const displayedColumns: string[] = []
    const mapped = selectDisplayedColumns.projector(columns, displayedColumns)
    expect(mapped).toEqual([])
  })
})