import { Model, Provider } from 'src/app/shared/generated'

export interface ModelCreateUpdateViewModel {
  model: Model
  provider?: Provider
}
