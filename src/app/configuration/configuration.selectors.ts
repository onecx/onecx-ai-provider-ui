import { createFeatureSelector } from '@ngrx/store'
import { configurationFeature } from './configuration.reducers'
import { ConfigurationState } from './configuration.state'

export const selectConfigurationFeature = createFeatureSelector<ConfigurationState>(configurationFeature.name)
