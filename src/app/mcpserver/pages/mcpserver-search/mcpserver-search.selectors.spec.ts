import { ColumnType } from "@onecx/angular-accelerator"
import * as selectors from './mcpserver-search.selectors'

describe('McpServerSearch selectors', () => {

  describe('selectResults projector', () => {
    it('should map MCPServer results to RowListGridData[]', () => {
      const input = [
        { id: '1', name: 'A', description: 'desc', url: 'http://a', apiKey: 'key1' },
        { id: '2', name: 'B', description: 'desc2', url: 'http://b', apiKey: 'key2' }
      ]
      const expected = [
        { imagePath: '', id: '1', name: 'A', description: 'desc', url: 'http://a', apiKey: 'key1' },
        { imagePath: '', id: '2', name: 'B', description: 'desc2', url: 'http://b', apiKey: 'key2' }
      ]
      expect(selectors.selectResults.projector(input)).toEqual(expected)
    })

    it('should preserve nested configuration when present', () => {
      const input = [
        { id: '3', name: 'C', description: 'desc3', configuration: { id: 'ai1', name: 'AI' } }
      ]
      const expected = [
        { imagePath: '', id: '3', name: 'C', description: 'desc3', configuration: { id: 'ai1', name: 'AI' } }
      ]
      expect(selectors.selectResults.projector(input)).toEqual(expected)
    })

  })

  it('selectConfigurationSearchViewModel should combine all selector results', () => {
    const columns = [{ id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING }]
    const searchCriteria = {
      name: 'Test Name',
      description: 'Test Description',
      vdb: 'vdb1',
      vdbCollection: 'collection1',
      id: 1,
      limit: 10
    }
    const results = [{ imagePath: '', id: '1', name: 'A', description: 'desc', vdb: 'vdb1', vdbCollection: 'c1' }]    
    const chartVisible = true

    const result = selectors.selectMCPServerSearchViewModel.projector(
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