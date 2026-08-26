import { ComponentHarness } from '@angular/cdk/testing'

import { DataTableHarness, PageHeaderHarness } from '@onecx/angular-accelerator/testing'

export class SkillDetailsHarness extends ComponentHarness {
  static readonly hostSelector = 'app-skill-details'

  getHeader = this.locatorFor(PageHeaderHarness)
  getDataTable = this.locatorFor(DataTableHarness)
}
