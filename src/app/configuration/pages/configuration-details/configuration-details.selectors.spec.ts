
import { selectConfigurationDetailsViewModel } from "./configuration-details.selectors"

describe('selectConfigurationDetailsViewModel', () => {
  it('should return correct view model for all fields', () => {
    const details = { id: '1', name: 'Test' } as any
    const Providers = [{ id: 'p1', name: 'Provider1' }] as any
    const MCPServers = [{ id: 'm1', name: 'Server1' }] as any
    const result = selectConfigurationDetailsViewModel.projector(
      details, // details
      true,    // detailsLoadingIndicator
      true,    // detailsLoaded
      Providers, // Providers
      false,   // ProvidersLoadingIndicator
      true,    // ProvidersLoaded
      MCPServers, // MCPServers
      false,   // MCPServersLoadingIndicator
      true,    // MCPServersLoaded
      true,    // backNavigationPossible
      true,    // editMode
      false    // isSubmitting
    )
    expect(result).toEqual({
      details,
      detailsLoadingIndicator: true,
      detailsLoaded: true,
      Providers,
      ProvidersLoadingIndicator: false,
      ProvidersLoaded: true,
      MCPServers,
      MCPServersLoaded: true,
      MCPServersLoadingIndicator: false,
      backNavigationPossible: true,
      editMode: true,
      isSubmitting: false
    })
  })

  it('should handle undefined details, Providers, and MCPServers', () => {
    const result = selectConfigurationDetailsViewModel.projector(
      undefined, // details
      false,     // detailsLoadingIndicator
      false,     // detailsLoaded
      undefined, // Providers
      false,     // ProvidersLoadingIndicator
      false,     // ProvidersLoaded
      undefined, // MCPServers
      false,     // MCPServersLoadingIndicator
      false,     // MCPServersLoaded
      false,     // backNavigationPossible
      false,     // editMode
      false      // isSubmitting
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
})