import { ColumnType, DataTableColumn } from '@onecx/angular-accelerator'

export const skillSearchColumns: DataTableColumn[] = [
  {
    columnType: ColumnType.STRING,
    id: 'name',
    nameKey: 'SKILL_SEARCH.RESULTS.NAME',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'SKILL_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'SKILL_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'SKILL_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  },
  {
    columnType: ColumnType.STRING,
    id: 'description',
    nameKey: 'SKILL_SEARCH.RESULTS.DESCRIPTION',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: ['SKILL_SEARCH.PREDEFINED_GROUP.EXTENDED', 'SKILL_SEARCH.PREDEFINED_GROUP.FULL']
  }
]
