import { ColumnType, DataTableColumn } from '@onecx/angular-accelerator'

export const mcpserverSearchColumns: DataTableColumn[] = [
  {
    columnType: ColumnType.STRING,
    id: 'name',
    nameKey: 'MCP_SERVER_SEARCH.RESULTS.NAME',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'MCP_SERVER_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'MCP_SERVER_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'MCP_SERVER_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  },
  {
    columnType: ColumnType.STRING,
    id: 'description',
    nameKey: 'MCP_SERVER_SEARCH.RESULTS.DESCRIPTION',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'MCP_SERVER_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'MCP_SERVER_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'MCP_SERVER_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  },  
  {
    columnType: ColumnType.STRING,
    id: 'url',
    nameKey: 'MCP_SERVER_SEARCH.RESULTS.URL',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'MCP_SERVER_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'MCP_SERVER_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  },
]
// ACTION S6: Define search results columns: https://onecx.github.io/docs/nx-plugins/current/general/getting_started/search/configure-search-results.html#action-6
