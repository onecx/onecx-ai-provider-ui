import { ComponentHarness } from '@angular/cdk/testing'
import { PageHeaderHarness } from '@onecx/angular-accelerator/testing'

export class ProviderDetailsHarness extends ComponentHarness {
  static hostSelector = 'app-provider-details'

  getHeader = this.locatorFor(PageHeaderHarness)
}
