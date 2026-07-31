import { DataTableColumn, RowListGridData } from '@onecx/angular-accelerator'

import { ProviderSearchCriteria } from './provider-search.parameters'

export interface ProviderSearchViewModel {
  columns: DataTableColumn[]
  searchCriteria: ProviderSearchCriteria
  results: RowListGridData[]
  displayedColumns: DataTableColumn[]
  viewMode: 'basic' | 'advanced'
  chartVisible: boolean
}
