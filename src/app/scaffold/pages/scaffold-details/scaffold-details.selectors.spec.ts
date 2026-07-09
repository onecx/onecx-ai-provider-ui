import { selectScaffoldDetailsViewModel } from './scaffold-details.selectors'

describe('ScaffoldDetails selectors', () => {
  describe('selectScaffoldDetailsViewModel', () => {
    it('should combine the input to be the viewmodel', () => {
      const details = { id: '10' }
      const detailsLoadingIndicator = true
      const backNavigationPossible = true
      const detailsLoaded = true
      const editMode = true
      const isSubmitting = true
      const skills = [{ id: 'skill-1' }]
      const skillsLoadingIndicator = false
      const skillsLoaded = true
      expect(
        selectScaffoldDetailsViewModel.projector(
          details,
          detailsLoadingIndicator,
          backNavigationPossible,
          detailsLoaded,
          editMode,
          isSubmitting,
          skills,
          skillsLoadingIndicator,
          skillsLoaded
        )
      ).toEqual({
        details,
        detailsLoadingIndicator,
        backNavigationPossible,
        detailsLoaded,
        editMode,
        isSubmitting,
        skills,
        skillsLoadingIndicator,
        skillsLoaded
      })
    })
  })
})
