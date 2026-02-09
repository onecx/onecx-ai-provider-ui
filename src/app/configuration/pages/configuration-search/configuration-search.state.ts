import {
  DataTableColumn,
  DiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/portal-integration-angular'
import { Configuration } from 'src/app/shared/generated'
import { ConfigurationSearchCriteria } from './configuration-search.parameters'

export interface ConfigurationSearchState {
  columns: DataTableColumn[]
  results: Configuration[]
  displayedColumns: string[] | null
  viewMode: 'basic' | 'advanced'
  chartVisible: boolean
  resultComponentState: InteractiveDataViewComponentState | null
  searchHeaderComponentState: SearchHeaderComponentState | null
  diagramComponentState: DiagramComponentState | null
  searchLoadingIndicator: boolean
  criteria: ConfigurationSearchCriteria
  searchExecuted: boolean
}
