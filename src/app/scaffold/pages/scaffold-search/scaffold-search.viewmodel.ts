import {
  DataTableColumn,
  RowListGridData,
} from '@onecx/angular-accelerator'
import { ScaffoldSearchCriteria } from './scaffold-search.parameters'

export interface ScaffoldSearchViewModel {
  columns: DataTableColumn[]
  searchCriteria: ScaffoldSearchCriteria
  results: RowListGridData[]
  displayedColumns: DataTableColumn[]
  viewMode: 'basic' | 'advanced'
  chartVisible: boolean
}
