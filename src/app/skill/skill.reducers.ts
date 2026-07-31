import { combineReducers, createFeature } from '@ngrx/store'

import { skillDetailsReducer } from './pages/skill-details/skill-details.reducers'
import { skillSearchReducer } from './pages/skill-search/skill-search.reducers'
import { SkillState } from './skill.state'

export const skillFeature = createFeature({
  name: 'skill',
  reducer: combineReducers<SkillState>({
    details: skillDetailsReducer,
    search: skillSearchReducer
  })
})
