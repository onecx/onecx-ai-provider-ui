import { createFeatureSelector } from '@ngrx/store'

import { agentFeature } from './agent.reducers'
import { AgentState } from './agent.state'

export const selectAgentFeature = createFeatureSelector<AgentState>(agentFeature.name)
