import {
  DataTableColumn,
  DiagramComponentState,
  InteractiveDataViewComponentState,
  RowListGridData,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'

import { ScaffoldSearchCriteria } from './scaffold-search.parameters'

export interface ScaffoldSearchViewModel {
  columns: DataTableColumn[]
  searchCriteria: ScaffoldSearchCriteria
  results: RowListGridData[]
  resultComponentState: InteractiveDataViewComponentState | null
  searchHeaderComponentState: SearchHeaderComponentState | null
  diagramComponentState: DiagramComponentState | null
  chartVisible: boolean
  searchLoadingIndicator: boolean
  searchExecuted: boolean
}
