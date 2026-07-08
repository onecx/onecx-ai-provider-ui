import { Skill } from 'src/app/shared/generated'

export interface SkillDetailsState {
  details: Skill | undefined
  detailsLoadingIndicator: boolean
  detailsLoaded: boolean
  editMode: boolean
  isSubmitting: boolean
}
