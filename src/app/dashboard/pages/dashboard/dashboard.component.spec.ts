import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateModule } from '@ngx-translate/core'
import { CardModule } from 'primeng/card'
import { of } from 'rxjs'

import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'
import { PortalPageComponent, providePermissionService } from '@onecx/angular-utils'
import { AngularAcceleratorModule } from '@onecx/angular-accelerator'

import { DashboardComponent } from './dashboard.component'
import { selectDashboardViewModel } from './dashboard.selectors'

describe('DashboardComponent', () => {
  let component: DashboardComponent
  let fixture: ComponentFixture<DashboardComponent>
  let store: MockStore<Store>

  const mockViewModel = {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        LetDirective,
        RouterModule.forRoot([]),
        TranslateModule.forRoot(),
        AngularAcceleratorModule,
        PortalPageComponent,
        CardModule
      ],
      providers: [provideMockStore(), ...providePermissionService(), provideUserServiceMock()]
    }).compileComponents()

    store = TestBed.inject(MockStore)
    jest.spyOn(store, 'select').mockReturnValue(of(mockViewModel))

    fixture = TestBed.createComponent(DashboardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should select dashboard view model from store', () => {
    expect(store.select).toHaveBeenCalledWith(selectDashboardViewModel)
  })

  it('should provide navigation panels for all dashboard sections', () => {
    expect(component.navigationPanels).toHaveLength(5)
    expect(component.navigationPanels.map((panel) => panel.route)).toEqual([
      '../agent',
      '../scaffold',
      '../skill',
      '../provider',
      '../mcpserver'
    ])
  })

  it('should render every navigation panel inside a dashboard-card-link', () => {
    const links = fixture.nativeElement.querySelectorAll('a.dashboard-card-link')
    expect(links).toHaveLength(component.navigationPanels.length)
    links.forEach((link: HTMLElement) => {
      expect(link.querySelector('p-card')).not.toBeNull()
    })
  })
})
