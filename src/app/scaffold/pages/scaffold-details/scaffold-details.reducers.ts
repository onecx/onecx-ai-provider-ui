import { createReducer, on } from '@ngrx/store'
import { scaffoldDetailsActions } from './scaffold-details.actions'
import { ScaffoldDetailsState } from './scaffold-details.state'

export const initialState: ScaffoldDetailsState = {
  details: undefined,
  detailsLoadingIndicator: true,
  detailsLoaded: false,
  editMode: false,
  isSubmitting: false,
  skills: [],
  skillsLoadingIndicator: true,
  skillsLoaded: false
}

export const scaffoldDetailsReducer = createReducer(
  initialState,
  on(
    scaffoldDetailsActions.scaffoldDetailsReceived,
    (state: ScaffoldDetailsState, { details }): ScaffoldDetailsState => ({
      ...state,
      details,
      detailsLoadingIndicator: false,
      detailsLoaded: true
    })
  ),
  on(
    scaffoldDetailsActions.scaffoldSkillsReceived,
    (state: ScaffoldDetailsState, { skills }): ScaffoldDetailsState => ({
      ...state,
      skills,
      skillsLoadingIndicator: false,
      skillsLoaded: true
    })
  ),
  on(
    scaffoldDetailsActions.scaffoldSkillsLoadingFailed,
    (state: ScaffoldDetailsState): ScaffoldDetailsState => ({
      ...state,
      skills: [],
      skillsLoadingIndicator: false,
      skillsLoaded: false
    })
  ),
  on(
    scaffoldDetailsActions.scaffoldDetailsLoadingFailed,
    (state: ScaffoldDetailsState): ScaffoldDetailsState => ({
      ...state,
      details: undefined,
      detailsLoadingIndicator: false,
      detailsLoaded: false
    })
  ),
  on(
    scaffoldDetailsActions.navigatedToDetailsPage,
    (): ScaffoldDetailsState => ({
      ...initialState,
      detailsLoadingIndicator: true
    })
  ),
  on(
    scaffoldDetailsActions.editButtonClicked,
    (state: ScaffoldDetailsState): ScaffoldDetailsState => ({
      ...state,
      editMode: true
    })
  ),
  on(
    scaffoldDetailsActions.saveButtonClicked,
    (state: ScaffoldDetailsState): ScaffoldDetailsState => ({
      ...state,
      isSubmitting: true
    })
  ),
  on(
    scaffoldDetailsActions.cancelEditConfirmClicked,
    scaffoldDetailsActions.cancelEditNotDirty,
    scaffoldDetailsActions.updateScaffoldCancelled,
    (state: ScaffoldDetailsState): ScaffoldDetailsState => ({
      ...state,
      editMode: false
    })
  ),
  on(
    scaffoldDetailsActions.updateScaffoldSucceeded,
    (state: ScaffoldDetailsState, { details }): ScaffoldDetailsState => ({
      ...state,
      details,
      editMode: false,
      isSubmitting: false
    })
  ),
  on(
    scaffoldDetailsActions.updateScaffoldFailed,
    (state: ScaffoldDetailsState): ScaffoldDetailsState => ({
      ...state,
      isSubmitting: false
    })
  )
)
