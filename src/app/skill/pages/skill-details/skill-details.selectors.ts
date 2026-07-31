import { createSelector } from '@ngrx/store'

import { createChildSelectors } from '@onecx/ngrx-accelerator'

import { Skill } from 'src/app/shared/generated'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'
import { initialState } from './skill-details.reducers'
import { SkillDetailsViewModel } from './skill-details.viewmodel'
import { skillFeature } from '../../skill.reducers'

export const skillDetailsSelectors = createChildSelectors(skillFeature.selectDetails, initialState)

export const selectSkillDetailsViewModel = createSelector(
  skillDetailsSelectors.selectDetails,
  skillDetailsSelectors.selectDetailsLoadingIndicator,
  selectBackNavigationPossible,
  skillDetailsSelectors.selectDetailsLoaded,
  skillDetailsSelectors.selectEditMode,
  skillDetailsSelectors.selectIsSubmitting,
  (
    details: Skill | undefined,
    detailsLoadingIndicator: boolean,
    backNavigationPossible: boolean,
    detailsLoaded: boolean,
    editMode: boolean,
    isSubmitting: boolean
  ): SkillDetailsViewModel => ({
    details,
    detailsLoadingIndicator,
    backNavigationPossible,
    detailsLoaded,
    editMode,
    isSubmitting
  })
)
