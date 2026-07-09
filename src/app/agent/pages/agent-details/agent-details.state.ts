import { Agent, AgentGroup, Model, Provider, Scaffold, Tool } from 'src/app/shared/generated'

export interface AgentDetailsState {
  details: Agent | undefined
  detailsLoadingIndicator: boolean
  detailsLoaded: boolean

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

  editMode: boolean
  isSubmitting: boolean
}
