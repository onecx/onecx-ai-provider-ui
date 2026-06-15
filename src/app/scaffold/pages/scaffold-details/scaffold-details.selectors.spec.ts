import { selectScaffoldDetailsViewModel } from './scaffold-details.selectors'

describe('ScaffoldDetails selectors', () => {
  it('should combine details and editMode into view model', () => {
    const result = selectScaffoldDetailsViewModel.projector(
      { id: '1', name: 'Test' } as any,
      true
    )

    expect(result).toEqual({
      details: { id: '1', name: 'Test' },
      editMode: true
    })
  })
})
