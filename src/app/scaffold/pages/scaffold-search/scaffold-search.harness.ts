import { ComponentHarness } from '@angular/cdk/testing'

import {
  GroupByCountDiagramHarness,
  InteractiveDataViewHarness,
  SearchHeaderHarness
} from '@onecx/angular-accelerator/testing'

export class ScaffoldSearchHarness extends ComponentHarness {
  static readonly hostSelector = 'app-scaffold-search'

  getHeader = this.locatorFor(SearchHeaderHarness)
  getSearchResults = this.locatorFor(InteractiveDataViewHarness)
  getDiagram = this.locatorForOptional(GroupByCountDiagramHarness)
}
