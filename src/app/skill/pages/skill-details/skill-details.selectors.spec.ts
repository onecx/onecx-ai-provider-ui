import { selectSkillDetailsViewModel } from './skill-details.selectors'

describe('SkillDetails selectors', () => {
  describe('selectSkillDetailsViewModel', () => {
    it('should combine the input to be the viewmodel', () => {
      const details = { id: '10' }
      const detailsLoadingIndicator = true
      const backNavigationPossible = true
      const detailsLoaded = true
      const editMode = true
      const isSubmitting = true
      expect(
        selectSkillDetailsViewModel.projector(
          details,
          detailsLoadingIndicator,
          backNavigationPossible,
          detailsLoaded,
          editMode,
          isSubmitting
        )
      ).toEqual({
        details,
        detailsLoadingIndicator,
        backNavigationPossible,
        detailsLoaded,
        editMode,
        isSubmitting
      })
    })
  })
})
