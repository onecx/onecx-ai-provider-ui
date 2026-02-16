import { selectMCPServerDetailsViewModel } from "./mcpserver-details.selectors"

describe('selectMCPServerDetailsViewModel', () => {
  it('should return correct view model for all fields', () => {
    const details = { id: '1', name: 'Test', apiKey: 'key' } as any
    const result = selectMCPServerDetailsViewModel.projector(
      details,
      true,
      false,
      false,
      false,
      false,
      false
    )
    expect(result).toEqual(
      {
        details,
        detailsLoadingIndicator: true,
        backNavigationPossible: false,
        detailsLoaded: false,
        editMode: false,
        isSubmitting: false,
        isApiKeyHidden: false
      }
    )
  })

  it('should handle undefined details', () => {
    const result = selectMCPServerDetailsViewModel.projector(
      undefined,
      true,
      false,
      false,
      false,
      false,
      false
    )
    expect(result).toEqual(
      {
        details: undefined,
        detailsLoadingIndicator: true,
        backNavigationPossible: false,
        detailsLoaded: false,
        editMode: false,
        isSubmitting: false,
        isApiKeyHidden: false
      }
    )
  })
})