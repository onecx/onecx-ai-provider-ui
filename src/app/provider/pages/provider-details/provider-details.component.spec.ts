import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { AlwaysGrantPermissionChecker, BreadcrumbService, HAS_PERMISSION_CHECKER, PortalCoreModule } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { ProviderDetailsComponent } from './provider-details.component'
import { ProviderDetailsHarness } from './provider-details.harness'
import { initialState } from './provider-details.reducers'
import { selectProviderDetailsViewModel } from './provider-details.selectors'
import { ProviderDetailsViewModel } from './provider-details.viewmodel'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { ReactiveFormsModule } from '@angular/forms'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'

describe('ProviderDetailsComponent', () => {
  const origAddEventListener = window.addEventListener
  const origPostMessage = window.postMessage

  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable @typescript-eslint/no-empty-function */
  let listeners: any[] = []
  window.addEventListener = (_type: any, listener: any) => {
    listeners.push(listener)
  }

  window.removeEventListener = (_type: any, listener: any) => {
    listeners = listeners.filter((l) => l !== listener)
  }

  window.postMessage = (m: any) => {

    listeners.forEach((l) =>
      l({
        data: m,
        stopImmediatePropagation: () => { },
        stopPropagation: () => { }
      })
    )
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
  /* eslint-enable @typescript-eslint/no-empty-function */

  afterAll(() => {
    window.addEventListener = origAddEventListener
    window.postMessage = origPostMessage
  })

  let component: ProviderDetailsComponent
  let fixture: ComponentFixture<ProviderDetailsComponent>
  let store: MockStore<Store>
  let breadcrumbService: BreadcrumbService
  let ProviderDetails: ProviderDetailsHarness

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseProviderDetaulsViewModel: ProviderDetailsViewModel = {
    details: {
      id: '1',
      name: 'Test name',
      description: 'Test description',
      llmUrl: 'Test llmUrl',
      modelName: 'Test modelName',
      apiKey: 'TestAPIKey'
    },
    editMode: false,
    isApiKeyHidden: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProviderDetailsComponent],
      imports: [
        PortalCoreModule,
        LetDirective,
        ReactiveFormsModule,
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        TranslateTestingModule.withTranslations('en', require('./../../../../assets/i18n/en.json')).withTranslations(
          'de',
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('./../../../../assets/i18n/de.json')
        )
      ],
      providers: [
        provideMockStore({
          initialState: { Provider: { details: initialState } }
        }),
        BreadcrumbService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideUserServiceMock(),
        {
          provide: HAS_PERMISSION_CHECKER,
          useClass: AlwaysGrantPermissionChecker
        }
      ]
    }).compileComponents()

    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectProviderDetailsViewModel, baseProviderDetaulsViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(ProviderDetailsComponent)
    component = fixture.componentInstance
    breadcrumbService = TestBed.inject(BreadcrumbService)
    fixture.detectChanges()
    ProviderDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, ProviderDetailsHarness)
  })

  describe('ProviderDetailsComponent UI', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })

    it('should display correct breadcrumbs', async () => {
      jest.spyOn(breadcrumbService, 'setItems')

      component.ngOnInit()
      fixture.detectChanges()

      expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
      const pageHeader = await ProviderDetails.getHeader()
      const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Details')
      expect(await searchBreadcrumbItem!.getText()).toEqual('Details')
    })

    it('should display translated headers', async () => {
      const pageHeader = await ProviderDetails.getHeader()
      expect(await pageHeader.getHeaderText()).toEqual('Provider Details')
      expect(await pageHeader.getSubheaderText()).toEqual('Display of Provider Details')
    })

    it('should have 2 inline actions', async () => {
      const pageHeader = await ProviderDetails.getHeader()
      const inlineActions = await pageHeader.getInlineActionButtons()
      expect(inlineActions.length).toBe(2)

      const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
      expect(backAction).toBeTruthy()

      const editAction = await pageHeader.getInlineActionButtonByLabel('Edit')
      expect(editAction).toBeTruthy()
    })

    it('should navigate back on back button click', async () => {
      jest.spyOn(window.history, 'back')

      const pageHeader = await ProviderDetails.getHeader()
      const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
      await backAction?.click()

      expect(window.history.back).toHaveBeenCalledTimes(1)
    })

    it('should display item details in form fields', async () => {
      store.overrideSelector(selectProviderDetailsViewModel, baseProviderDetaulsViewModel)
      store.refreshState()

      const pageDetails = component.formGroup.value
      expect(pageDetails).toEqual({
        name: 'Test name',
        description: 'Test description',
        llmUrl: 'Test llmUrl',
        modelName: 'Test modelName',                
        apiKey: 'TestAPIKey'
      })
    })
  })

  describe('apiKey control safety', () => {
    it('should safely call disable on apiKey control if it exists', () => {
      const userMock = { hasPermission: () => false }
      const component = new ProviderDetailsComponent(store, breadcrumbService, userMock as any)
      jest.spyOn(component.formGroup.get('apiKey')!, 'disable')
      component.toggleEditMode(true)
      expect(component.formGroup.get('apiKey')?.disable).toHaveBeenCalled()
    })

    it('should not throw if apiKey control does not exist', () => {
      const userMock = { hasPermission: () => false }
      const component = new ProviderDetailsComponent(store, breadcrumbService, userMock as any)
      component.formGroup.removeControl('apiKey')
      expect(() => component.toggleEditMode(true)).not.toThrow()
    })
  })
})
