import { ColumnType, DataTableColumn } from '@onecx/angular-accelerator'

export const scaffoldSearchColumns: DataTableColumn[] = [
  {
    id: 'name',
    columnType: ColumnType.STRING,
    nameKey: 'SCAFFOLD_SEARCH.COLUMNS.NAME',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  },
  {
    id: 'sourceProduct',
    columnType: ColumnType.STRING,
    nameKey: 'SCAFFOLD_SEARCH.COLUMNS.SOURCE_PRODUCT',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'SCAFFOLD_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  }
]
