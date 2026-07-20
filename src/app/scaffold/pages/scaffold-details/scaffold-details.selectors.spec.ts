import { selectScaffoldDetailsCollections, selectScaffoldDetailsViewModel } from './scaffold-details.selectors'

describe('ScaffoldDetails selectors', () => {
  describe('selectScaffoldDetailsCollections', () => {
    it('should combine skills and tools state', () => {
      const skills = [{ id: 'skill-1' }]
      const tools = [{ id: 'tool-1' }]

      expect(selectScaffoldDetailsCollections.projector(skills, false, true, tools, false, true)).toEqual({
        skills,
        skillsLoadingIndicator: false,
        skillsLoaded: true,
        tools,
        toolsLoadingIndicator: false,
        toolsLoaded: true
      })
    })
  })

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
      const tools = [{ id: 'tool-1' }]
      const toolsLoadingIndicator = false
      const toolsLoaded = true
      const collections = {
        skills,
        skillsLoadingIndicator,
        skillsLoaded,
        tools,
        toolsLoadingIndicator,
        toolsLoaded
      }
      expect(
        selectScaffoldDetailsViewModel.projector(
          details,
          detailsLoadingIndicator,
          backNavigationPossible,
          detailsLoaded,
          editMode,
          isSubmitting,
          collections
        )
      ).toEqual({
        details,
        detailsLoadingIndicator,
        backNavigationPossible,
        detailsLoaded,
        editMode,
        isSubmitting,
        ...collections
      })
    })
  })
})
