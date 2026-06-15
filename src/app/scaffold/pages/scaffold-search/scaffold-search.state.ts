import { DataTableColumn } from '@onecx/angular-accelerator'
import { Scaffold } from 'src/app/shared/generated'
import { ScaffoldSearchCriteria } from './scaffold-search.parameters'

export interface ScaffoldSearchState {
  columns: DataTableColumn[]
  results: Scaffold[]
  chartVisible: boolean
  displayedColumns: string[] | null
  searchLoadingIndicator: boolean
  criteria: ScaffoldSearchCriteria
  viewMode: 'basic' | 'advanced'
}
