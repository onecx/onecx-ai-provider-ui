import { ColumnType, DataTableColumn } from '@onecx/angular-accelerator'

export const scaffoldSearchColumns: DataTableColumn[] = [
  {
    columnType: ColumnType.STRING,
    id: 'name',
    nameKey: 'SCAFFOLD_SEARCH.RESULTS.NAME',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  },
  {
    columnType: ColumnType.STRING,
    id: 'source',
    nameKey: 'SCAFFOLD_SEARCH.RESULTS.SOURCE',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  },
  {
    columnType: ColumnType.STRING,
    id: 'systemPrompt',
    nameKey: 'SCAFFOLD_SEARCH.RESULTS.SYSTEM_PROMPT',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: ['SCAFFOLD_SEARCH.PREDEFINED_GROUP.EXTENDED', 'SCAFFOLD_SEARCH.PREDEFINED_GROUP.FULL']
  },
  {
    columnType: ColumnType.STRING,
    id: 'sourceProduct',
    nameKey: 'SCAFFOLD_SEARCH.RESULTS.SOURCE_PRODUCT',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  }
]
