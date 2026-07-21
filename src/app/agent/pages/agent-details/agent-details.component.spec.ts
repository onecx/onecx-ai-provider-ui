import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormGroup, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { of } from 'rxjs'

import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { PrimeIcons } from 'primeng/api'
import { AutoCompleteModule } from 'primeng/autocomplete'
import { ButtonModule } from 'primeng/button'
import { MultiSelectModule } from 'primeng/multiselect'
import { SelectModule } from 'primeng/select'
import { TabViewModule } from 'primeng/tabview'
import { AgentFilterKeyEnum, AgentGroupService } from 'src/app/shared/generated'

import { AngularAcceleratorModule, BreadcrumbService } from '@onecx/angular-accelerator'
import { UserService } from '@onecx/angular-integration-interface'
import { provideUserServiceMock, UserServiceMock } from '@onecx/angular-integration-interface/mocks'
import {
  HAS_PERMISSION_CHECKER,
  PermissionService,
  PortalPageComponent,
  TranslationConnectionService
} from '@onecx/angular-utils'

import { agentDetailsActions } from './agent-details.actions'
import { AgentDetailsComponent } from './agent-details.component'
import { AgentDetailsHarness } from './agent-details.harness'
import { initialState } from './agent-details.reducers'
import { selectAgentDetailsViewModel } from './agent-details.selectors'
import { AgentDetailsViewModel } from './agent-details.viewmodel'

describe('AgentDetailsComponent', () => {
  beforeAll(() => {
    ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {
        // no-op for jsdom
      }
      unobserve() {
        // no-op for jsdom
      }
      disconnect() {
        // no-op for jsdom
      }
    }
  })

  const origAddEventListener = window.addEventListener
  const origPostMessage = window.postMessage

  let listeners: unknown[] = []
  window.addEventListener = (_type: unknown, listener: unknown) => {
    listeners.push(listener)
  }

  window.removeEventListener = (_type: unknown, listener: unknown) => {
    listeners = listeners.filter((l) => l !== listener)
  }

  window.postMessage = (m: unknown) => {
    listeners.forEach((l) =>
      (l as (event: { data: unknown; stopImmediatePropagation: () => void; stopPropagation: () => void }) => void)({
        data: m,
        stopImmediatePropagation: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
        stopPropagation: () => {} // eslint-disable-line @typescript-eslint/no-empty-function
      })
    )
  }

  afterAll(() => {
    window.addEventListener = origAddEventListener
    window.postMessage = origPostMessage
  })

  let component: AgentDetailsComponent
  let fixture: ComponentFixture<AgentDetailsComponent>
  let store: MockStore<Store>
  let breadcrumbService: BreadcrumbService
  let agentDetails: AgentDetailsHarness
  const agentGroupService = {
    findAgentGroupByCriteria: jest.fn(),
    createAgentGroup: jest.fn()
  }

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseAgentDetailsViewModel: AgentDetailsViewModel = {
    details: undefined,
    detailsLoadingIndicator: false,
    providers: [],
    providersLoadingIndicator: false,
    providersLoaded: true,
    models: [],
    modelsLoadingIndicator: false,
    modelsLoaded: true,
    scaffolds: [],
    scaffoldsLoadingIndicator: false,
    scaffoldsLoaded: true,
    tools: [],
    toolsLoadingIndicator: false,
    toolsLoaded: true,
    groups: [],
    groupsLoadingIndicator: false,
    groupsLoaded: true,
    detailsLoaded: true,
    backNavigationPossible: true,
    editMode: true,
    isSubmitting: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgentDetailsComponent],
      imports: [
        AngularAcceleratorModule,
        PortalPageComponent,
        LetDirective,
        TabViewModule,
        SelectModule,
        MultiSelectModule,
        AutoCompleteModule,
        ButtonModule,
        ReactiveFormsModule,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PermissionService,
        provideMockStore({
          initialState: { agent: { details: initialState } }
        }),
        BreadcrumbService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideUserServiceMock(),
        {
          provide: HAS_PERMISSION_CHECKER,
          useExisting: UserService
        },
        {
          provide: TranslationConnectionService,
          useValue: { init: jest.fn(), destroy: jest.fn() }
        },
        { provide: AgentGroupService, useValue: agentGroupService }
      ]
    }).compileComponents()

    const userServiceMock = TestBed.inject(UserServiceMock)
    userServiceMock.permissionsTopic$.publish([
      'AGENT#CREATE',
      'AGENT#EDIT',
      'AGENT#DELETE',
      'AGENT#IMPORT',
      'AGENT#EXPORT',
      'AGENT#VIEW',
      'AGENT#SEARCH'
    ])

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectAgentDetailsViewModel, baseAgentDetailsViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(AgentDetailsComponent)
    component = fixture.componentInstance
    breadcrumbService = TestBed.inject(BreadcrumbService)
    fixture.detectChanges()
    agentDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, AgentDetailsHarness)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display correct breadcrumbs', async () => {
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const pageHeader = await agentDetails.getHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Details')
    expect(await searchBreadcrumbItem?.getText()).toEqual('Details')
  })

  it('should display translated headers', async () => {
    const pageHeader = await agentDetails.getHeader()
    expect(await pageHeader.getHeaderText()).toEqual('Agent Details')
    expect(await pageHeader.getSubheaderText()).toEqual('Display and edit Agent details')
  })

  it('should have 4 inline actions', async () => {
    const pageHeader = await agentDetails.getHeader()
    const inlineActions = await pageHeader.getInlineActionButtons()
    expect(inlineActions).toHaveLength(3)

    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    expect(backAction).toBeTruthy()
  })

  it('should dispatch navigateBackButtonClicked action on back button click', async () => {
    jest.spyOn(window.history, 'back')
    const doneFn = jest.fn()

    const pageHeader = await agentDetails.getHeader()
    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    store.scannedActions$.pipe(ofType(agentDetailsActions.navigateBackButtonClicked)).subscribe(() => {
      doneFn()
    })
    await backAction?.click()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should dispatch editButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectAgentDetailsViewModel, {
      ...baseAgentDetailsViewModel,
      editMode: false
    })
    store.refreshState()
    const pageHeader = await agentDetails.getHeader()
    const editAction = await pageHeader.getInlineActionButtonByLabel('Edit')
    await editAction?.click()

    expect(editAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(agentDetailsActions.editButtonClicked())
  })

  it('should dispatch cancelButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    const pageHeader = await agentDetails.getHeader()
    const cancelAction = await pageHeader.getInlineActionButtonByLabel('Cancel')
    await cancelAction?.click()

    expect(cancelAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(
      agentDetailsActions.cancelButtonClicked({
        dirty: false
      })
    )
  })

  it('should dispatch saveButtonClicked action on edit button click', async () => {
    jest.spyOn(store, 'dispatch')
    const agent = { id: '123' }
    const agentForm = {
      name: 'title',
      description: 'description',
      additionalPrompt: 'prompt',
      provider: null,
      model: null,
      scaffold: null,
      tools: [],
      groups: [],
      newGroupName: null,
      filters: []
    }

    store.overrideSelector(selectAgentDetailsViewModel, {
      ...baseAgentDetailsViewModel,
      editMode: true,
      details: agent
    })
    store.refreshState()

    component.formGroup.setValue(agentForm)

    const pageHeader = await agentDetails.getHeader()
    const saveAction = await pageHeader.getInlineActionButtonByLabel('Save')
    await saveAction?.click()

    expect(saveAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(
      agentDetailsActions.saveButtonClicked({
        details: {
          id: '123',
          name: 'title',
          description: 'description',
          additionalPrompt: 'prompt',
          model: undefined,
          scaffold: undefined,
          tools: [],
          groups: [],
          filter: undefined
        }
      })
    )
  })

  it('should dispatch deleteButtonClicked action on delete button click', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectAgentDetailsViewModel, {
      ...baseAgentDetailsViewModel,
      editMode: false
    })
    store.refreshState()

    const pageHeader = await agentDetails.getHeader()
    const deleteAction = await pageHeader.getInlineActionButtonByLabel('Delete')
    await deleteAction?.click()

    expect(deleteAction).toBeTruthy()
    expect(store.dispatch).toHaveBeenCalledTimes(1)
    expect(store.dispatch).toHaveBeenCalledWith(agentDetailsActions.deleteButtonClicked())
  })

  it('should not render more action button', async () => {
    const pageHeader = await agentDetails.getHeader()
    const moreAction = await pageHeader.getInlineActionButtonByIcon(PrimeIcons.ELLIPSIS_V)
    expect(moreAction).toBeNull()
  })

  it('should display item details in page header', async () => {
    component.objectDetails$ = of([
      {
        label: 'AGENT_DETAILS.FORM.CHANGE_ME',
        labelPipe: TranslatePipe,
        value: 'test'
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

    const pageHeader = await agentDetails.getHeader()
    const objectDetails = await pageHeader.getObjectInfos()
    expect(objectDetails).toHaveLength(5)

    const label = TestBed.inject(TranslateService).instant('AGENT_DETAILS.FORM.CHANGE_ME')
    const testDetailItem = await pageHeader.getObjectInfoByLabel(label)
    expect(await testDetailItem?.getLabel()).toEqual(label)
    expect(await testDetailItem?.getValue()).toEqual('test')
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
    expect(await thirdDetailItem?.getIcon()).toEqual(PrimeIcons.PLUS)

    const fourthDetailItem = await pageHeader.getObjectInfoByLabel('fourth')
    expect(await fourthDetailItem?.getLabel()).toEqual('fourth')
    expect(await fourthDetailItem?.getValue()).toEqual('fourth value')
    expect(await fourthDetailItem?.getIcon()).toEqual(PrimeIcons.QUESTION)
  })

  it('should work with details', async () => {
    store.overrideSelector(selectAgentDetailsViewModel, {
      ...baseAgentDetailsViewModel,
      details: {
        id: 'my-id',
        name: 'my-agent',
        status: 'LIVE' as any,
        modificationCount: 3
      }
    })
    store.refreshState()
    fixture.detectChanges()

    const pageHeader = await agentDetails.getHeader()
    const translatedNameLabel = TestBed.inject(TranslateService).instant('AGENT_DETAILS.FORM.NAME')
    const nameDetailItem = await pageHeader.getObjectInfoByLabel(translatedNameLabel)
    expect(await nameDetailItem?.getValue()).toEqual('my-agent')

    const translatedStatusLabel = TestBed.inject(TranslateService).instant('AGENT_DETAILS.FORM.STATUS')
    const statusDetailItem = await pageHeader.getObjectInfoByLabel(translatedStatusLabel)
    expect(await statusDetailItem?.getValue()).toEqual('LIVE')
  })

  it('should render empty header details when details are missing', async () => {
    store.overrideSelector(selectAgentDetailsViewModel, {
      ...baseAgentDetailsViewModel,
      details: undefined
    })
    store.refreshState()
    fixture.detectChanges()

    const pageHeader = await agentDetails.getHeader()
    const translatedNameLabel = TestBed.inject(TranslateService).instant('AGENT_DETAILS.FORM.NAME')
    const nameDetailItem = await pageHeader.getObjectInfoByLabel(translatedNameLabel)
    expect(await nameDetailItem?.getValue()).toBeFalsy()

    const translatedVersionLabel = TestBed.inject(TranslateService).instant('AGENT_DETAILS.FORM.VERSION')
    const versionDetailItem = await pageHeader.getObjectInfoByLabel(translatedVersionLabel)
    expect(await versionDetailItem?.getValue()).toBeFalsy()
  })

  it('should mark as pristine and disable form when editMode is false', async () => {
    const markAsPristineSpy = jest.spyOn(component.formGroup, 'markAsPristine')
    const disableSpy = jest.spyOn(component.formGroup, 'disable')

    const agent = {
      id: '123',
      name: 'title',
      description: 'description',
      model: { id: 'model-1' },
      scaffold: { id: 'scaffold-1' },
      filter: { key: AgentFilterKeyEnum.AppId, value: 'my-app' },
      modificationCount: 7,
      additionalPrompt: 'prompt',
      status: 'LIVE' as any
    }

    store.overrideSelector(selectAgentDetailsViewModel, {
      ...baseAgentDetailsViewModel,
      editMode: false,
      details: agent
    })
    store.refreshState()

    expect(markAsPristineSpy).toHaveBeenCalledTimes(1)
    expect(disableSpy).toHaveBeenCalledTimes(1)
    expect(component.formGroup.pristine).toBe(true)
    expect(component.formGroup.disabled).toBe(true)
    expect(component.formGroup.getRawValue()).toEqual(
      expect.objectContaining({
        name: 'title',
        description: 'description',
        additionalPrompt: 'prompt',
        provider: null,
        model: { id: 'model-1' },
        scaffold: { id: 'scaffold-1' },
        tools: [],
        groups: [],
        newGroupName: null
      })
    )

    const translatedVersionLabel = TestBed.inject(TranslateService).instant('AGENT_DETAILS.FORM.VERSION')
    const pageHeader = await agentDetails.getHeader()
    const versionDetailItem = await pageHeader.getObjectInfoByLabel(translatedVersionLabel)
    expect(await versionDetailItem?.getValue()).toEqual('7')
  })

  it('should map model provider, tools and groups when they are present on the view model', () => {
    const agent = {
      id: '123',
      name: 'title',
      model: { id: 'model-1', provider: { id: 'provider-1', name: 'Provider 1' } },
      tools: [{ id: 'tool-1', name: 'Tool 1' }],
      groups: [{ id: 'group-1', name: 'Group 1' }]
    }

    store.overrideSelector(selectAgentDetailsViewModel, {
      ...baseAgentDetailsViewModel,
      editMode: false,
      details: agent
    })
    store.refreshState()

    expect(component.formGroup.getRawValue()).toEqual(
      expect.objectContaining({
        provider: { id: 'provider-1', name: 'Provider 1' },
        model: { id: 'model-1', provider: { id: 'provider-1', name: 'Provider 1' } },
        tools: [{ id: 'tool-1', name: 'Tool 1' }],
        groups: [{ id: 'group-1', name: 'Group 1' }]
      })
    )
  })

  describe('save', () => {
    it('should attach the explicitly selected provider to the saved model', () => {
      jest.spyOn(store, 'dispatch')
      component.formGroup.patchValue({
        provider: { id: 'provider-1', name: 'Provider 1' },
        model: { id: 'model-1', provider: { id: 'provider-old', name: 'Provider Old' } },
        scaffold: { id: 'scaffold-1', name: 'Scaffold 1' }
      })

      component.save()

      expect(store.dispatch).toHaveBeenCalledWith(
        agentDetailsActions.saveButtonClicked({
          details: expect.objectContaining({
            model: { id: 'model-1', provider: { id: 'provider-1', name: 'Provider 1' } },
            scaffold: { id: 'scaffold-1', name: 'Scaffold 1' }
          })
        })
      )
    })

    it('should fall back to the model provider when no provider is explicitly selected', () => {
      jest.spyOn(store, 'dispatch')
      component.formGroup.patchValue({
        provider: null,
        model: { id: 'model-1', provider: { id: 'provider-1', name: 'Provider 1' } }
      })

      component.save()

      expect(store.dispatch).toHaveBeenCalledWith(
        agentDetailsActions.saveButtonClicked({
          details: expect.objectContaining({
            model: { id: 'model-1', provider: { id: 'provider-1', name: 'Provider 1' } }
          })
        })
      )
    })

    it('should default tools and groups to an empty array when their control value is null', () => {
      jest.spyOn(store, 'dispatch')
      component.formGroup.get('tools')?.setValue(null)
      component.formGroup.get('groups')?.setValue(null)

      component.save()

      expect(store.dispatch).toHaveBeenCalledWith(
        agentDetailsActions.saveButtonClicked({
          details: expect.objectContaining({
            tools: [],
            groups: []
          })
        })
      )
    })
  })

  describe('filters', () => {
    it('should add and remove filter form groups', () => {
      expect(component.filtersFormArray).toHaveLength(0)

      component.addFilter()
      component.addFilter()
      expect(component.filtersFormArray).toHaveLength(2)

      component.removeFilter(0)
      expect(component.filtersFormArray).toHaveLength(1)
    })

    it('should pick the first fully filled filter row when saving', () => {
      jest.spyOn(store, 'dispatch')
      component.addFilter()
      component.addFilter()
      component.filtersFormArray.at(0).patchValue({ key: null, value: 'ignored' })
      component.filtersFormArray.at(1).patchValue({ key: AgentFilterKeyEnum.AppId, value: 'my-app' })

      component.save()

      expect(store.dispatch).toHaveBeenCalledWith(
        agentDetailsActions.saveButtonClicked({
          details: expect.objectContaining({
            filter: { key: AgentFilterKeyEnum.AppId, value: 'my-app' }
          })
        })
      )
    })

    it('should filter key suggestions based on the typed query', () => {
      component.searchFilterKeys({ query: 'app' })
      expect(component.filterKeySuggestions).toEqual([AgentFilterKeyEnum.AppId])

      component.searchFilterKeys({ query: 'no-match' })
      expect(component.filterKeySuggestions).toEqual([])

      component.searchFilterKeys({ query: '' })
      expect(component.filterKeySuggestions).toEqual(component.filterKeys)
    })
  })

  describe('onProviderChanged', () => {
    it('should enable the model control when a provider is selected', () => {
      component.formGroup.patchValue({ provider: { id: 'p1', name: 'Provider 1' }, model: null })
      component.onProviderChanged()
      expect(component.formGroup.get('model')?.disabled).toBe(false)
    })

    it('should reset the model when it belongs to a different provider', () => {
      component.formGroup.patchValue({
        provider: { id: 'p1', name: 'Provider 1' },
        model: { id: 'm1', provider: { id: 'p2', name: 'Provider 2' } }
      })
      component.onProviderChanged()
      expect(component.formGroup.get('model')?.value).toBeNull()
    })

    it('should keep the model when it already belongs to the selected provider', () => {
      const model = { id: 'm1', provider: { id: 'p1', name: 'Provider 1' } }
      component.formGroup.patchValue({ provider: { id: 'p1', name: 'Provider 1' }, model })
      component.onProviderChanged()
      expect(component.formGroup.get('model')?.value).toEqual(model)
    })

    it('should reset and disable the model control when the provider is cleared', () => {
      component.formGroup.patchValue({ provider: null, model: { id: 'm1' } })
      component.onProviderChanged()
      expect(component.formGroup.get('model')?.value).toBeNull()
      expect(component.formGroup.get('model')?.disabled).toBe(true)
    })

    it('should reset the model when it has no provider of its own', () => {
      component.formGroup.patchValue({ provider: { id: 'p1', name: 'Provider 1' }, model: { id: 'm1' } })
      component.onProviderChanged()
      expect(component.formGroup.get('model')?.value).toBeNull()
    })

    it('should not throw when the provider and model controls are missing', () => {
      component.formGroup.removeControl('provider')
      component.formGroup.removeControl('model')
      expect(() => component.onProviderChanged()).not.toThrow()
    })

    it('should not throw when a provider is selected but the model control is missing', () => {
      component.formGroup.get('provider')?.setValue({ id: 'p1', name: 'Provider 1' })
      component.formGroup.removeControl('model')
      expect(() => component.onProviderChanged()).not.toThrow()
    })
  })

  describe('createGroupInPlace', () => {
    it('should not dispatch createGroupInPlaceClicked when the group name is not set', () => {
      jest.spyOn(store, 'dispatch')

      component.createGroupInPlace()

      expect(store.dispatch).not.toHaveBeenCalled()
    })

    it('should not dispatch createGroupInPlaceClicked when the group name is blank', () => {
      jest.spyOn(store, 'dispatch')
      component.formGroup.get('newGroupName')?.setValue('   ')

      component.createGroupInPlace()

      expect(store.dispatch).not.toHaveBeenCalled()
    })

    it('should dispatch createGroupInPlaceClicked with the trimmed name and reset the input', () => {
      jest.spyOn(store, 'dispatch')
      component.formGroup.get('newGroupName')?.setValue('  New Group  ')

      component.createGroupInPlace()

      expect(store.dispatch).toHaveBeenCalledWith(agentDetailsActions.createGroupInPlaceClicked({ name: 'New Group' }))
      expect(component.formGroup.get('newGroupName')?.value).toBeNull()
    })

    it('should not dispatch or throw when the newGroupName control is missing', () => {
      jest.spyOn(store, 'dispatch')
      component.formGroup.removeControl('newGroupName')

      expect(() => component.createGroupInPlace()).not.toThrow()
      expect(store.dispatch).not.toHaveBeenCalled()
    })
  })

  describe('getFilteredModels', () => {
    it('should return no models when no provider is selected', () => {
      component.formGroup.get('provider')?.setValue(null)
      expect(component.getFilteredModels([{ id: 'm1', provider: { id: 'p1', name: 'Provider 1' } }])).toEqual([])
    })

    it('should return only models belonging to the selected provider', () => {
      component.formGroup.get('provider')?.setValue({ id: 'p1', name: 'Provider 1' })
      const models = [
        { id: 'm1', provider: { id: 'p1', name: 'Provider 1' } },
        { id: 'm2', provider: { id: 'p2', name: 'Provider 2' } }
      ]

      expect(component.getFilteredModels(models)).toEqual([models[0]])
    })

    it('should exclude models without a provider from the filtered result', () => {
      component.formGroup.get('provider')?.setValue({ id: 'p1', name: 'Provider 1' })
      const models = [{ id: 'm1', provider: { id: 'p1', name: 'Provider 1' } }, { id: 'm2' }]

      expect(component.getFilteredModels(models)).toEqual([models[0]])
    })

    it('should return no models when the provider control is missing', () => {
      component.formGroup.removeControl('provider')
      expect(component.getFilteredModels([{ id: 'm1', provider: { id: 'p1', name: 'Provider 1' } }])).toEqual([])
    })
  })

  describe('missing form controls', () => {
    it('should not throw in the edit-mode subscription when provider and model controls are missing', () => {
      component.formGroup.removeControl('provider')
      component.formGroup.removeControl('model')

      store.overrideSelector(selectAgentDetailsViewModel, {
        ...baseAgentDetailsViewModel,
        editMode: true
      })

      expect(() => store.refreshState()).not.toThrow()
    })

    it('should still dispatch saveButtonClicked when form and filter controls are missing', () => {
      jest.spyOn(store, 'dispatch')

      component.addFilter()
      const filterEntry = component.filtersFormArray.at(0) as FormGroup
      filterEntry.removeControl('key')
      filterEntry.removeControl('value')
      ;['provider', 'model', 'name', 'description', 'additionalPrompt', 'scaffold', 'tools', 'groups'].forEach(
        (control) => component.formGroup.removeControl(control)
      )

      component.save()

      expect(store.dispatch).toHaveBeenCalledWith(
        agentDetailsActions.saveButtonClicked({
          details: expect.objectContaining({
            name: undefined,
            description: undefined,
            additionalPrompt: undefined,
            model: undefined,
            scaffold: undefined,
            tools: [],
            groups: [],
            filter: undefined
          })
        })
      )
    })
  })
})
