import { createReducer, on } from '@ngrx/store'
import { skillDetailsActions } from './skill-details.actions'
import { SkillDetailsState } from './skill-details.state'

export const initialState: SkillDetailsState = {
  details: undefined,
  detailsLoadingIndicator: true,
  detailsLoaded: false,
  editMode: false,
  isSubmitting: false
}

export const skillDetailsReducer = createReducer(
  initialState,
  on(
    skillDetailsActions.skillDetailsReceived,
    (state: SkillDetailsState, { details }): SkillDetailsState => ({
      ...state,
      details,
      detailsLoadingIndicator: false,
      detailsLoaded: true
    })
  ),
  on(
    skillDetailsActions.skillDetailsLoadingFailed,
    (state: SkillDetailsState): SkillDetailsState => ({
      ...state,
      details: undefined,
      detailsLoadingIndicator: false,
      detailsLoaded: false
    })
  ),
  on(
    skillDetailsActions.navigatedToDetailsPage,
    (): SkillDetailsState => ({
      ...initialState,
      detailsLoadingIndicator: true
    })
  ),
  on(
    skillDetailsActions.editButtonClicked,
    (state: SkillDetailsState): SkillDetailsState => ({
      ...state,
      editMode: true
    })
  ),
  on(
    skillDetailsActions.saveButtonClicked,
    (state: SkillDetailsState): SkillDetailsState => ({
      ...state,
      isSubmitting: true
    })
  ),
  on(
    skillDetailsActions.cancelEditConfirmClicked,
    skillDetailsActions.cancelEditNotDirty,
    skillDetailsActions.updateSkillCancelled,
    (state: SkillDetailsState): SkillDetailsState => ({
      ...state,
      editMode: false
    })
  ),
  on(
    skillDetailsActions.updateSkillSucceeded,
    (state: SkillDetailsState, { details }): SkillDetailsState => ({
      ...state,
      details,
      editMode: false,
      isSubmitting: false
    })
  ),
  on(
    skillDetailsActions.updateSkillFailed,
    (state: SkillDetailsState): SkillDetailsState => ({
      ...state,
      isSubmitting: false
    })
  )
)
