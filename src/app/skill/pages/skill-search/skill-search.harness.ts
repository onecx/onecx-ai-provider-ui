import { ComponentHarness } from '@angular/cdk/testing'
import {
  GroupByCountDiagramHarness,
  InteractiveDataViewHarness,
  SearchHeaderHarness
} from '@onecx/angular-accelerator/testing'

export class SkillSearchHarness extends ComponentHarness {
  static hostSelector = 'app-skill-search'

  getHeader = this.locatorFor(SearchHeaderHarness)
  getSearchResults = this.locatorFor(InteractiveDataViewHarness)
  getDiagram = this.locatorForOptional(GroupByCountDiagramHarness)
}
