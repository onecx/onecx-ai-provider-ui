import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { LetDirective } from '@ngrx/component'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, take } from 'rxjs'
import { ActivatedRoute } from '@angular/router'
import { AlwaysGrantPermissionChecker, HAS_PERMISSION_CHECKER, providePermissionService } from '@onecx/angular-utils'
import { BreadcrumbService } from '@onecx/angular-accelerator'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'
import { ScaffoldDetailsComponent } from './scaffold-details.component'
import { selectScaffoldDetailsViewModel } from './scaffold-details.selectors'
import { ScaffoldDetailsViewModel } from './scaffold-details.viewmodel'

describe('ScaffoldDetailsComponent', () => {
  let component: ScaffoldDetailsComponent
  let fixture: ComponentFixture<ScaffoldDetailsComponent>
  let store: MockStore

  const baseViewModel: ScaffoldDetailsViewModel = {
    details: {
      id: '1',
      name: 'Test Scaffold',
      sourceProduct: 'ProductX',
      systemPrompt: 'Test Prompt'
    } as any,
    editMode: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScaffoldDetailsComponent, ReactiveFormsModule, LetDirective, TranslateTestingModule.withTranslations({})],
      providers: [
        { provide: HAS_PERMISSION_CHECKER, useClass: AlwaysGrantPermissionChecker },
        ...providePermissionService(),
        provideUserServiceMock(),
        BreadcrumbService,
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} }, queryParams: of({}) } },
        provideMockStore({
          selectors: [{ selector: selectScaffoldDetailsViewModel, value: baseViewModel }]
        })
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(ScaffoldDetailsComponent)
    component = fixture.componentInstance
    store = TestBed.inject(MockStore)
    fixture.detectChanges()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('HeaderActions', () => {
    it('should call history.back when back action callback is triggered', (done) => {
      const spy = jest.spyOn(globalThis.history, 'back')
      
      component.headerActions$.pipe(take(1)).subscribe((actions) => {
        const backAction = actions.find((a) => a.titleKey === 'SCAFFOLD_DETAILS.GENERAL.BACK')
        backAction?.actionCallback?.()
        
        expect(spy).toHaveBeenCalled()
        spy.mockRestore()
        done()
      })
    })

    it('should dispatch edit action when edit action callback is triggered', (done) => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      
      component.headerActions$.pipe(take(1)).subscribe((actions) => {
        const editAction = actions.find((a) => a.titleKey === 'SCAFFOLD_DETAILS.GENERAL.EDIT')
        editAction?.actionCallback?.()
        
        expect(dispatchSpy).toHaveBeenCalled()
        done()
      })
    })

    it('should show cancel action when editMode is true', (done) => {
      store.overrideSelector(selectScaffoldDetailsViewModel, {
        ...baseViewModel,
        editMode: true
      })
      store.refreshState()

      component.headerActions$.pipe(take(1)).subscribe((actions) => {
        expect(actions.some((a) => a.titleKey === 'SCAFFOLD_DETAILS.GENERAL.CANCEL')).toBe(true)
        done()
      })
    })

    it('should call toggleEditMode(false) when cancel action callback is triggered', (done) => {
      const toggleEditModeSpy = jest.spyOn(component, 'toggleEditMode')
      store.overrideSelector(selectScaffoldDetailsViewModel, {
        ...baseViewModel,
        editMode: true
      })
      store.refreshState()

      component.headerActions$.pipe(take(1)).subscribe((actions) => {
        const cancelAction = actions.find((a) => a.titleKey === 'SCAFFOLD_DETAILS.GENERAL.CANCEL')
        cancelAction?.actionCallback?.()
        expect(toggleEditModeSpy).toHaveBeenCalledWith(false)
        done()
      })
    })

    it('should call edit() when save action callback is triggered', (done) => {
      const editSpy = jest.spyOn(component, 'edit')
      store.overrideSelector(selectScaffoldDetailsViewModel, {
        ...baseViewModel,
        editMode: true
      })
      store.refreshState()

      component.headerActions$.pipe(take(1)).subscribe((actions) => {
        const saveAction = actions.find((a) => a.titleKey === 'SCAFFOLD_DETAILS.GENERAL.SAVE')
        saveAction?.actionCallback?.()
        expect(editSpy).toHaveBeenCalledWith('1')
        done()
      })
    })

    it('should call edit with empty string when details is undefined in save action', (done) => {
      const editSpy = jest.spyOn(component, 'edit')

      store.overrideSelector(selectScaffoldDetailsViewModel, {
        details: undefined,
        editMode: true
      } as any)
      store.refreshState()

      component.headerActions$.pipe(take(1)).subscribe((actions) => {
        const saveAction = actions.find(
        (a) => a.titleKey === 'SCAFFOLD_DETAILS.GENERAL.SAVE'
        )

        saveAction?.actionCallback?.()
        expect(editSpy).toHaveBeenCalledWith('')
        done()
      })
    })

    it('should dispatch delete action when delete callback is triggered', (done) => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.headerActions$.pipe(take(1)).subscribe((actions) => {
        const deleteAction = actions.find((a) => a.titleKey === 'SCAFFOLD_DETAILS.GENERAL.DELETE')
        deleteAction?.actionCallback?.()
        expect(dispatchSpy).toHaveBeenCalled()
        done()
      })
    })

    it('should call delete with empty string when details is undefined in delete action', (done) => {
      const deleteSpy = jest.spyOn(component, 'delete')

      store.overrideSelector(selectScaffoldDetailsViewModel, {
        details: undefined,
        editMode: false
      } as any)
      store.refreshState()

      component.headerActions$.pipe(take(1)).subscribe((actions) => {
        const deleteAction = actions.find(
        (a) => a.titleKey === 'SCAFFOLD_DETAILS.GENERAL.DELETE'
        )

        deleteAction?.actionCallback?.()
        expect(deleteSpy).toHaveBeenCalledWith('')
        done()
      })
    })
  })

  describe('Component Methods', () => {
    it('should dispatch edit action with id', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.edit('123')
      expect(dispatchSpy).toHaveBeenCalled()
    })

    it('should dispatch delete action with id', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.delete('123')
      expect(dispatchSpy).toHaveBeenCalled()
    })

    it('should dispatch toggleEditMode action', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.toggleEditMode(true)
      expect(dispatchSpy).toHaveBeenCalled()
    })
  })

  describe('ViewModel Subscription', () => {
    it('should enable sourceProduct when details is undefined (covers optional chaining)', (done) => {
      store.overrideSelector(selectScaffoldDetailsViewModel, {
        details: undefined,
        editMode: true
      } as any)
      store.refreshState()

      component.headerActions$.pipe(take(1)).subscribe(() => {
        component.toggleEditMode(true)

        const control = component.formGroup.get('sourceProduct')

        expect(control?.enabled).toBe(true)
        done()
      })
    })
  })
})
