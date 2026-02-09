import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'
import {
  AlwaysGrantPermissionChecker,
  BreadcrumbService,
  HAS_PERMISSION_CHECKER,
  PortalCoreModule,
  UserService
} from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { PrimeIcons } from 'primeng/api'
import { of } from 'rxjs'
import { MCPServerDetailsActions } from './mcpserver-details.actions'
import { MCPServerDetailsComponent } from './mcpserver-details.component'
import { MCPServerDetailsHarness } from './mcpserver-details.harness'
import { initialState } from './mcpserver-details.reducers'
import { selectMCPServerDetailsViewModel } from './mcpserver-details.selectors'
import { MCPServerDetailsViewModel } from './mcpserver-details.viewmodel'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

describe('MCPServerDetailsComponent', () => {
  const origAddEventListener = window.addEventListener
  const origPostMessage = window.postMessage

  let listeners: any[] = []
  window.addEventListener = (_type: any, listener: any) => {
    listeners.push(listener)
  }

  window.removeEventListener = (_type: any, listener: any) => {
    listeners = listeners.filter((l) => l !== listener)
  }

  window.postMessage = (m: any) => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    listeners.forEach((l) =>
      l({
        data: m,
        stopImmediatePropagation: () => { },
        stopPropagation: () => { }
      })
    )
  }

  afterAll(() => {
    window.addEventListener = origAddEventListener
    window.postMessage = origPostMessage
  })

  let component: MCPServerDetailsComponent
  let fixture: ComponentFixture<MCPServerDetailsComponent>
  let store: MockStore<Store>
  let breadcrumbService: BreadcrumbService
  let mcpserverDetails: MCPServerDetailsHarness
  let translateService: TranslateService

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseMCPServerDetailsViewModel: MCPServerDetailsViewModel = {
    details: {      
      apiKey: "",
      description: "",
      name: "",
      url: ""      
    },
    detailsLoadingIndicator: false,
    detailsLoaded: true,
    backNavigationPossible: true,
    editMode: false,
    isSubmitting: false,
    isApiKeyHidden: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MCPServerDetailsComponent],
      imports: [
        PortalCoreModule,
        LetDirective,
        FormsModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        TranslateTestingModule.withTranslations('en', require('./../../../../assets/i18n/en.json')).withTranslations(
          'de',
          require('./../../../../assets/i18n/de.json')
        ),
        HttpClientTestingModule
      ],
      providers: [
        provideMockStore({
          initialState: { mcpserver: { details: initialState } }
        }),
        BreadcrumbService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideUserServiceMock(),
        {
          provide: HAS_PERMISSION_CHECKER,
          useClass: AlwaysGrantPermissionChecker
        }
      ]
    }).compileComponents()
    const userServiceMock = TestBed.inject(UserService)
    userServiceMock.permissions$.next(["MCPSERVER#BACK"])

    translateService = TestBed.inject(TranslateService)
    translateService.use('en')

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectMCPServerDetailsViewModel, baseMCPServerDetailsViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(MCPServerDetailsComponent)
    component = fixture.componentInstance
    breadcrumbService = TestBed.inject(BreadcrumbService)
    fixture.detectChanges()
    mcpserverDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, MCPServerDetailsHarness)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display correct breadcrumbs', async () => {
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const pageHeader = await mcpserverDetails.getHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Details')
    expect(await searchBreadcrumbItem!.getText()).toEqual('Details')
  })

  it('should display translated headers', async () => {
    const pageHeader = await mcpserverDetails.getHeader()
    expect(await pageHeader.getHeaderText()).toEqual('MCPServer Details')
    expect(await pageHeader.getSubheaderText()).toEqual('Display of MCPServer Details')
  })

  it('should have 2 inline actions', async () => {
    const pageHeader = await mcpserverDetails.getHeader()
    const inlineActions = await pageHeader.getInlineActionButtons()

    expect(inlineActions.length).toBe(2)

    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    expect(backAction).toBeTruthy()

    const editAction = await pageHeader.getInlineActionButtonByIcon(PrimeIcons.PENCIL)
    expect(editAction).toBeTruthy()
  })

  it('should have overflow menu button', async () => {
    const pageHeader = await mcpserverDetails.getHeader()
    const overflowAction = await pageHeader.getOverflowActionMenuButton()
    expect(overflowAction).toBeTruthy()
  })

  it('should dispatch navigateBackButtonClicked action on back button click', async () => {
    jest.spyOn(window.history, 'back')
    const doneFn = jest.fn()

    const pageHeader = await mcpserverDetails.getHeader()
    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    store.scannedActions$.pipe(ofType(MCPServerDetailsActions.navigateBackButtonClicked)).subscribe(() => {
      doneFn()
    })
    await backAction?.click()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should display item details in page header', async () => {
    component.headerLabels$ = of([
      {
        label: 'HELLO_DETAILS.FORM.ID',
        labelPipe: TranslatePipe,
        value: 'test id'
      },
      {
        label: 'first',
        value: 'first value'
      },
      {
        label: 'second',
        value: 'second value'
      },
      {
        label: 'third',
        icon: PrimeIcons.PLUS
      },
      {
        label: 'fourth',
        value: 'fourth value',
        icon: PrimeIcons.QUESTION
      }
    ])

    const pageHeader = await mcpserverDetails.getHeader()
    const objectDetails = await pageHeader.getObjectInfos()
    expect(objectDetails.length).toBe(5)

    const testDetailItem = await pageHeader.getObjectInfoByLabel('HELLO_DETAILS.FORM.ID')
    expect(await testDetailItem?.getLabel()).toEqual('HELLO_DETAILS.FORM.ID')
    expect(await testDetailItem?.getValue()).toEqual('test id')
    expect(await testDetailItem?.getIcon()).toBeUndefined()

    const firstDetailItem = await pageHeader.getObjectInfoByLabel('first')
    expect(await firstDetailItem?.getLabel()).toEqual('first')
    expect(await firstDetailItem?.getValue()).toEqual('first value')
    expect(await firstDetailItem?.getIcon()).toBeUndefined()

    const secondDetailItem = await pageHeader.getObjectInfoByLabel('second')
    expect(await secondDetailItem?.getLabel()).toEqual('second')
    expect(await secondDetailItem?.getValue()).toEqual('second value')
    expect(await secondDetailItem?.getIcon()).toBeUndefined()

    const thirdDetailItem = await pageHeader.getObjectInfoByLabel('third')
    expect(await thirdDetailItem?.getLabel()).toEqual('third')
    expect(await thirdDetailItem?.getValue()).toEqual('')
    expect(await thirdDetailItem?.getIcon()).toContain(PrimeIcons.PLUS)

    const fourthDetailItem = await pageHeader.getObjectInfoByLabel('fourth')
    expect(await fourthDetailItem?.getLabel()).toEqual('fourth')
    expect(await fourthDetailItem?.getValue()).toEqual('fourth value')
    expect(await fourthDetailItem?.getIcon()).toContain(PrimeIcons.QUESTION)
  })

  it('edit clicked should dispatch edit action', async () => {
    jest.spyOn(store, 'dispatch')
    const pageHeader = await mcpserverDetails.getHeader()
    const editAction = await pageHeader.getInlineActionButtonByIcon(PrimeIcons.PENCIL)

    await editAction?.click()

    expect(store.dispatch).toHaveBeenCalledWith(MCPServerDetailsActions.editButtonClicked())
  })

  it('save clicked should dispatch save action', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectMCPServerDetailsViewModel, {
      ...baseMCPServerDetailsViewModel,
      editMode: true
    })
    store.refreshState()
    fixture.detectChanges()

    const pageHeader = await mcpserverDetails.getHeader()
    const saveAction = await pageHeader.getInlineActionButtonByIcon(PrimeIcons.SAVE)
    await saveAction?.click()

    expect(store.dispatch).toHaveBeenCalledWith(MCPServerDetailsActions.saveButtonClicked({
      details: baseMCPServerDetailsViewModel.details!
    }))
  })

  it('cancel clicked should dispatch cancel action', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectMCPServerDetailsViewModel, {
      ...baseMCPServerDetailsViewModel,
      editMode: true
    })
    store.refreshState()
    fixture.detectChanges()

    const pageHeader = await mcpserverDetails.getHeader()
    const cancelAction = await pageHeader.getInlineActionButtonByIcon(PrimeIcons.TIMES)
    await cancelAction?.click()

    expect(store.dispatch).toHaveBeenCalledWith(MCPServerDetailsActions.cancelButtonClicked({ dirty: false }))
  })

  it('delete clicked should dispatch delete action', async () => {
    jest.spyOn(store, 'dispatch')
    const pageHeader = await mcpserverDetails.getHeader()
    const overflowMenuButton = await pageHeader.getOverflowActionMenuButton()
    expect(overflowMenuButton).toBeDefined()
    await overflowMenuButton?.click()

    const overflowMenuItem = await pageHeader.getOverFlowMenuItem('Delete')
    await overflowMenuItem!.selectItem()

    expect(store.dispatch).toHaveBeenCalledWith(MCPServerDetailsActions.deleteButtonClicked())
  })

  it('should dispatch apiKeyToggleVisibility action on api key visibility toggle', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectMCPServerDetailsViewModel, {
      ...baseMCPServerDetailsViewModel,
      isApiKeyHidden: true
    })
    store.refreshState()
    fixture.detectChanges()

    const toggleButton = await mcpserverDetails.getToggleAPIAccessButton()
    expect(toggleButton).toBeDefined()
    await toggleButton?.click()

    expect(store.dispatch).toHaveBeenCalledWith(MCPServerDetailsActions.apiKeyVisibilityToggled())
  })

  it('should work with details', async () => {
    store.overrideSelector(selectMCPServerDetailsViewModel, {
      ...baseMCPServerDetailsViewModel,
      details: {
        id: "my-id",
        name: "my-name",
        apiKey: "my-apikey"
      }
    })
    store.refreshState()
    fixture.detectChanges()

    const pageHeader = await mcpserverDetails.getHeader()
    const translatedLabel = translateService.instant('MCPSERVER_DETAILS.FORM.NAME')
    const idDetailItem = await pageHeader.getObjectInfoByLabel(translatedLabel)
    expect(await idDetailItem?.getValue()).toEqual('my-name')
  })

  it('handles missing details (covers optional chaining)', async () => {
    store.overrideSelector(selectMCPServerDetailsViewModel, {
      ...baseMCPServerDetailsViewModel,
      details: undefined
    } as any)
    store.refreshState()
    fixture.detectChanges()

    const pageHeader = await mcpserverDetails.getHeader()
    const translatedLabel = translateService.instant('MCPSERVER_DETAILS.FORM.NAME')
    const idDetailItem = await pageHeader.getObjectInfoByLabel(translatedLabel)
    expect(await idDetailItem?.getValue()).toBeFalsy()
    expect(component.formGroup.get('name')?.value).toBeFalsy()
  })
})
