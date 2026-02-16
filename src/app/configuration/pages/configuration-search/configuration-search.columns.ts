import { ColumnType, DataTableColumn } from '@onecx/angular-accelerator'

export const configurationSearchColumns: DataTableColumn[] = [  
  {
    id: 'name',
    columnType: ColumnType.STRING,
    nameKey: 'CONFIGURATION_SEARCH.COLUMNS.NAME',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: ['CONFIGURATION_SEARCH.PREDEFINED_GROUP.EXTENDED', 'CONFIGURATION_SEARCH.PREDEFINED_GROUP.FULL']
  },
  {
    id: 'description',
    columnType: ColumnType.STRING,
    nameKey: 'CONFIGURATION_SEARCH.COLUMNS.DESCRIPTION',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: ['CONFIGURATION_SEARCH.PREDEFINED_GROUP.EXTENDED', 'CONFIGURATION_SEARCH.PREDEFINED_GROUP.FULL']
  }
]
