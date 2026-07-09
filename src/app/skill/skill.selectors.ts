import { createFeatureSelector } from '@ngrx/store'

import { skillFeature } from './skill.reducers'
import { SkillState } from './skill.state'

export const selectSkillFeature = createFeatureSelector<SkillState>(skillFeature.name)
