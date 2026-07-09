import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { scaffoldFeature } from '../../scaffold.reducers'
import { initialState } from './scaffold-details.reducers'
import { ScaffoldDetailsViewModel } from './scaffold-details.viewmodel'

import { Scaffold, Skill, Tool } from 'src/app/shared/generated'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'

export const scaffoldDetailsSelectors = createChildSelectors(scaffoldFeature.selectDetails, initialState)

const selectScaffoldDetailsCollections = createSelector(
  scaffoldDetailsSelectors.selectSkills,
  scaffoldDetailsSelectors.selectSkillsLoadingIndicator,
  scaffoldDetailsSelectors.selectSkillsLoaded,
  scaffoldDetailsSelectors.selectTools,
  scaffoldDetailsSelectors.selectToolsLoadingIndicator,
  scaffoldDetailsSelectors.selectToolsLoaded,
  (
    skills: Skill[],
    skillsLoadingIndicator: boolean,
    skillsLoaded: boolean,
    tools: Tool[],
    toolsLoadingIndicator: boolean,
    toolsLoaded: boolean
  ) => ({
    skills,
    skillsLoadingIndicator,
    skillsLoaded,
    tools,
    toolsLoadingIndicator,
    toolsLoaded
  })
)

export const selectScaffoldDetailsViewModel = createSelector(
  scaffoldDetailsSelectors.selectDetails,
  scaffoldDetailsSelectors.selectDetailsLoadingIndicator,
  selectBackNavigationPossible,
  scaffoldDetailsSelectors.selectDetailsLoaded,
  scaffoldDetailsSelectors.selectEditMode,
  scaffoldDetailsSelectors.selectIsSubmitting,
  selectScaffoldDetailsCollections,
  (
    details: Scaffold | undefined,
    detailsLoadingIndicator: boolean,
    backNavigationPossible: boolean,
    detailsLoaded: boolean,
    editMode: boolean,
    isSubmitting: boolean,
    collections: {
      skills: Skill[]
      skillsLoadingIndicator: boolean
      skillsLoaded: boolean
      tools: Tool[]
      toolsLoadingIndicator: boolean
      toolsLoaded: boolean
    },
  ): ScaffoldDetailsViewModel => ({
    details,
    detailsLoadingIndicator,
    backNavigationPossible,
    detailsLoaded,
    editMode,
    isSubmitting,
    ...collections
  })
)
