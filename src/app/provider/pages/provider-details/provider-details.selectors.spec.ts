import { selectProviderDetailsViewModel } from "./provider-details.selectors"

describe('selectProviderDetailsViewModel', () => {
  it('should return correct view model for all fields', () => {
    const details = { id: '1', name: 'Test', apiKey: 'key' } as any
    const result = selectProviderDetailsViewModel.projector(details, true, false)
    expect(result).toEqual({ details, editMode: true, isApiKeyHidden: false })
  })

  it('should handle undefined details', () => {
    const result = selectProviderDetailsViewModel.projector(undefined, false, true)
    expect(result).toEqual({ details: undefined, editMode: false, isApiKeyHidden: true })
  })
})