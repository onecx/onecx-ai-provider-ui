import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { scaffoldFeature } from '../../scaffold.reducers'
import { initialState } from './scaffold-details.reducers'
import { ScaffoldDetailsViewModel } from './scaffold-details.viewmodel'

import { Scaffold, Skill } from 'src/app/shared/generated'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'

export const scaffoldDetailsSelectors = createChildSelectors(scaffoldFeature.selectDetails, initialState)

export const selectScaffoldDetailsViewModel = createSelector(
  scaffoldDetailsSelectors.selectDetails,
  scaffoldDetailsSelectors.selectDetailsLoadingIndicator,
  selectBackNavigationPossible,
  scaffoldDetailsSelectors.selectDetailsLoaded,
  scaffoldDetailsSelectors.selectEditMode,
  scaffoldDetailsSelectors.selectIsSubmitting,
  scaffoldDetailsSelectors.selectSkills,
  scaffoldDetailsSelectors.selectSkillsLoadingIndicator,
  scaffoldDetailsSelectors.selectSkillsLoaded,
  (
    details: Scaffold | undefined,
    detailsLoadingIndicator: boolean,
    backNavigationPossible: boolean,
    detailsLoaded: boolean,
    editMode: boolean,
    isSubmitting: boolean,
    skills: Skill[],
    skillsLoadingIndicator: boolean,
    skillsLoaded: boolean
  ): ScaffoldDetailsViewModel => ({
    details,
    detailsLoadingIndicator,
    backNavigationPossible,
    detailsLoaded,
    editMode,
    isSubmitting,
    skills,
    skillsLoadingIndicator,
    skillsLoaded
  })
)
