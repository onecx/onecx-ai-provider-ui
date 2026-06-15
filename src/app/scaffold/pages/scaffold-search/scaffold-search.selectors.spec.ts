import { ColumnType } from '@onecx/angular-accelerator'
import * as selectors from './scaffold-search.selectors'

describe('ScaffoldSearch selectors', () => {
  describe('selectResults projector', () => {
    it('should map Scaffold results to RowListGridData[]', () => {
      const input = [
        { id: '1', name: 'Scaffold A', sourceProduct: 'ProductX' },
        { id: '2', name: 'Scaffold B', sourceProduct: undefined }
      ]
      const result = selectors.selectResults.projector(input)
      
      expect(result).toEqual([
        { imagePath: '', id: '1', name: 'Scaffold A', sourceProduct: 'ProductX' },
        { imagePath: '', id: '2', name: 'Scaffold B', sourceProduct: undefined }
      ])
    })

    it('should handle undefined id and default to empty string', () => {
      const input = [
        { id: undefined, name: 'Scaffold No ID', sourceProduct: 'ProductX' },
        { id: null, name: 'Scaffold Null ID', sourceProduct: undefined }
      ]
      const result = selectors.selectResults.projector(input as any)
    
      expect(result).toEqual([
        { imagePath: '', id: '', name: 'Scaffold No ID', sourceProduct: 'ProductX' },
        { imagePath: '', id: '', name: 'Scaffold Null ID', sourceProduct: undefined }
      ])
    })
  })

  it('selectScaffoldSearchViewModel should combine all selector results', () => {
    const columns = [{ id: 'name', nameKey: 'Name', columnType: ColumnType.STRING }]
    const searchCriteria = { name: 'Test', sourceProduct: 'Prod' }
    const results = [{ imagePath: '', id: '1', name: 'Scaffold A', sourceProduct: 'Prod' }]

    const result = selectors.selectScaffoldSearchViewModel.projector(
      columns,
      searchCriteria,
      results,
      [],
      'basic',
      false
    )

    expect(result).toEqual({
      columns,
      searchCriteria,
      results,
      displayedColumns: [],
      viewMode: 'basic',
      chartVisible: false
    })
  })

  it('selectDisplayedColumns should return matching columns', () => {
    const columns = [
      { id: 'name', nameKey: 'Name', columnType: ColumnType.STRING },
      { id: 'sourceProduct', nameKey: 'Source Product', columnType: ColumnType.STRING }
    ]
    const result = selectors.selectDisplayedColumns.projector(columns, ['name'])
    
    expect(result).toEqual([{ id: 'name', nameKey: 'Name', columnType: ColumnType.STRING }])
  })

  it('selectDisplayedColumns should return empty array when displayedColumns undefined', () => {
    const columns = [{ id: 'name', nameKey: 'Name', columnType: ColumnType.STRING }]
    const result = selectors.selectDisplayedColumns.projector(columns, null)
    
    expect(result).toEqual([])
  })
})
