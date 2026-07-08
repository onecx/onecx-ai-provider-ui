import { SkillDetailsState } from './pages/skill-details/skill-details.state'
import { SkillSearchState } from './pages/skill-search/skill-search.state'

export interface SkillState {
  details: SkillDetailsState
  search: SkillSearchState
}
