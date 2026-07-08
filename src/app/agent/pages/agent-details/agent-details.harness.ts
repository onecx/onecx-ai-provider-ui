import { ComponentHarness } from '@angular/cdk/testing'
import { DataTableHarness, PageHeaderHarness } from '@onecx/angular-accelerator/testing'

export class AgentDetailsHarness extends ComponentHarness {
  static hostSelector = 'app-agent-details'

  getHeader = this.locatorFor(PageHeaderHarness)
  getDataTable = this.locatorFor(DataTableHarness)
}
