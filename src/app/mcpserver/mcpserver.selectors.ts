import { createFeatureSelector } from '@ngrx/store'
import { mcpserverFeature } from './mcpserver.reducers'
import { MCPServerState } from './mcpserver.state'

export const selectMCPServerFeature = createFeatureSelector<MCPServerState>(mcpserverFeature.name)
