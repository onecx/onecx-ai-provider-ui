import { Scaffold, Skill, Tool } from 'src/app/shared/generated'

export interface ScaffoldDetailsViewModel {
  details: Scaffold | undefined
  detailsLoadingIndicator: boolean
  backNavigationPossible: boolean
  detailsLoaded: boolean
  editMode: boolean
  isSubmitting: boolean
  skills: Skill[]
  skillsLoadingIndicator: boolean
  skillsLoaded: boolean
  tools: Tool[]
  toolsLoadingIndicator: boolean
  toolsLoaded: boolean
}
