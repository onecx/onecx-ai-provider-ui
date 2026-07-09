import { Agent, AgentGroup, Model, Provider, Scaffold, Tool } from 'src/app/shared/generated'

export interface AgentDetailsViewModel {
  details: Agent | undefined
  detailsLoadingIndicator: boolean
  providers: Provider[]
  providersLoadingIndicator: boolean
  providersLoaded: boolean
  models: Model[]
  modelsLoadingIndicator: boolean
  modelsLoaded: boolean
  scaffolds: Scaffold[]
  scaffoldsLoadingIndicator: boolean
  scaffoldsLoaded: boolean
  tools: Tool[]
  toolsLoadingIndicator: boolean
  toolsLoaded: boolean
  groups: AgentGroup[]
  groupsLoadingIndicator: boolean
  groupsLoaded: boolean
  backNavigationPossible: boolean
  detailsLoaded: boolean
  editMode: boolean
  isSubmitting: boolean
}
