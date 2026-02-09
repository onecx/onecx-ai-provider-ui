import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { provideMockActions } from '@ngrx/effects/testing'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'
import {
  Action,
  AlwaysGrantPermissionChecker,
  BreadcrumbService,
  HAS_PERMISSION_CHECKER,
  PortalCoreModule,
  PortalDialogService,
} from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { PrimeIcons } from 'primeng/api'
import { AutoCompleteModule } from 'primeng/autocomplete'
import { InputTextModule } from 'primeng/inputtext'
import { MultiSelectModule } from 'primeng/multiselect'
import { ReplaySubject, of } from 'rxjs'
import {
  Configuration,
  ConfigurationService,
  MCPServer,
  McpServerService,
  Provider,
  ProviderService
} from 'src/app/shared/generated'
import { ConfigurationDetailsActions } from './configuration-details.actions'
import { ConfigurationDetailsComponent } from './configuration-details.component'
import { ConfigurationDetailsEffects } from './configuration-details.effects'
import { ConfigurationDetailsHarness } from './configuration-details.harness'
import { initialState } from './configuration-details.reducers'
import { selectConfigurationDetailsViewModel } from './configuration-details.selectors'
import { ConfigurationDetailsViewModel } from './configuration-details.viewmodel'

describe('ConfigurationDetailsComponent', () => {
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
    listeners.forEach((l) =>
      l({
        data: m,
        stopImmediatePropagation: () => { },
        stopPropagation: () => { }
      })
    )
  }

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }

  afterAll(() => {
    window.addEventListener = origAddEventListener
    window.postMessage = origPostMessage
  })

  let component: ConfigurationDetailsComponent
  let fixture: ComponentFixture<ConfigurationDetailsComponent>
  let store: MockStore<Store>
  let breadcrumbService: BreadcrumbService
  let ConfigurationDetails: ConfigurationDetailsHarness
  let effects: ConfigurationDetailsEffects
  let actions$: ReplaySubject<any>
  let configurationService: jest.Mocked<ConfigurationService>
  let providerService: jest.Mocked<ProviderService>
  let mcpServerService: jest.Mocked<McpServerService>
  let portalDialogService: jest.Mocked<PortalDialogService>
  let router: jest.Mocked<Router>

  const baseConfigurationDetailsViewModel: ConfigurationDetailsViewModel = {
    details: {
      id: 'id-1',
      name: 'details name',
      description: 'details description',
      modificationCount: 1,
      modificationUser: 'user-1',
      creationUser: 'user-1',
      llmProvider: undefined,
      mcpServers: [{
        modificationCount: 1,
        id: 'id-1',
        name: 'name-1',
        description: 'description-1'
      }]
    },
    detailsLoaded: true,
    detailsLoadingIndicator: false,
    Providers: [
      {
        modificationCount: 1,
        id: 'id-1',
        name: 'Provider name',
        description: 'Provider description',
        llmUrl: 'Provider llmUrl',
        modelName: 'Provider modelName',
        apiKey: 'Provider apiKey'
      }
    ],
    ProvidersLoaded: true,
    ProvidersLoadingIndicator: false,
    MCPServers: [
      {
        modificationCount: 1,
        id: 'id-1',
        name: 'MCPServer name',
        description: 'MCPServer description'
      }
    ],
    MCPServersLoaded: true,
    MCPServersLoadingIndicator: false,
    backNavigationPossible: true,
    editMode: false,
    isSubmitting: false
  }

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)
    configurationService = {
      getConfiguration: jest.fn(),
      updateConfiguration: jest.fn(),
      deleteConfiguration: jest.fn(),
      findConfigurationBySearchCriteria: jest.fn()
    } as unknown as jest.Mocked<ConfigurationService>

    providerService = {
      findProviderBySearchCriteria: jest.fn()
    } as unknown as jest.Mocked<ProviderService>

    mcpServerService = {
      findMCPServerByCriteria: jest.fn()
    } as unknown as jest.Mocked<McpServerService>

    portalDialogService = {
      openDialog: jest.fn()
    } as unknown as jest.Mocked<PortalDialogService>

    const mockId = '123'
    router = {
      events: of(),
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
      parseUrl: jest.fn().mockImplementation((url: string) => ({
        queryParams: {},
        fragment: null,
        toString: () => url,
        url
      })),
      createUrlTree: jest.fn().mockImplementation((commands: any[]) => ({
        toString: () => commands.join('/')
      })),
      isActive: jest.fn(),
      serializeUrl: jest.fn().mockImplementation((urlTree: any) => urlTree.toString()),
      routerState: {
        root: {
          component: ConfigurationDetailsComponent,
          firstChild: {
            component: ConfigurationDetailsComponent,
            paramMap: new Map([['id', mockId]]),
            url: '',
            urlSegments: [],
            outlet: 'primary',
            params: {},
            queryParams: {},
            fragment: null,
            data: {},
            children: []
          }
        },
        snapshot: {
          url: '',
          root: {
            component: ConfigurationDetailsComponent,
            firstChild: {
              component: ConfigurationDetailsComponent,
              paramMap: new Map([['id', mockId]]),
              url: '',
              urlSegments: [],
              outlet: 'primary',
              params: {},
              queryParams: {},
              fragment: null,
              data: {},
              children: []
            }
          }
        }
      }
    } as unknown as jest.Mocked<Router>



    await TestBed.configureTestingModule({
      declarations: [ConfigurationDetailsComponent],
      imports: [
        PortalCoreModule,
        LetDirective,
        FormsModule,
        ReactiveFormsModule,
        AutoCompleteModule,
        MultiSelectModule,
        InputTextModule,
        TranslateTestingModule.withTranslations('en', require('./../../../../assets/i18n/en.json')).withTranslations(
          'de',
          require('./../../../../assets/i18n/de.json')
        )
      ],
      providers: [
        ConfigurationDetailsEffects,
        provideMockStore({
          initialState: { Configuration: { details: initialState, backNavigationPossible: true } }
        }),
        provideMockActions(() => actions$),
        provideUserServiceMock(),
        {
          provide: HAS_PERMISSION_CHECKER,
          useClass: AlwaysGrantPermissionChecker
        },
        BreadcrumbService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ConfigurationService, useValue: configurationService },
        { provide: ProviderService, useValue: providerService },
        { provide: McpServerService, useValue: mcpServerService },
        { provide: Router, useValue: router },
        { provide: PortalDialogService, useValue: portalDialogService },
      ]
    }).compileComponents()

    effects = TestBed.inject(ConfigurationDetailsEffects)
    effects.displayError$.subscribe()

    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectConfigurationDetailsViewModel, baseConfigurationDetailsViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(ConfigurationDetailsComponent)
    component = fixture.componentInstance
    breadcrumbService = TestBed.inject(BreadcrumbService)
    fixture.detectChanges()
    ConfigurationDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, ConfigurationDetailsHarness)
  })

  describe('ConfigurationDetailsComponent', () => {

    it('should create', () => {
      expect(component).toBeTruthy()
    })

    it('should display correct breadcrumbs', async () => {
      jest.spyOn(breadcrumbService, 'setItems')

      component.ngOnInit()
      fixture.detectChanges()

      expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
      const pageHeader = await ConfigurationDetails.getHeader()
      const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Details')
      expect(await searchBreadcrumbItem!.getText()).toEqual('Details')
    })

    it('should display translated headers', async () => {
      const pageHeader = await ConfigurationDetails.getHeader()
      expect(await pageHeader.getHeaderText()).toEqual('Configuration Details')
      expect(await pageHeader.getSubheaderText()).toEqual('Display of Configuration Details')
    })

    it('should have 2 inline actions', async () => {
      const pageHeader = await ConfigurationDetails.getHeader()
      const inlineActions = await pageHeader.getInlineActionButtons()
      expect(inlineActions.length).toBe(2)

      const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
      expect(backAction).toBeTruthy()

      const editAction = await pageHeader.getInlineActionButtonByLabel('Edit')
      expect(editAction).toBeTruthy()
    })

    it('should navigate back on back button click', async () => {
      jest.spyOn(window.history, 'back')
      const doneFn = jest.fn()

      const pageHeader = await ConfigurationDetails.getHeader()
      const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
      store.scannedActions$.pipe(ofType(ConfigurationDetailsActions.navigateBackButtonClicked)).subscribe(() => {
        doneFn()
      })
      await backAction?.click()
      expect(doneFn).toHaveBeenCalledTimes(1)
    })

    it('should display item details in form fields', async () => {
      store.overrideSelector(selectConfigurationDetailsViewModel, baseConfigurationDetailsViewModel)
      store.refreshState()

      fixture.detectChanges()
      await fixture.whenStable()

      if (!component.formGroup) {
        component.ngOnInit()
        fixture.detectChanges()
        await fixture.whenStable()
      }

      const pageDetails = component.formGroup.value
      delete baseConfigurationDetailsViewModel.details?.creationUser
      delete baseConfigurationDetailsViewModel.details?.modificationCount
      delete baseConfigurationDetailsViewModel.details?.modificationUser
      expect(pageDetails).toEqual({
        ...baseConfigurationDetailsViewModel.details
      })
    })

    it('should display item details in page header', async () => {
      component.headerLabels$ = of([
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

      const pageHeader = await ConfigurationDetails.getHeader()
      const objectDetails = await pageHeader.getObjectInfos()
      expect(objectDetails.length).toBe(4)

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
      expect(await thirdDetailItem?.getIcon()).toEqual(PrimeIcons.PLUS)

      const fourthDetailItem = await pageHeader.getObjectInfoByLabel('fourth')
      expect(await fourthDetailItem?.getLabel()).toEqual('fourth')
      expect(await fourthDetailItem?.getValue()).toEqual('fourth value')
      expect(await fourthDetailItem?.getIcon()).toEqual(PrimeIcons.QUESTION)
    })

    it('should enable or disable the form based on editMode', async () => {
      const viewModelView = {
        ...baseConfigurationDetailsViewModel,
        editMode: false
      }
      store.overrideSelector(selectConfigurationDetailsViewModel, viewModelView)
      store.refreshState()

      fixture.detectChanges()
      await fixture.whenStable()

      expect(component.formGroup.disabled).toBeTruthy()

      const viewModelEdit = {
        ...baseConfigurationDetailsViewModel,
        editMode: true
      }
      store.overrideSelector(selectConfigurationDetailsViewModel, viewModelEdit)
      store.refreshState()

      fixture.detectChanges()
      await fixture.whenStable()

      expect(component.formGroup.enabled).toBeTruthy()
    })

    it('should show the correct actions for edit and view modes', async () => {
      const viewModelView = {
        ...baseConfigurationDetailsViewModel,
        editMode: false
      }
      store.overrideSelector(selectConfigurationDetailsViewModel, viewModelView)
      store.refreshState()

      fixture.detectChanges()
      await fixture.whenStable()

      let actions: Action[] = []
      component.headerActions$.subscribe((a) => (actions = a))
      const visibleActionsView = actions.filter((a) => a.showCondition)
      const actionLabelsView = visibleActionsView.map((a) => a.labelKey)
      expect(actionLabelsView).toContain('CONFIGURATION_DETAILS.GENERAL.BACK')
      expect(actionLabelsView).toContain('CONFIGURATION_DETAILS.GENERAL.EDIT')
      expect(actionLabelsView).not.toContain('CONFIGURATION_DETAILS.GENERAL.SAVE')
      expect(actionLabelsView).not.toContain('CONFIGURATION_DETAILS.GENERAL.CANCEL')

      const viewModelEdit = {
        ...baseConfigurationDetailsViewModel,
        editMode: true
      }
      store.overrideSelector(selectConfigurationDetailsViewModel, viewModelEdit)

      store.refreshState()
      fixture.detectChanges()
      await fixture.whenStable()

      actions = []
      component.headerActions$.subscribe((a) => (actions = a))
      const visibleActionsEdit = actions.filter((a) => a.showCondition)
      const actionLabelsEdit = visibleActionsEdit.map((a) => a.labelKey)
      expect(actionLabelsEdit).toContain('CONFIGURATION_DETAILS.GENERAL.SAVE')
      expect(actionLabelsEdit).toContain('CONFIGURATION_DETAILS.GENERAL.CANCEL')
      expect(actionLabelsEdit).not.toContain('CONFIGURATION_DETAILS.GENERAL.BACK')
      expect(actionLabelsEdit).not.toContain('CONFIGURATION_DETAILS.GENERAL.EDIT')
    })

    it('should dispatch edit action when edit() is called', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')

      component.edit()

      expect(dispatchSpy).toHaveBeenCalledWith(ConfigurationDetailsActions.editButtonClicked())
    })

    it('should dispatch navigate back action when goBack() is called', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')

      component.goBack()

      expect(dispatchSpy).toHaveBeenCalledWith(ConfigurationDetailsActions.navigateBackButtonClicked())
    })

    it('should dispatch cancel action with dirty state when cancel() is called', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')

      component.formGroup.markAsDirty()
      component.cancel()

      expect(dispatchSpy).toHaveBeenCalledWith(ConfigurationDetailsActions.cancelButtonClicked({ dirty: true }))
    })

    it('should dispatch save action with form values when save() is called', () => {
      const mockValue = {
        id: 'id',
        name: 'name',
        description: 'desc',
        mcpServers: [{ id: '', name: '' }],
        llmProvider: { id: 'id-1', name: 'provider', modelName: 'model' },
      }
      const dispatchSpy = jest.spyOn(store, 'dispatch')

      component.formGroup.setValue(mockValue)
      component.save()

      expect(dispatchSpy).toHaveBeenCalledWith(
        ConfigurationDetailsActions.saveButtonClicked({
          details: {
            ...mockValue
          }
        })
      )
    })

    it('should dispatch delete action when delete() is called', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.delete()
      expect(dispatchSpy).toHaveBeenCalledWith(ConfigurationDetailsActions.deleteButtonClicked())
    })

    it('should call breadcrumbService.setItems on ngOnInit', () => {
      const breadcrumbSpy = jest.spyOn(breadcrumbService, 'setItems')
      component.ngOnInit()
      expect(breadcrumbSpy).toHaveBeenCalledWith([
        {
          titleKey: 'CONFIGURATION_DETAILS.BREADCRUMB',
          labelKey: 'CONFIGURATION_DETAILS.BREADCRUMB',
          routerLink: '/configuration'
        }
      ])
    })

    it('should execute actionCallback for each header action', () => {
      const editSpy = jest.spyOn(component, 'edit')
      const goBackSpy = jest.spyOn(component, 'goBack')
      const cancelSpy = jest.spyOn(component, 'cancel')
      const saveSpy = jest.spyOn(component, 'save')
      const deleteSpy = jest.spyOn(component, 'delete')

      const viewModelView = {
        ...baseConfigurationDetailsViewModel,
        editMode: false
      }
      store.overrideSelector(selectConfigurationDetailsViewModel, viewModelView)
      store.refreshState()
      fixture.detectChanges()
      let actions: any[] = []
      component.headerActions$.subscribe((a) => (actions = a))
      actions.forEach((action) => {
        if (typeof action.actionCallback === 'function') {
          action.actionCallback()
        }
      })
      expect(editSpy).toHaveBeenCalled()
      expect(goBackSpy).toHaveBeenCalled()
      expect(cancelSpy).toHaveBeenCalled()
      expect(saveSpy).toHaveBeenCalled()
      expect(deleteSpy).toHaveBeenCalled()

      const viewModelEdit = {
        ...baseConfigurationDetailsViewModel,
        editMode: true
      }
      store.overrideSelector(selectConfigurationDetailsViewModel, viewModelEdit)
      store.refreshState()
      fixture.detectChanges()
      actions = []
      component.headerActions$.subscribe((a) => (actions = a))
      actions.forEach((action) => {
        if (typeof action.actionCallback === 'function') {
          action.actionCallback()
        }
      })
      expect(cancelSpy).toHaveBeenCalled()
      expect(saveSpy).toHaveBeenCalled()
    })

    it('should dispatch cancel action with pristine state when cancel() is called', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.formGroup.markAsPristine()
      component.cancel()
      expect(dispatchSpy).toHaveBeenCalledWith(ConfigurationDetailsActions.cancelButtonClicked({ dirty: false }))
    })

    it('should patch the form with details and matched provider', () => {
      const provider = { id: 'id-1', name: 'provider', modelName: 'model' } as Provider
      const details = { ...baseConfigurationDetailsViewModel.details, llmProvider: provider } as any
      const viewModel = {
        ...baseConfigurationDetailsViewModel,
        details,
        editMode: false,
        llmProvider: [provider]
      } as any
      store.overrideSelector(selectConfigurationDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()
      expect(component.formGroup.value.id).toBe(details.id)
      expect(component.formGroup.value.llmProvider).toEqual(provider)
    })

    it('should patch the form with details and matched MCP Server', () => {
      const mcpServer = { id: 'kb1', name: 'MCP Server 1' } as MCPServer
      const details = { ...baseConfigurationDetailsViewModel.details, mcpServers: [mcpServer] } as Configuration
      const viewModel = {
        ...baseConfigurationDetailsViewModel,
        details,
        editMode: false,
        MCPServers: [mcpServer]
      } as ConfigurationDetailsViewModel
      store.overrideSelector(selectConfigurationDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()
      expect(component.formGroup.value.id).toBe(details.id)
      expect(component.formGroup.value.mcpServers).toEqual([mcpServer])
    })

    it('should handle missing details gracefully', () => {
      const viewModel = { ...baseConfigurationDetailsViewModel, details: undefined } as any
      store.overrideSelector(selectConfigurationDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()
      expect(component.formGroup.value.id).toBe('')
    })

  })
})
