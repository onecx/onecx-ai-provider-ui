import { Component } from '@angular/core'
import { Store } from '@ngrx/store'
import { Observable } from 'rxjs'

import { selectDashboardViewModel } from './dashboard.selectors'
import { DashboardViewModel } from './dashboard.viewmodel'

interface DashboardPanel {
  titleKey: string
  subtitleKey: string
  descriptionKey: string
  route: string
  icon: string
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class DashboardComponent {
  viewModel$: Observable<DashboardViewModel>
  readonly navigationPanels: DashboardPanel[] = [
    {
      titleKey: 'DASHBOARD.PANELS.AGENT.TITLE',
      subtitleKey: 'DASHBOARD.PANELS.AGENT.SUBTITLE',
      descriptionKey: 'DASHBOARD.PANELS.AGENT.DESCRIPTION',
      route: '../agent',
      icon: 'pi pi-sparkles'
    },
    {
      titleKey: 'DASHBOARD.PANELS.SCAFFOLD.TITLE',
      subtitleKey: 'DASHBOARD.PANELS.SCAFFOLD.SUBTITLE',
      descriptionKey: 'DASHBOARD.PANELS.SCAFFOLD.DESCRIPTION',
      route: '../configuration',
      icon: 'pi pi-file-edit'
    },
    {
      titleKey: 'DASHBOARD.PANELS.PROVIDER.TITLE',
      subtitleKey: 'DASHBOARD.PANELS.PROVIDER.SUBTITLE',
      descriptionKey: 'DASHBOARD.PANELS.PROVIDER.DESCRIPTION',
      route: '../provider',
      icon: 'pi pi-cloud'
    },
    {
      titleKey: 'DASHBOARD.PANELS.TOOL.TITLE',
      subtitleKey: 'DASHBOARD.PANELS.TOOL.SUBTITLE',
      descriptionKey: 'DASHBOARD.PANELS.TOOL.DESCRIPTION',
      route: '../mcpserver',
      icon: 'pi pi-wrench'
    }
    // {
    //   titleKey: 'DASHBOARD.PANELS.RUNTIME_CONFIG.TITLE',
    //   subtitleKey: 'DASHBOARD.PANELS.RUNTIME_CONFIG.SUBTITLE',
    //   descriptionKey: 'DASHBOARD.PANELS.RUNTIME_CONFIG.DESCRIPTION',
    //   route: '../configuration',
    //   icon: 'pi pi-cog'
    // }
  ]

  constructor(private readonly store: Store) {
    this.viewModel$ = this.store.select(selectDashboardViewModel)
  }
}
