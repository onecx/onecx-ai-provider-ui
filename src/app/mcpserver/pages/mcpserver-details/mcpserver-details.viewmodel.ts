import { MCPServer } from '../../../shared/generated'

export interface MCPServerDetailsViewModel {
  details: MCPServer | undefined
  detailsLoadingIndicator: boolean
  backNavigationPossible: boolean
  detailsLoaded: boolean
  editMode: boolean
  isSubmitting: boolean
  isApiKeyHidden: boolean
}
