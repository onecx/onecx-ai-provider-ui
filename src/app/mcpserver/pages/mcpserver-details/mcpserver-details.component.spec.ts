import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { PrimeIcons } from 'primeng/api'
import { of, firstValueFrom } from 'rxjs'

import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'
import { AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { AlwaysGrantPermissionChecker, HAS_PERMISSION_CHECKER, providePermissionService } from '@onecx/angular-utils'
import { BreadcrumbService } from '@onecx/angular-accelerator'
import { UserService } from '@onecx/angular-integration-interface'

import { MCPServerDetailsActions } from './mcpserver-details.actions'
import { MCPServerDetailsComponent } from './mcpserver-details.component'
import { MCPServerDetailsHarness } from './mcpserver-details.harness'
import { initialState } from './mcpserver-details.reducers'
import { selectMCPServerDetailsViewModel } from './mcpserver-details.selectors'
import { MCPServerDetailsViewModel } from './mcpserver-details.viewmodel'

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
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        stopImmediatePropagation: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        stopPropagation: () => {}
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
  let mcpserverDetails: MCPServerDetailsHarness
  let translateService: TranslateService

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const createBaseDetails = (): NonNullable<MCPServerDetailsViewModel['details']> => ({
    apiKey: '',
    description: '',
    name: '',
    url: ''
  })

  const baseMCPServerDetailsViewModel: MCPServerDetailsViewModel = {
    details: createBaseDetails(),
    detailsLoadingIndicator: false,
    detailsLoaded: true,
    backNavigationPossible: true,
    editMode: false,
    isSubmitting: false,
    isApiKeyHidden: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AngularAcceleratorModule,
        LetDirective,
        FormsModule,
        BrowserAnimationsModule,
        MCPServerDetailsComponent,
        ReactiveFormsModule,
        TranslateTestingModule.withTranslations({
          en: require('./src/assets/i18n/en.json'),
          de: require('./src/assets/i18n/de.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        ...providePermissionService(),
        provideHttpClient(),
        provideHttpClientTesting(),
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
  })

  beforeEach(async () => {
    const userServiceMock = TestBed.inject(UserService)
    jest.spyOn(userServiceMock, 'getPermissions').mockReturnValue(of(['MCPSERVER#BACK']))

    translateService = TestBed.inject(TranslateService)
    translateService.use('en')

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectMCPServerDetailsViewModel, baseMCPServerDetailsViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(MCPServerDetailsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    mcpserverDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, MCPServerDetailsHarness)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display correct breadcrumbs', () => {
    const breadcrumbService = component['breadcrumbService']
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    expect(breadcrumbService.setItems).toHaveBeenCalledWith([
      { titleKey: 'MCPSERVER_DETAILS.BREADCRUMB', labelKey: 'MCPSERVER_DETAILS.BREADCRUMB', routerLink: '/mcpserver' }
    ])
  })

  it('should display translated headers', async () => {
    const pageHeader = await mcpserverDetails.getHeader()
    expect(await pageHeader.getHeaderText()).toEqual('Tools (MCP) Details')
    expect(await pageHeader.getSubheaderText()).toEqual('Display Tools (MCP) details')
  })

  it('should have 2 inline actions', async () => {
    const actions = await firstValueFrom(component.headerActions$)
    const inlineActions = actions.filter((a) => a.show === 'always' && (!a.conditional || a.showCondition))

    expect(inlineActions).toHaveLength(2)

    const backAction = inlineActions.find((a) => a.labelKey === 'MCPSERVER_DETAILS.GENERAL.BACK')
    expect(backAction).toBeTruthy()

    const editAction = inlineActions.find((a) => a.icon === PrimeIcons.PENCIL)
    expect(editAction).toBeTruthy()
  })

  it('should have overflow menu button', async () => {
    const pageHeader = await mcpserverDetails.getHeader()
    const overflowAction = await pageHeader.getOverflowActionMenuButton()
    expect(overflowAction).toBeTruthy()
  })

  it('should dispatch navigateBackButtonClicked action on back button click', async () => {
    const doneFn = jest.fn()
    const actions = await firstValueFrom(component.headerActions$)
    const backAction = actions.find((a) => a.labelKey === 'MCPSERVER_DETAILS.GENERAL.BACK')

    store.scannedActions$.pipe(ofType(MCPServerDetailsActions.navigateBackButtonClicked)).subscribe(() => {
      doneFn()
    })
    backAction?.actionCallback?.()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should display item details in page header', async () => {
    const labels = [
      { label: 'HELLO_DETAILS.FORM.ID', labelPipe: TranslatePipe, value: 'test id' },
      { label: 'first', value: 'first value' },
      { label: 'second', value: 'second value' },
      { label: 'third', icon: PrimeIcons.PLUS },
      { label: 'fourth', value: 'fourth value', icon: PrimeIcons.QUESTION }
    ] as any[]
    component.headerLabels$ = of(labels)

    const emittedLabels = await firstValueFrom(component.headerLabels$)
    expect(emittedLabels).toHaveLength(5)

    const testDetailItem = emittedLabels.find((l) => l.label === 'HELLO_DETAILS.FORM.ID')
    expect(testDetailItem?.value).toEqual('test id')
    expect(testDetailItem?.icon).toBeUndefined()

    const firstDetailItem = emittedLabels.find((l) => l.label === 'first')
    expect(firstDetailItem?.value).toEqual('first value')
    expect(firstDetailItem?.icon).toBeUndefined()

    const secondDetailItem = emittedLabels.find((l) => l.label === 'second')
    expect(secondDetailItem?.value).toEqual('second value')
    expect(secondDetailItem?.icon).toBeUndefined()

    const thirdDetailItem = emittedLabels.find((l) => l.label === 'third')
    expect(thirdDetailItem?.value).toBeFalsy()
    expect(thirdDetailItem?.icon).toContain(PrimeIcons.PLUS)

    const fourthDetailItem = emittedLabels.find((l) => l.label === 'fourth')
    expect(fourthDetailItem?.value).toEqual('fourth value')
    expect(fourthDetailItem?.icon).toContain(PrimeIcons.QUESTION)
  })

  it('edit clicked should dispatch edit action', () => {
    jest.spyOn(store, 'dispatch')
    component.edit()
    expect(store.dispatch).toHaveBeenCalledWith(MCPServerDetailsActions.editButtonClicked())
  })

  it('save clicked should dispatch save action', () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectMCPServerDetailsViewModel, {
      ...baseMCPServerDetailsViewModel,
      editMode: true
    })
    store.refreshState()
    fixture.detectChanges()
    const details = baseMCPServerDetailsViewModel.details ?? createBaseDetails()
    component.save()
    expect(store.dispatch).toHaveBeenCalledWith(MCPServerDetailsActions.saveButtonClicked({ details }))
  })

  it('cancel clicked should dispatch cancel action', () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectMCPServerDetailsViewModel, {
      ...baseMCPServerDetailsViewModel,
      editMode: true
    })
    store.refreshState()
    fixture.detectChanges()
    component.cancel()
    expect(store.dispatch).toHaveBeenCalledWith(MCPServerDetailsActions.cancelButtonClicked({ dirty: false }))
  })

  it('delete clicked should dispatch delete action', async () => {
    jest.spyOn(store, 'dispatch')
    const actions = await firstValueFrom(component.headerActions$)
    const deleteAction = actions.find((a) => a.labelKey === 'MCPSERVER_DETAILS.GENERAL.DELETE')
    expect(deleteAction).toBeDefined()
    deleteAction?.actionCallback?.()
    expect(store.dispatch).toHaveBeenCalledWith(MCPServerDetailsActions.deleteButtonClicked())
  })

  it('should work with details', async () => {
    store.overrideSelector(selectMCPServerDetailsViewModel, {
      ...baseMCPServerDetailsViewModel,
      details: { id: 'my-id', name: 'my-name', apiKey: 'my-apikey' }
    })
    store.refreshState()
    fixture.detectChanges()

    const labels = await firstValueFrom(component.headerLabels$)
    const nameItem = labels.find((l) => l.label === 'MCPSERVER_DETAILS.FORM.NAME')
    expect(nameItem?.value).toEqual('my-name')
  })

  it('should render empty header details when details are missing', async () => {
    store.overrideSelector(selectMCPServerDetailsViewModel, {
      ...baseMCPServerDetailsViewModel,
      details: undefined
    } as any)
    store.refreshState()
    fixture.detectChanges()

    const labels = await firstValueFrom(component.headerLabels$)
    const nameItem = labels.find((l) => l.label === 'MCPSERVER_DETAILS.FORM.NAME')
    expect(nameItem?.value).toBeFalsy()
    expect(component.formGroup.get('name')?.value).toBeFalsy()
  })

  it('should dispatch apiKeyVisibilityToggled on toggleApiKeyVisibility', () => {
    jest.spyOn(store, 'dispatch')
    component.toggleApiKeyVisibility()
    expect(store.dispatch).toHaveBeenCalledWith(MCPServerDetailsActions.apiKeyVisibilityToggled())
  })
})
