import { selectProviderSearchViewModel, selectDisplayedColumns, selectResults } from "./provider-search.selectors"

describe('ProviderSearch selectors', () => {
  it('should map results to RowListGridData', () => {
    const results = [
      {
        id: '1',
        name: 'Test',
        description: 'Desc',
        llmUrl: 'url'
      }
    ]
    const healthStatus = {
      '1': 'ONLINE'
    }
    const mapped = selectResults.projector(results, healthStatus)
    expect(mapped).toEqual([
      {
        imagePath: '',
        id: '1',
        name: 'Test',
        description: 'Desc',
        llmUrl: 'url',
        status: 'ONLINE'
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
    const healthStatus = { '1': 'ONLINE' }
    const viewMode = 'basic'
    const chartVisible = true

    const vm = selectProviderSearchViewModel.projector(
      columns,
      searchCriteria,
      selectResults.projector(results, healthStatus),
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
          status: 'ONLINE'
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

  it('should set NODATA when healthStatus is undefined', () => {
    const results = [{ id: '1', name: 'Test', modelName: 'model' }]
    const mapped = selectResults.projector(results, undefined as any)

    expect(mapped[0]['status']).toBe('NODATA')
  })

  it('should use empty id and return NODATA when id is undefined', () => {
    const results = [{ id: undefined, name: 'Test', modelName: 'model' }]
    const healthStatus = {}
    const mapped = selectResults.projector(results, healthStatus)

    expect(mapped[0]).toEqual(
      expect.objectContaining({
        id: '',
        status: 'NODATA'
      })
    )
  })

  it('should fallback to empty string when id is undefined', () => {
    const results = [
      {
        id: undefined,
        name: 'Test',
        description: 'Desc',
        llmUrl: 'url'
      }
    ]
    const mapped = selectResults.projector(results as any, undefined)

    expect(mapped).toEqual([
      {
        imagePath: '',
        id: '',
        name: 'Test',
        description: 'Desc',
        llmUrl: 'url',
        status: 'NODATA'
      }
    ])
  })
})