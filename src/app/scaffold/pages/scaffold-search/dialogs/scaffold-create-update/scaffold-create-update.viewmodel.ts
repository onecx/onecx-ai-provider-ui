import { Scaffold, Skill } from 'src/app/shared/generated'

export interface ScaffoldCreateUpdateViewModel {
  itemToEdit: Scaffold | undefined
  skills: Skill[]
}
