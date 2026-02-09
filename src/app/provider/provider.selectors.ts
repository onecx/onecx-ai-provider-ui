import { createFeatureSelector } from '@ngrx/store'
import { ProviderFeature } from './provider.reducers'
import { ProviderState } from './provider.state'

export const selectProviderFeature = createFeatureSelector<ProviderState>(ProviderFeature.name)
