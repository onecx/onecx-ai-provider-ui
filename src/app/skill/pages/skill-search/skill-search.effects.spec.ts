import { HttpEvent } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { provideMockActions } from '@ngrx/effects/testing'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import {
  ColumnType,
  DataTableColumn,
  ExportDataService,
  PortalDialogService,
  RowListGridData
} from '@onecx/angular-accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { of, ReplaySubject, throwError } from 'rxjs'
import { take } from 'rxjs/operators'

import { Skill, SkillPageResult, SkillService } from 'src/app/shared/generated'
import { skillSearchActions } from './skill-search.actions'
import { SkillSearchEffects } from './skill-search.effects'
import { SkillSearchCriteria } from './skill-search.parameters'
import { initialState } from './skill-search.reducers'
import { selectSkillSearchViewModel, skillSearchSelectors } from './skill-search.selectors'
import { SkillSearchViewModel } from './skill-search.viewmodel'

jest.mock('@onecx/ngrx-accelerator', () => {
  const actual = jest.requireActual('@onecx/ngrx-accelerator')
  return {
    ...actual,
    filterForNavigatedTo: () => (source: unknown) => source,
    filterOutQueryParamsHaveNotChanged: () => (source: unknown) => source
  }
})

// ACTION S11: Change test data in the whole document
describe('SkillSearchEffects', () => {
  let actions$: ReplaySubject<Action>
  let effects: SkillSearchEffects
  let store: MockStore<Store>
  let router: jest.Mocked<Router>
  let route: ActivatedRoute
  let skillService: jest.Mocked<SkillService>
  let portalDialogService: jest.Mocked<PortalDialogService>
  let messageService: jest.Mocked<PortalMessageService>
  let exportDataService: jest.Mocked<ExportDataService>

  const mockCriteria: SkillSearchCriteria = { name: 'test' }

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)

    skillService = {
      createSkill: jest.fn(),
      updateSkillById: jest.fn(),
      deleteSkillById: jest.fn(),
      findSkillByCriteria: jest.fn()
    } as unknown as jest.Mocked<SkillService>

    router = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
      parseUrl: jest.fn(),
      events: of()
    } as unknown as jest.Mocked<Router>

    portalDialogService = {
      openDialog: jest.fn()
    } as unknown as jest.Mocked<PortalDialogService>

    messageService = {
      success: jest.fn(),
      error: jest.fn()
    } as unknown as jest.Mocked<PortalMessageService>

    exportDataService = {
      exportCsv: jest.fn()
    } as unknown as jest.Mocked<ExportDataService>

    route = {
      queryParams: of({}),
      snapshot: { queryParams: {} }
    } as unknown as ActivatedRoute

    await TestBed.configureTestingModule({
      providers: [
        SkillSearchEffects,
        provideRouter([]),
        provideMockStore({
          initialState: { SkillSearch: initialState }
        }),
        provideMockActions(() => actions$),
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: SkillService, useValue: skillService },
        { provide: PortalDialogService, useValue: portalDialogService },
        { provide: PortalMessageService, useValue: messageService },
        { provide: ExportDataService, useValue: exportDataService }
      ]
    }).compileComponents()

    store = TestBed.inject(MockStore)
    effects = TestBed.inject(SkillSearchEffects)
  })

  beforeEach(() => {
    jest.resetAllMocks()
    ;(router.parseUrl as jest.Mock).mockImplementation((url: string) => ({
      toString: () => (url ? url.split('?')[0].split('#')[0] : '/search'),
      queryParams: {},
      fragment: null
    }))
  })

  describe('syncParamsToUrl$', () => {
    beforeEach(() => {
      store.overrideSelector(skillSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()
    })

    it('should navigate to update URL when criteria differs from query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')
      route.queryParams = of({ different: 'yes' })

      effects.syncParamsToUrl$.pipe(take(1)).subscribe(() => {
        expect(navigateSpy).toHaveBeenCalled()
        done()
      })

      actions$.next(skillSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))
    })

    it('should not navigate when criteria matches query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')
      route.queryParams = of(mockCriteria)

      effects.syncParamsToUrl$.pipe(take(1)).subscribe(() => {
        expect(navigateSpy).not.toHaveBeenCalled()
        done()
      })

      actions$.next(skillSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))
    })

    it('should navigate when resetButtonClicked action is triggered', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')
      route.queryParams = of({ something: 'else' })

      effects.syncParamsToUrl$.pipe(take(1)).subscribe(() => {
        expect(navigateSpy).toHaveBeenCalled()
        done()
      })

      actions$.next(skillSearchActions.resetButtonClicked())
    })
  })

  describe('searchByUrl$ / performSearch', () => {
    beforeEach(() => {
      store.overrideSelector(skillSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      skillService.findSkillByCriteria.mockReturnValue(
        of({
          stream: [{ id: '1', name: 'Item 1' }],
          content: [{ id: '1', name: 'Item 1', imagePath: '' }],
          size: 10,
          number: 0,
          totalElements: 1,
          totalPages: 1
        } as unknown as HttpEvent<SkillPageResult>)
      )
    })

    it('should dispatch resultsLoadingFailed on search error', (done) => {
      const mockError = 'Search failed'
      skillService.findSkillByCriteria.mockReturnValueOnce(throwError(() => mockError))

      effects
        .performSearch(mockCriteria)
        .pipe(take(1))
        .subscribe((action) => {
          expect(action.type).toEqual(skillSearchActions.skillSearchResultsLoadingFailed.type)
          expect(action).toEqual(skillSearchActions.skillSearchResultsLoadingFailed({ error: mockError }))
          done()
        })
    })

    it('should convert Date objects in search criteria before calling skillService', (done) => {
      const criteriaWithDate = { ...mockCriteria, startDate: new Date('2023-01-01'), endDate: new Date('2023-12-31') }
      const searchSpy = jest.spyOn(skillService, 'findSkillByCriteria')

      effects
        .performSearch(criteriaWithDate)
        .pipe(take(1))
        .subscribe(() => {
          expect(searchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              startDate: '2023-01-01T00:00:00.000Z',
              endDate: '2023-12-31T00:00:00.000Z'
            })
          )
          done()
        })
    })

    it('should use latest criteria from store and call performSearch on routerNavigatedAction', (done) => {
      const criteriaFromStore = { name: 'fromStore' }
      store.overrideSelector(skillSearchSelectors.selectCriteria, criteriaFromStore)
      store.refreshState()

      const markerAction = skillSearchActions.skillSearchResultsLoadingFailed({ error: null })
      const performSearchSpy = jest.spyOn(effects, 'performSearch').mockReturnValue(of(markerAction))

      effects.searchByUrl$.pipe(take(1)).subscribe((action) => {
        expect(performSearchSpy).toHaveBeenCalledWith(criteriaFromStore)
        expect(action).toBe(markerAction)
        done()
      })

      actions$.next({ type: routerNavigatedAction.type })
    })
  })

  describe('exportData$', () => {
    const cases = [
      {
        desc: 'should handle export with empty displayed columns',
        viewModel: {
          results: [{ id: '1', name: 'Context 1', imagePath: '' }],
          resultComponentState: { displayedColumns: undefined }
        } as Partial<SkillSearchViewModel>
      },
      {
        desc: 'should handle export with null resultComponentState',
        viewModel: {
          results: [{ id: '1', name: 'Context 1', imagePath: '' }],
          resultComponentState: null
        } as Partial<SkillSearchViewModel>
      }
    ]

    cases.forEach(({ desc, viewModel }) => {
      it(desc, (done) => {
        store.overrideSelector(selectSkillSearchViewModel, viewModel as SkillSearchViewModel)

        effects.exportData$.pipe(take(1)).subscribe(() => {
          expect(exportDataService.exportCsv).toHaveBeenCalledWith([], viewModel.results, 'export_skill.csv')
          done()
        })

        actions$.next(skillSearchActions.exportButtonClicked())
      })
    })

    it('should export CSV with correct parameters when export button is clicked', (done) => {
      const mockColumns: DataTableColumn[] = [
        {
          columnType: ColumnType.STRING,
          id: 'name',
          nameKey: 'SKILL_SEARCH.RESULTS.CHANGE_ME'
        }
      ]
      const mockResults: Partial<RowListGridData>[] = [
        { id: '1', name: 'Context 1' },
        { id: '2', name: 'Context 2' }
      ]
      const mockViewModel = { resultComponentState: { displayedColumns: mockColumns }, results: mockResults }
      store.overrideSelector(selectSkillSearchViewModel, mockViewModel as SkillSearchViewModel)

      effects.exportData$.pipe(take(1)).subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(mockColumns, mockResults, 'export_skill.csv')
        done()
      })

      actions$.next(skillSearchActions.exportButtonClicked())
    })

    it('should handle export with empty results', (done) => {
      const mockColumns: DataTableColumn[] = [
        {
          columnType: ColumnType.STRING,
          id: 'name',
          nameKey: 'SKILL_SEARCH.RESULTS.CHANGE_ME'
        }
      ]
      const mockViewModel = {
        resultComponentState: { displayedColumns: mockColumns },
        results: [] as RowListGridData[]
      }
      store.overrideSelector(selectSkillSearchViewModel, mockViewModel as SkillSearchViewModel)

      effects.exportData$.pipe(take(1)).subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(mockColumns, [], 'export_skill.csv')
        done()
      })

      actions$.next(skillSearchActions.exportButtonClicked())
    })
  })

  describe('displayError$', () => {
    it('should display error message when ResultsLoadingFailed action is dispatched', (done) => {
      effects.displayError$.pipe(take(1)).subscribe(() => {
        expect(messageService.error).toHaveBeenCalled()
        done()
      })

      actions$.next(skillSearchActions.skillSearchResultsLoadingFailed({ error: 'Test error' }))
    })
  })

  describe('navigateToOrderDetailsPage$', () => {
    it('should navigate to details page with correct URL structure', (done) => {
      const testId = 'test-123'
      const navigateSpy = router
        ? jest.spyOn(router, 'navigate')
        : // eslint-disable-next-line @typescript-eslint/no-empty-function
          { mock: { calls: [] }, toHaveBeenCalledWith: () => {} }

      effects.navigateToOrderDetailsPage$.pipe(take(1)).subscribe(() => {
        if (router) {
          expect(navigateSpy).toHaveBeenCalledWith(['/search', 'details', testId])
        }
        done()
      })

      actions$.next(skillSearchActions.detailsButtonClicked({ id: testId }))
    })

    it('should dynamically clear query params and fragment from URL on navigateToOrderDetailsPage$', (done) => {
      const testId = 'test-456'
      const mockUrlTree = {
        toString: jest.fn(() => '/search'),
        queryParams: { a: 1 },
        fragment: 'frag'
      }
      ;(router.parseUrl as jest.Mock).mockReturnValue(mockUrlTree)

      const emissions: { queryParams: unknown; fragment: unknown }[] = []
      emissions.push({ queryParams: { ...mockUrlTree.queryParams }, fragment: mockUrlTree.fragment })

      effects.navigateToOrderDetailsPage$.pipe(take(1)).subscribe(() => {
        emissions.push({ queryParams: { ...mockUrlTree.queryParams }, fragment: mockUrlTree.fragment })

        expect(emissions).toEqual([
          { queryParams: { a: 1 }, fragment: 'frag' },
          { queryParams: {}, fragment: null }
        ])
        done()
      })

      actions$.next(skillSearchActions.detailsButtonClicked({ id: testId }))
    })
  })

  describe('refreshSearchAfterCreateUpdate$', () => {
    it('should dispatch ResultsLoadingFailed when search after create/update fails', (done) => {
      const mockError = 'Refresh search failed'

      store.overrideSelector(skillSearchSelectors.selectCriteria, {})
      skillService.findSkillByCriteria.mockReturnValueOnce(throwError(() => mockError))

      effects.refreshSearchAfterCreateUpdate$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(skillSearchActions.skillSearchResultsLoadingFailed({ error: mockError }))
        done()
      })

      actions$.next(skillSearchActions.createSkillSucceeded())
    })
  })

  describe('editButtonClicked$', () => {
    const item = { id: 'test-123', name: 'Item' }
    beforeEach(() => {
      store.overrideSelector(skillSearchSelectors.selectResults, [item])
      store.refreshState()
    })

    it('should dispatch updateSucceeded and show a success message when update succeeds', (done) => {
      const dialog = { button: 'primary', result: { ...item } }

      portalDialogService.openDialog.mockReturnValue(of(dialog) as never)
      skillService.updateSkillById.mockReturnValue(of({} as HttpEvent<Skill>))

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(skillSearchActions.updateSkillSucceeded.type)

        expect(messageService.success).toHaveBeenCalled()
        done()
      })

      actions$.next(skillSearchActions.editSkillButtonClicked({ id: 'test-123' }))
    })

    it('should dispatch updateCancelled and not call the service when dialog is cancelled', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: null }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(skillSearchActions.updateSkillCancelled.type)

        expect(skillService.updateSkillById).not.toHaveBeenCalled()
        done()
      })

      actions$.next(skillSearchActions.editSkillButtonClicked({ id: 'test-123' }))
    })

    it('should dispatch updateFailed and show an error message when API update call fails', (done) => {
      const dialog = { button: 'primary', result: { ...item } }
      portalDialogService.openDialog.mockReturnValue(of(dialog) as never)
      skillService.updateSkillById.mockReturnValue(throwError(() => 'Update failed'))

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(skillSearchActions.updateSkillFailed({ error: 'Update failed' }))

        expect(messageService.error).toHaveBeenCalled()
        done()
      })

      actions$.next(skillSearchActions.editSkillButtonClicked({ id: 'test-123' }))
    })

    it('should dispatch updateFailed when dialog confirms but returns no result', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(skillSearchActions.updateSkillFailed.type)

        expect(skillService.updateSkillById).not.toHaveBeenCalled()
        done()
      })

      actions$.next(skillSearchActions.editSkillButtonClicked({ id: 'test-123' }))
    })
  })

  describe('createButtonClicked$', () => {
    it('should dispatch createSucceeded and show a success message when creation succeeds', (done) => {
      const dialog = { button: 'primary', result: { name: 'New' } }
      portalDialogService.openDialog.mockReturnValue(of(dialog) as never)
      skillService.createSkill.mockReturnValue(of({}) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(skillSearchActions.createSkillSucceeded.type)
        expect(messageService.success).toHaveBeenCalled()
        done()
      })

      actions$.next(skillSearchActions.createSkillButtonClicked())
    })

    it('should dispatch createCancelled and not call the service when dialog is cancelled', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: { name: 'x' } }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(skillSearchActions.createSkillCancelled.type)
        expect(skillService.createSkill).not.toHaveBeenCalled()
        done()
      })

      actions$.next(skillSearchActions.createSkillButtonClicked())
    })

    it('should dispatch createFailed when dialog confirms but returns no result', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(skillSearchActions.createSkillFailed.type)
        expect(skillService.createSkill).not.toHaveBeenCalled()
        done()
      })

      actions$.next(skillSearchActions.createSkillButtonClicked())
    })

    it('should dispatch createFailed and show an error message when API create call fails', (done) => {
      const dialog = { button: 'primary', result: { name: 'New' } }
      portalDialogService.openDialog.mockReturnValue(of(dialog) as never)
      skillService.createSkill.mockReturnValue(throwError(() => 'API Error'))

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(skillSearchActions.createSkillFailed({ error: 'API Error' }))
        expect(messageService.error).toHaveBeenCalled()
        done()
      })

      actions$.next(skillSearchActions.createSkillButtonClicked())
    })
  })

  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>
})
