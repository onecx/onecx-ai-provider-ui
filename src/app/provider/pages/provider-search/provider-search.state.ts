import { DataTableColumn } from '@onecx/portal-integration-angular'
import { Provider } from 'src/app/shared/generated'
import { ProviderSearchCriteria } from './provider-search.parameters'

export interface ProviderSearchState {
  columns: DataTableColumn[]
  results: Provider[]
  displayedColumns: string[] | null
  viewMode: 'basic' | 'advanced'
  chartVisible: boolean
  searchLoadingIndicator: boolean
  criteria: ProviderSearchCriteria
}
