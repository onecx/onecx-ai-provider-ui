import { ColumnType, DataTableColumn } from '@onecx/angular-accelerator'

export const ProviderSearchColumns: DataTableColumn[] = [
    {
        columnType: ColumnType.STRING,
        id: 'name',
        nameKey: 'PROVIDER_SEARCH.COLUMNS.NAME',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
            'PROVIDER_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'PROVIDER_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'PROVIDER_SEARCH.PREDEFINED_GROUP.FULL'
        ]
    },
    {
        columnType: ColumnType.STRING,
        id: 'type',
        nameKey: 'PROVIDER_SEARCH.COLUMNS.TYPE',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
            'PROVIDER_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'PROVIDER_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'PROVIDER_SEARCH.PREDEFINED_GROUP.FULL'
        ]
    },
    {
        columnType: ColumnType.STRING,
        id: 'description',
        nameKey: 'PROVIDER_SEARCH.COLUMNS.DESCRIPTION',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
            'PROVIDER_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'PROVIDER_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'PROVIDER_SEARCH.PREDEFINED_GROUP.FULL'
        ]
    },
    {
        columnType: ColumnType.STRING,
        id: 'llmUrl',
        nameKey: 'PROVIDER_SEARCH.COLUMNS.LLMURL',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
            'PROVIDER_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'PROVIDER_SEARCH.PREDEFINED_GROUP.FULL'
        ]
    },
    {
        columnType: ColumnType.STRING,
        id: 'authMode',
        nameKey: 'PROVIDER_SEARCH.COLUMNS.AUTH_MODE',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
            'PROVIDER_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'PROVIDER_SEARCH.PREDEFINED_GROUP.FULL'
        ]
    },
    {
        columnType: ColumnType.DATE,
        id: 'creationDate',
        nameKey: 'PROVIDER_SEARCH.COLUMNS.CREATION_DATE',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
            'PROVIDER_SEARCH.PREDEFINED_GROUP.FULL'
        ]
    },
    {
        columnType: ColumnType.DATE,
        id: 'modificationDate',
        nameKey: 'PROVIDER_SEARCH.COLUMNS.MODIFICATION_DATE',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
            'PROVIDER_SEARCH.PREDEFINED_GROUP.FULL'
        ]
    }
]

