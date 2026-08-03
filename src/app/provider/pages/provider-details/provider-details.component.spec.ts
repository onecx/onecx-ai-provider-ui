import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { ReactiveFormsModule } from '@angular/forms'
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { firstValueFrom } from 'rxjs'

import { AlwaysGrantPermissionChecker, HAS_PERMISSION_CHECKER, providePermissionService } from '@onecx/angular-utils'
import { AngularAcceleratorModule, BreadcrumbService } from '@onecx/angular-accelerator'
import { UserService } from '@onecx/angular-integration-interface'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'

import { ProviderDetailsComponent } from './provider-details.component'
import { ProviderDetailsHarness } from './provider-details.harness'
import { initialState } from './provider-details.reducers'
import { selectProviderDetailsViewModel } from './provider-details.selectors'
import { ProviderDetailsViewModel } from './provider-details.viewmodel'
import { ProviderSearchActions } from '../provider-search/provider-search.actions'
import { ProviderDetailsActions } from './provider-details.actions'

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
    for (const listener of listeners) {
      listener({
        data: m,
        stopImmediatePropagation: () => {},
        stopPropagation: () => {}
      })
    }
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
      type: 'OPENAI',
      authMode: 'API_KEY',
      apiKey: 'TestAPIKey'
    } as any,
    models: [],
    modelsLoadingIndicator: false,
    modelMutationInProgress: false,
    isSubmitting: false,
    editMode: false,
    isApiKeyHidden: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AngularAcceleratorModule,
        LetDirective,
        ProviderDetailsComponent,
        ReactiveFormsModule,
        TranslateTestingModule.withTranslations({
          en: require('./src/assets/i18n/en.json'),
          de: require('./src/assets/i18n/de.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        ...providePermissionService(),
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

    const userService = TestBed.inject(UserService)
    userService.hasPermission = async () => true
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
      const breadcrumbService = component['breadcrumbService']
      jest.spyOn(breadcrumbService, 'setItems')

      component.ngOnInit()
      fixture.detectChanges()

      expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
      const pageHeader = await ProviderDetails.getHeader()
      const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Details')

      const searchBreadcrumbItemText = searchBreadcrumbItem ? await searchBreadcrumbItem.getText() : ''
      expect(searchBreadcrumbItemText).toEqual('Details')
    })

    it('should display translated headers', async () => {
      const pageHeader = await ProviderDetails.getHeader()
      expect(await pageHeader.getHeaderText()).toEqual('Provider Details')
      expect(await pageHeader.getSubheaderText()).toEqual('Display of Provider Details')
    })

    it('should have 2 inline actions', async () => {
      const pageHeader = await ProviderDetails.getHeader()
      const inlineActions = await pageHeader.getInlineActionButtons()
      expect(inlineActions).toHaveLength(2)

      const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
      expect(backAction).toBeTruthy()

      const editAction = await pageHeader.getInlineActionButtonByLabel('Edit')
      expect(editAction).toBeTruthy()
    })

    it('should navigate back on back button click', async () => {
      jest.spyOn(globalThis.history, 'back')

      const pageHeader = await ProviderDetails.getHeader()
      const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
      await backAction?.click()

      expect(globalThis.history.back).toHaveBeenCalledTimes(1)
    })

    it('should display item details in form fields', async () => {
      store.overrideSelector(selectProviderDetailsViewModel, baseProviderDetaulsViewModel)
      store.refreshState()

      const pageDetails = component.formGroup.value
      expect(pageDetails).toEqual({
        name: 'Test name',
        description: 'Test description',
        llmUrl: 'Test llmUrl',
        type: 'OPENAI',
        authMode: 'API_KEY',
        apiKey: 'TestAPIKey',
        newModelIdentifier: null
      })
    })

    it('should call toggleEditMode(true) when Edit action is clicked', async () => {
      const toggleSpy = jest.spyOn(component, 'toggleEditMode')
      const pageHeader = await ProviderDetails.getHeader()
      const editAction = await pageHeader.getInlineActionButtonByLabel('Edit')
      await editAction?.click()
      expect(toggleSpy).toHaveBeenCalledWith(true)
    })

    it('should call delete with empty string if details.id is undefined', async () => {
      const deleteSpy = jest.spyOn(component, 'delete')
      store.overrideSelector(selectProviderDetailsViewModel, {
        details: undefined,
        models: [],
        modelsLoadingIndicator: false,
        modelMutationInProgress: false,
        isSubmitting: false,
        editMode: false,
        isApiKeyHidden: false
      })
      store.refreshState()
      fixture.detectChanges()
      await fixture.whenStable()

      const actions = await firstValueFrom(component.headerActions$)
      const deleteAction = actions.find((a) => a.labelKey === 'PROVIDER_DETAILS.GENERAL.DELETE')
      expect(deleteAction).toBeDefined()
      deleteAction?.actionCallback?.()
      expect(deleteSpy).toHaveBeenCalledWith('')
    })

    it('should call save when Save action is clicked in edit mode', async () => {
      const saveSpy = jest.spyOn(component, 'save')
      store.overrideSelector(selectProviderDetailsViewModel, {
        ...baseProviderDetaulsViewModel,
        editMode: true
      })
      store.refreshState()
      fixture.detectChanges()

      const pageHeader = await ProviderDetails.getHeader()
      const saveAction = await pageHeader.getInlineActionButtonByLabel('Save')
      await saveAction?.click()
      expect(saveSpy).toHaveBeenCalled()
    })

    it('should call delete with correct id when Delete action is triggered', async () => {
      const deleteSpy = jest.spyOn(component, 'delete')

      store.overrideSelector(selectProviderDetailsViewModel, {
        ...baseProviderDetaulsViewModel,
        editMode: false
      })
      store.refreshState()
      fixture.detectChanges()
      await fixture.whenStable()

      const actions = await firstValueFrom(component.headerActions$)
      const deleteAction = actions.find((a) => a.labelKey === 'PROVIDER_DETAILS.GENERAL.DELETE')

      expect(deleteAction).toBeDefined()
      deleteAction?.actionCallback?.()

      expect(deleteSpy).toHaveBeenCalledWith('1')
    })

    it('should call toggleEditMode(false) when Cancel action is clicked', async () => {
      const toggleSpy = jest.spyOn(component, 'toggleEditMode')

      store.overrideSelector(selectProviderDetailsViewModel, {
        ...baseProviderDetaulsViewModel,
        editMode: true
      })
      store.refreshState()
      fixture.detectChanges()

      const pageHeader = await ProviderDetails.getHeader()
      const cancelAction = await pageHeader.getInlineActionButtonByLabel('Cancel')
      await cancelAction?.click()

      expect(toggleSpy).toHaveBeenCalledWith(false)
    })

    it('should patch form fields with empty string if details fields are undefined', async () => {
      store.overrideSelector(selectProviderDetailsViewModel, {
        details: { id: '', name: '', description: '' },
        models: [],
        modelsLoadingIndicator: false,
        modelMutationInProgress: false,
        isSubmitting: false,
        editMode: false,
        isApiKeyHidden: false
      })
      store.refreshState()
      fixture.detectChanges()

      const pageDetails = component.formGroup.value
      expect(pageDetails).toEqual({
        name: '',
        description: '',
        llmUrl: undefined,
        type: undefined,
        authMode: undefined,
        apiKey: undefined,
        newModelIdentifier: null
      })
    })
  })

  describe('actions & dispatch', () => {
    it('should dispatch providerUpdateRequested when save() is called', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')

      component.formGroup.patchValue({
        name: 'Provider One',
        description: 'Desc',
        llmUrl: 'http://llm',
        type: 'OPENAI',
        authMode: 'API_KEY',
        apiKey: 'secret'
      })

      component.save()

      expect(dispatchSpy).toHaveBeenCalledWith(
        ProviderDetailsActions.providerUpdateRequested({
          details: {
            id: undefined,
            name: 'Provider One',
            description: 'Desc',
            llmUrl: 'http://llm',
            type: 'OPENAI',
            authMode: 'API_KEY',
            apiKey: 'secret'
          } as any
        })
      )
    })

    it('should apply nullish defaults when saving empty form values', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.formGroup.patchValue({
        name: null,
        description: null,
        llmUrl: null,
        type: null,
        authMode: null,
        apiKey: null
      })

      component.save()

      expect(dispatchSpy).toHaveBeenCalledWith(
        ProviderDetailsActions.providerUpdateRequested({
          details: {
            id: undefined,
            name: '',
            description: undefined,
            type: undefined,
            llmUrl: undefined,
            apiKey: undefined,
            authMode: undefined
          } as any
        })
      )
    })

    it('should dispatch editProviderDetailsButtonClicked action on edit()', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.edit('123')
      expect(dispatchSpy).toHaveBeenCalledWith(ProviderSearchActions.editProviderDetailsButtonClicked({ id: '123' }))
    })

    it('should dispatch deleteProviderButtonClicked action on delete()', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.delete('456')
      expect(dispatchSpy).toHaveBeenCalledWith(ProviderSearchActions.deleteProviderButtonClicked({ id: '456' }))
    })

    it('should dispatch apiKeyVisibilityToggled action on toggleApiKeyVisibility()', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.toggleApiKeyVisibility()
      expect(dispatchSpy).toHaveBeenCalledWith(ProviderDetailsActions.apiKeyVisibilityToggled())
    })
  })

  describe('createModelInPlace', () => {
    it('should not dispatch when the model identifier is not set', () => {
      jest.spyOn(store, 'dispatch')

      component.createModelInPlace()

      expect(store.dispatch).not.toHaveBeenCalled()
    })

    it('should not dispatch when the model identifier is blank', () => {
      jest.spyOn(store, 'dispatch')
      component.formGroup.get('newModelIdentifier')?.setValue('   ')

      component.createModelInPlace()

      expect(store.dispatch).not.toHaveBeenCalled()
    })

    it('should dispatch providerModelCreateClicked with the trimmed name and reset the input', () => {
      jest.spyOn(store, 'dispatch')
      component.formGroup.get('newModelIdentifier')?.setValue('  gpt-4  ')

      component.createModelInPlace()

      expect(store.dispatch).toHaveBeenCalledWith(
        ProviderDetailsActions.providerModelCreateClicked({ modelIdentifier: 'gpt-4' })
      )
      expect(component.formGroup.get('newModelIdentifier')?.value).toBeNull()
    })

    it('should not dispatch or throw when the newModelIdentifier control is missing', () => {
      jest.spyOn(store, 'dispatch')
      component.formGroup.removeControl('newModelIdentifier')

      expect(() => component.createModelInPlace()).not.toThrow()
      expect(store.dispatch).not.toHaveBeenCalled()
    })
  })

  describe('deleteModel', () => {
    it('should not dispatch when the model id is missing', () => {
      jest.spyOn(store, 'dispatch')

      component.deleteModel({ modelIdentifier: 'gpt-4' } as any)

      expect(store.dispatch).not.toHaveBeenCalled()
    })

    it('should dispatch providerModelDeleteClicked when the model has an id', () => {
      jest.spyOn(store, 'dispatch')

      component.deleteModel({ id: 'm1', modelIdentifier: 'gpt-4' } as any)

      expect(store.dispatch).toHaveBeenCalledWith(ProviderDetailsActions.providerModelDeleteClicked({ modelId: 'm1' }))
    })
  })

  describe('toggleEditMode', () => {
    it('should enable form and dispatch editMode true on toggleEditMode(true)', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      jest.spyOn(component['user'], 'hasPermission').mockReturnValue(true as unknown as Promise<boolean>)

      component.toggleEditMode(true)

      expect(dispatchSpy).toHaveBeenCalledWith(ProviderDetailsActions.providerDetailsEditModeSet({ editMode: true }))
      expect(component.formGroup.enabled).toBe(true)
    })

    it('should disable form and dispatch editMode false on toggleEditMode(false)', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      jest.spyOn(component['user'], 'hasPermission').mockReturnValue(true as unknown as Promise<boolean>)

      component.toggleEditMode(false)

      expect(dispatchSpy).toHaveBeenCalledWith(ProviderDetailsActions.providerDetailsEditModeSet({ editMode: false }))
      expect(component.formGroup.disabled).toBe(true)
    })

    it('should disable apiKey field synchronously when user lacks permission', () => {
      jest.spyOn(component['user'], 'hasPermission').mockReturnValue(false as unknown as Promise<boolean>)

      component.toggleEditMode(true)

      expect(component.formGroup.get('apiKey')?.disabled).toBe(true)
    })

    it('should keep apiKey enabled when sync permission is granted', () => {
      jest.spyOn(component['user'], 'hasPermission').mockReturnValue(true as unknown as Promise<boolean>)

      component.toggleEditMode(true)

      expect(component.formGroup.get('apiKey')?.disabled).toBe(false)
    })

    it('should disable apiKey asynchronously when permission promise resolves to false', fakeAsync(() => {
      jest.spyOn(component['user'], 'hasPermission').mockReturnValue(Promise.resolve(false))
      const apiKeyControl = component.formGroup.get('apiKey')
      const disableSpy = apiKeyControl ? jest.spyOn(apiKeyControl, 'disable') : jest.fn()

      component.toggleEditMode(true)
      tick()

      expect(disableSpy).toHaveBeenCalled()
      expect(component.formGroup.get('apiKey')?.disabled).toBe(true)
    }))

    it('should keep apiKey enabled asynchronously when permission promise resolves to true', fakeAsync(() => {
      jest.spyOn(component['user'], 'hasPermission').mockReturnValue(Promise.resolve(true))
      const apiKeyControl = component.formGroup.get('apiKey')
      const disableSpy = apiKeyControl ? jest.spyOn(apiKeyControl, 'disable') : jest.fn()

      component.toggleEditMode(true)
      tick()

      expect(disableSpy).not.toHaveBeenCalled()
    }))

    it('should not throw when apiKey control is missing during async permission deny', fakeAsync(() => {
      jest.spyOn(component['user'], 'hasPermission').mockReturnValue(Promise.resolve(false))
      component.formGroup.removeControl('apiKey')

      expect(() => {
        component.toggleEditMode(true)
        tick()
      }).not.toThrow()
    }))
  })

  describe('apiKey control safety', () => {
    it('should safely call disable on apiKey control if it exists', () => {
      const userMock = { hasPermission: () => false }
      const component = new ProviderDetailsComponent(store, breadcrumbService, userMock as any)
      const apiKeyControl = component.formGroup.get('apiKey')
      const disableSpy = apiKeyControl ? jest.spyOn(apiKeyControl, 'disable') : jest.fn()
      component.toggleEditMode(true)
      expect(disableSpy).toHaveBeenCalled()
    })

    it('should not throw if apiKey control does not exist', () => {
      const userMock = { hasPermission: () => false }
      const component = new ProviderDetailsComponent(store, breadcrumbService, userMock as any)
      component.formGroup.removeControl('apiKey')
      expect(() => component.toggleEditMode(true)).not.toThrow()
    })
  })
})
