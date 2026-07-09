import { Scaffold, Skill, Tool } from 'src/app/shared/generated'

export interface ScaffoldDetailsState {
  details: Scaffold | undefined
  detailsLoadingIndicator: boolean
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
