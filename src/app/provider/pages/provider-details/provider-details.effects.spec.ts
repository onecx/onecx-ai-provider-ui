import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { AlwaysGrantPermissionChecker, HAS_PERMISSION_CHECKER, PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { ProviderDetailsComponent } from './provider-details.component'
import { ProviderDetailsHarness } from './provider-details.harness'
import { initialState } from './provider-details.reducers'
import { selectProviderDetailsViewModel } from './provider-details.selectors'
import { ProviderDetailsViewModel } from './provider-details.viewmodel'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { ReactiveFormsModule } from '@angular/forms'
import { ProviderSearchActions } from '../provider-search/provider-search.actions'
import { ProviderDetailsActions } from './provider-details.actions'
import { firstValueFrom } from 'rxjs'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'

describe('ProviderDetailsComponent actions & dispatch', () => {
  let component: ProviderDetailsComponent
  let fixture: ComponentFixture<ProviderDetailsComponent>
  let store: MockStore<Store>
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
    userService.hasPermission = () => true
    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectProviderDetailsViewModel, baseProviderDetaulsViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(ProviderDetailsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    ProviderDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, ProviderDetailsHarness)
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
      editMode: false,
      isApiKeyHidden: false
    })
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()

    const actions = await firstValueFrom(component.headerActions$)
    const deleteAction = actions.find(a => a.labelKey === 'PROVIDER_DETAILS.GENERAL.DELETE')
    expect(deleteAction).toBeDefined()
    deleteAction!.actionCallback()
    expect(deleteSpy).toHaveBeenCalledWith('')
  })

  it('should call edit with empty string if details.id is undefined', async () => {
    const editSpy = jest.spyOn(component, 'edit')
    store.overrideSelector(selectProviderDetailsViewModel, {
      details: undefined,
      editMode: true,
      isApiKeyHidden: false
    })
    store.refreshState()
    fixture.detectChanges()

    const pageHeader = await ProviderDetails.getHeader()
    const saveAction = await pageHeader.getInlineActionButtonByLabel('Save')
    await saveAction?.click()
    expect(editSpy).toHaveBeenCalledWith('')
  })

  it('should call edit and toggleEditMode(false) when Save action is clicked', async () => {
    const editSpy = jest.spyOn(component, 'edit')
    const toggleSpy = jest.spyOn(component, 'toggleEditMode')

    store.overrideSelector(selectProviderDetailsViewModel, {
      ...baseProviderDetaulsViewModel,
      editMode: true
    })
    store.refreshState()
    fixture.detectChanges()

    const pageHeader = await ProviderDetails.getHeader()
    const saveAction = await pageHeader.getInlineActionButtonByLabel('Save')
    await saveAction?.click()

    expect(editSpy).toHaveBeenCalledWith('1')
    expect(toggleSpy).toHaveBeenCalledWith(false)
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
    const deleteAction = actions.find(a => a.labelKey === 'PROVIDER_DETAILS.GENERAL.DELETE')

    expect(deleteAction).toBeDefined()
    deleteAction!.actionCallback()

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
      details: {id: '', name: '', modelName: ''},
      editMode: false,
      isApiKeyHidden: false
    })
    store.refreshState()
    fixture.detectChanges()

    const pageDetails = component.formGroup.value
    expect(pageDetails).toEqual({
      name: '',
      description: undefined,
      llmUrl: undefined,
      modelName: '',
      apiKey: undefined
    })
  })
  it('should not throw when disabling apiKey field if formGroup or apiKey is missing', () => {
    component.formGroup.removeControl('apiKey')
    expect(() => component.formGroup.get('apiKey')?.disable()).not.toThrow()
  })
  it('should dispatch editProviderDetailsButtonClicked action on edit()', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    component.edit('123')
    expect(dispatchSpy).toHaveBeenCalledWith(
      ProviderSearchActions.editProviderDetailsButtonClicked({ id: '123' })
    )
  })
  it('should dispatch deleteProviderButtonClicked action on delete()', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    component.delete('456')
    expect(dispatchSpy).toHaveBeenCalledWith(
      ProviderSearchActions.deleteProviderButtonClicked({ id: '456' })
    )
  })

  it('should enable form and dispatch editMode true on toggleEditMode(true)', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    jest.spyOn(component['user'], 'hasPermission').mockReturnValue(true)

    component.toggleEditMode(true)

    expect(dispatchSpy).toHaveBeenCalledWith(
      ProviderDetailsActions.providerDetailsEditModeSet({ editMode: true })
    )
    expect(component.formGroup.enabled).toBe(true)
  })

  it('should disable form and dispatch editMode false on toggleEditMode(false)', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    component.toggleEditMode(false)

    expect(dispatchSpy).toHaveBeenCalledWith(
      ProviderDetailsActions.providerDetailsEditModeSet({ editMode: false })
    )
    expect(component.formGroup.disabled).toBe(true)
  })

  it('should disable apiKey field if user lacks permission', () => {
    jest.spyOn(component['user'], 'hasPermission').mockReturnValue(false)

    component.toggleEditMode(true)

    expect(component.formGroup.get('apiKey')?.disabled).toBe(true)
  })
  it('should dispatch apiKeyVisibilityToggled action on toggleApiKeyVisibility()', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    component.toggleApiKeyVisibility()
    expect(dispatchSpy).toHaveBeenCalledWith(
      ProviderDetailsActions.apiKeyVisibilityToggled()
    )
  })
})
