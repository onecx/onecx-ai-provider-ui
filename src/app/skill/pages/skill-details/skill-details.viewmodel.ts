import { Skill } from 'src/app/shared/generated'

export interface SkillDetailsViewModel {
  details: Skill | undefined
  detailsLoadingIndicator: boolean
  backNavigationPossible: boolean
  detailsLoaded: boolean
  editMode: boolean
  isSubmitting: boolean
}
