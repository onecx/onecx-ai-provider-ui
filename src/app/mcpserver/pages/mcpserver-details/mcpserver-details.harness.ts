import { ComponentHarness } from '@angular/cdk/testing'

import { DataTableHarness, PageHeaderHarness } from '@onecx/angular-accelerator/testing'

export class MCPServerDetailsHarness extends ComponentHarness {
  static readonly hostSelector = 'app-mcpserver-details'

  getHeader = this.locatorFor(PageHeaderHarness)
  getDataTable = this.locatorFor(DataTableHarness)
}
