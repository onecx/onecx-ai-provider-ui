import { AuthMode, ProviderType } from 'src/app/shared/generated'
import { selectProviderSearchViewModel, selectDisplayedColumns, selectResults } from './provider-search.selectors'

describe('ProviderSearch selectors', () => {
  it('should map results to RowListGridData', () => {
    const results = [
      {
        id: '1',
        name: 'Test',
        type: ProviderType.Openai,
        description: 'Desc',
        llmUrl: 'url',
        authMode: AuthMode.ApiKey,
        creationDate: '2026-01-01T00:00:00.000Z',
        modificationDate: '2026-01-02T00:00:00.000Z'
      }
    ]
    const mapped = selectResults.projector(results)
    expect(mapped).toEqual([
      {
        imagePath: '',
        id: '1',
        name: 'Test',
        type: ProviderType.Openai,
        description: 'Desc',
        llmUrl: 'url',
        authMode: AuthMode.ApiKey,
        creationDate: '2026-01-01T00:00:00.000Z',
        modificationDate: '2026-01-02T00:00:00.000Z'
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
    const results = [{ id: '1', name: 'Test', type: ProviderType.Openai }]
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
          type: ProviderType.Openai,
          description: undefined,
          llmUrl: undefined,
          authMode: undefined,
          creationDate: undefined,
          modificationDate: undefined
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

  it('should fallback to empty string when id is undefined', () => {
    const results = [
      {
        id: undefined,
        name: 'Test',
        description: 'Desc',
        llmUrl: 'url'
      }
    ]
    const mapped = selectResults.projector(results as any)

    expect(mapped).toEqual([
      {
        imagePath: '',
        id: '',
        name: 'Test',
        type: undefined,
        description: 'Desc',
        llmUrl: 'url',
        authMode: undefined,
        creationDate: undefined,
        modificationDate: undefined
      }
    ])
  })
})
