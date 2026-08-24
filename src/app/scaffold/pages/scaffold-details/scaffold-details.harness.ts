import { ComponentHarness } from '@angular/cdk/testing'

import { DataTableHarness, PageHeaderHarness } from '@onecx/angular-accelerator/testing'

export class ScaffoldDetailsHarness extends ComponentHarness {
  static readonly hostSelector = 'app-scaffold-details'

  getHeader = this.locatorFor(PageHeaderHarness)
  getDataTable = this.locatorFor(DataTableHarness)
}
