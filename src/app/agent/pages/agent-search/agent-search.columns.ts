import { ColumnType, DataTableColumn } from '@onecx/angular-accelerator'

export const agentSearchColumns: DataTableColumn[] = [
  {
    columnType: ColumnType.STRING,
    id: 'name',
    nameKey: 'AGENT_SEARCH.RESULTS.NAME',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'AGENT_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'AGENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'AGENT_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  },
  {
    columnType: ColumnType.STRING,
    id: 'tenantId',
    nameKey: 'AGENT_SEARCH.RESULTS.TENANT_ID',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'AGENT_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'AGENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'AGENT_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  },
  {
    columnType: ColumnType.STRING,
    id: 'status',
    nameKey: 'AGENT_SEARCH.RESULTS.STATUS',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'AGENT_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'AGENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'AGENT_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  },
  {
    columnType: ColumnType.NUMBER,
    id: 'version',
    nameKey: 'AGENT_SEARCH.RESULTS.VERSION',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: ['AGENT_SEARCH.PREDEFINED_GROUP.EXTENDED', 'AGENT_SEARCH.PREDEFINED_GROUP.FULL']
  },
  {
    columnType: ColumnType.STRING,
    id: 'a2aEnabled',
    nameKey: 'AGENT_SEARCH.RESULTS.A2A_ENABLED',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: ['AGENT_SEARCH.PREDEFINED_GROUP.EXTENDED', 'AGENT_SEARCH.PREDEFINED_GROUP.FULL']
  },
  {
    columnType: ColumnType.STRING,
    id: 'modelId',
    nameKey: 'AGENT_SEARCH.RESULTS.MODEL_ID',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: ['AGENT_SEARCH.PREDEFINED_GROUP.FULL']
  }
]
