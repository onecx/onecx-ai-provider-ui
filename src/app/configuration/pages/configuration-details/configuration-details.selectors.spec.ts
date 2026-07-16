import {
  selectConfigurationDetailsViewModel,
  selectDetailsState,
  selectMcpServersState,
  selectProvidersState
} from './configuration-details.selectors'
import { Provider, MCPServer, Configuration } from 'src/app/shared/generated'

describe('selectConfigurationDetailsViewModel', () => {
  it('should return correct view model for all fields', () => {
    const detailsState = {
      details: { id: '1', name: 'Test' } as any,
      detailsLoadingIndicator: true,
      detailsLoaded: true
    }

    const providersState = {
      Providers: [{ id: 'p1', name: 'Provider1' } as Provider],
      ProvidersLoadingIndicator: false,
      ProvidersLoaded: true
    }

    const mcpServersState = {
      MCPServers: [{ id: 'm1', name: 'Server1' } as MCPServer],
      MCPServersLoadingIndicator: false,
      MCPServersLoaded: true
    }

    const result = selectConfigurationDetailsViewModel.projector(
      detailsState,
      providersState,
      mcpServersState,
      true,
      true,
      false
    )

    expect(result).toEqual({
      ...detailsState,
      ...providersState,
      ...mcpServersState,
      backNavigationPossible: true,
      editMode: true,
      isSubmitting: false
    })
  })

  it('should handle undefined states', () => {
    const result = selectConfigurationDetailsViewModel.projector(
      {
        details: undefined,
        detailsLoadingIndicator: false,
        detailsLoaded: false
      },
      {
        Providers: undefined,
        ProvidersLoadingIndicator: false,
        ProvidersLoaded: false
      },
      {
        MCPServers: undefined,
        MCPServersLoadingIndicator: false,
        MCPServersLoaded: false
      },
      false,
      false,
      false
    )

    expect(result).toEqual({
      details: undefined,
      detailsLoadingIndicator: false,
      detailsLoaded: false,
      Providers: undefined,
      ProvidersLoadingIndicator: false,
      ProvidersLoaded: false,
      MCPServers: undefined,
      MCPServersLoaded: false,
      MCPServersLoadingIndicator: false,
      backNavigationPossible: false,
      editMode: false,
      isSubmitting: false
    })
  })

  describe('selectDetailsState', () => {
    it('should group details state correctly', () => {
      const details = {
        id: '1',
        name: 'Test'
      } as Configuration
      const result = selectDetailsState.projector(details, true, false)
      expect(result).toEqual({
        details,
        detailsLoadingIndicator: true,
        detailsLoaded: false
      })
    })
  })

  describe('selectProvidersState', () => {
    it('should group providers state correctly', () => {
      const Providers = [{ id: 'p1' }] as Provider[]
      const result = selectProvidersState.projector(Providers, true, false)

      expect(result).toEqual({
        Providers,
        ProvidersLoadingIndicator: true,
        ProvidersLoaded: false
      })
    })
  })

  describe('selectMcpServersState', () => {
    it('should group mcpServers state correctly', () => {
      const MCPServers = [{ id: 'm1' }]
      const result = selectMcpServersState.projector(MCPServers, false, true)

      expect(result).toEqual({
        MCPServers,
        MCPServersLoadingIndicator: false,
        MCPServersLoaded: true
      })
    })
  })
})
