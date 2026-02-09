import { MCPServer } from '../../../shared/generated'

export interface MCPServerDetailsState {
  details: MCPServer | undefined
  detailsLoadingIndicator: boolean
  detailsLoaded: boolean
  editMode: boolean
  isSubmitting: boolean
  isApiKeyHidden: boolean
}
