import { Scaffold, Skill } from 'src/app/shared/generated'

export interface ScaffoldDetailsState {
  details: Scaffold | undefined
  detailsLoadingIndicator: boolean
  detailsLoaded: boolean
  editMode: boolean
  isSubmitting: boolean

  skills: Skill[]
  skillsLoadingIndicator: boolean
  skillsLoaded: boolean
}
