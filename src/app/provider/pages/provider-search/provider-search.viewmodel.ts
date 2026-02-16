import { DataTableColumn, RowListGridData } from '@onecx/portal-integration-angular'
import { ProviderSearchCriteria } from './provider-search.parameters'

export interface ProviderSearchViewModel {
  columns: DataTableColumn[]
  searchCriteria: ProviderSearchCriteria
  results: RowListGridData[]
  displayedColumns: DataTableColumn[]
  viewMode: 'basic' | 'advanced'
  chartVisible: boolean
}
