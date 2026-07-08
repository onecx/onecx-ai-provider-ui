import { Agent } from 'src/app/shared/generated'

export interface AgentDetailsState {
  details: Agent | undefined
  detailsLoadingIndicator: boolean
  detailsLoaded: boolean
  editMode: boolean
  isSubmitting: boolean
}
