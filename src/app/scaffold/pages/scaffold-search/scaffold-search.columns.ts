import { ColumnType, DataTableColumn } from '@onecx/angular-accelerator'

export const scaffoldSearchColumns: DataTableColumn[] = [
  {
    columnType: ColumnType.STRING,
    id: 'changeMe',
    nameKey: 'SCAFFOLD_SEARCH.RESULTS.CHANGE_ME',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  }
  // ACTION S6: Define search results columns
]
