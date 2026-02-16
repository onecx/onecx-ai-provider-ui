import { ComponentHarness } from '@angular/cdk/testing'
import { DataTableHarness, PageHeaderHarness } from '@onecx/angular-accelerator/testing'

export class ConfigurationDetailsHarness extends ComponentHarness {
  static readonly hostSelector = 'app-configuration-details'

  getHeader = this.locatorFor(PageHeaderHarness)
  getDataTable = this.locatorFor(DataTableHarness)
}
