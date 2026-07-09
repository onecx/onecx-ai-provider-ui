import { selectProviderDetailsViewModel } from "./provider-details.selectors"

describe('selectProviderDetailsViewModel', () => {
  it('should return correct view model for all fields', () => {
    const details = { id: '1', name: 'Test', apiKey: 'key' } as any
    const models = [{ id: 'm1', modelIdentifier: 'Opus-3.5' } as any]
    const result = selectProviderDetailsViewModel.projector(details, models, false, false, false, true, false)
    expect(result).toEqual({
      details,
      models,
      modelsLoadingIndicator: false,
      modelMutationInProgress: false,
      isSubmitting: false,
      editMode: true,
      isApiKeyHidden: false
    })
  })

  it('should handle undefined details', () => {
    const result = selectProviderDetailsViewModel.projector(undefined, [], true, false, false, false, true)
    expect(result).toEqual({
      details: undefined,
      models: [],
      modelsLoadingIndicator: true,
      modelMutationInProgress: false,
      isSubmitting: false,
      editMode: false,
      isApiKeyHidden: true
    })
  })
})