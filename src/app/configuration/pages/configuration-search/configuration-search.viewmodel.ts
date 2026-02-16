import {
  DataTableColumn,
  DiagramComponentState,
  InteractiveDataViewComponentState,
  RowListGridData,
  SearchHeaderComponentState
} from '@onecx/portal-integration-angular'
import { ConfigurationSearchCriteria } from './configuration-search.parameters'

export interface ConfigurationSearchViewModel {
  columns: DataTableColumn[]
  searchCriteria: ConfigurationSearchCriteria
  results: RowListGridData[]
  displayedColumns: DataTableColumn[]
  resultComponentState: InteractiveDataViewComponentState | null
  searchHeaderComponentState: SearchHeaderComponentState | null
  diagramComponentState: DiagramComponentState | null
  chartVisible: boolean
  searchLoadingIndicator: boolean
  searchExecuted: boolean
}
