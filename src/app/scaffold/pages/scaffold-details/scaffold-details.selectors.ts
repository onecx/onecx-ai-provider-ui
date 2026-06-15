import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { Scaffold } from 'src/app/shared/generated'
import { scaffoldFeature } from '../../scaffold.reducers'
import { initialState } from './scaffold-details.reducers'
import { ScaffoldDetailsViewModel } from './scaffold-details.viewmodel'

export const scaffoldDetailsSelectors = createChildSelectors(scaffoldFeature.selectDetails, initialState)

export const selectScaffoldDetailsViewModel = createSelector(
  scaffoldDetailsSelectors.selectDetails,
  scaffoldDetailsSelectors.selectEditMode,
  (
    details: Scaffold | undefined,
    editMode,
  ): ScaffoldDetailsViewModel => ({
    details,
    editMode
  })
)
