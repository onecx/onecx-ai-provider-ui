import { Agent } from 'src/app/shared/generated'

export interface AgentDetailsViewModel {
  details: Agent | undefined
  detailsLoadingIndicator: boolean
  backNavigationPossible: boolean
  detailsLoaded: boolean
  editMode: boolean
  isSubmitting: boolean
}
