import { createActionGroup, emptyProps, props } from '@ngrx/store'
import { DataTableColumn } from '@onecx/angular-accelerator'
import { Provider } from '../../../shared/generated'
import { ProviderSearchCriteria } from './provider-search.parameters'

export const ProviderSearchActions = createActionGroup({
  source: 'ProviderSearch',
  events: {
    'Delete provider button clicked': props<{
      id: number | string
    }>(),
    'Delete provider cancelled': emptyProps(),
    'Delete provider succeeded': emptyProps(),
    'Delete provider failed': props<{
      error: string | null
    }>(),

    'Create provider button clicked': emptyProps(),
    'Edit provider button clicked': props<{
      id: number | string
    }>(),
    'Create provider cancelled': emptyProps(),
    'Update provider cancelled': emptyProps(),
    'Create provider succeeded': emptyProps(),
    'Update provider succeeded': emptyProps(),
    'Create provider failed': props<{
      error: string | null
    }>(),
    'Update provider failed': props<{
      error: string | null
    }>(),
    'Edit provider details button clicked': props<{
      id: number | string
    }>(),
    'Details button clicked': props<{
      id: number | string
    }>(),
    'Search button clicked': props<{
      searchCriteria: ProviderSearchCriteria
    }>(),
    'Reset button clicked': emptyProps(),
    'provider search results received': props<{
      results: Provider[]
      totalNumberOfResults: number
    }>(),
    'provider search results loading failed': props<{ error: string | null }>(),
    'Displayed columns changed': props<{
      displayedColumns: DataTableColumn[]
    }>(),
    'Chart visibility rehydrated': props<{
      visible: boolean
    }>(),
    'Chart visibility toggled': emptyProps(),
    'View mode changed': props<{
      viewMode: 'basic' | 'advanced'
    }>(),
    'Export button clicked': emptyProps()
  }
})
