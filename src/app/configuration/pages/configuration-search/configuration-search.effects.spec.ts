import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { PortalMessageServiceMock, providePortalMessageServiceMock } from '@onecx/angular-integration-interface/mocks'
import { ExportDataService, PortalDialogService } from '@onecx/portal-integration-angular'
import { MonoTypeOperatorFunction, ReplaySubject, map, of, throwError } from 'rxjs'
import { ConfigurationService } from 'src/app/shared/generated'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { ConfigurationSearchActions } from './configuration-search.actions'
import { ConfigurationSearchEffects } from './configuration-search.effects'
import { ConfigurationSearchCriteria } from './configuration-search.parameters'
import { initialState } from './configuration-search.reducers'
import { configurationSearchSelectors, selectConfigurationSearchViewModel } from './configuration-search.selectors'
import { ConfigurationSearchViewModel } from './configuration-search.viewmodel'
import { ConfigurationCreateUpdateComponent } from './dialogs/configuration-create-update/configuration-create-update.component'

jest.mock('@onecx/ngrx-accelerator', () => {
  const actual = jest.requireActual('@onecx/ngrx-accelerator')
  const passThroughOp = <T>(): MonoTypeOperatorFunction<T> => map((x: T) => x)
  return {
    ...actual,
    filterForNavigatedTo: jest.fn((...args: unknown[]) => {
      void args
      return passThroughOp()
    }),
    filterOutQueryParamsHaveNotChanged: jest.fn((...args: unknown[]) => {
      void args
      return passThroughOp()
    })
  }
})

describe('ConfigurationSearchEffects', () => {
  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }

  let actions$: ReplaySubject<unknown>
  let effects: ConfigurationSearchEffects
  let store: MockStore<Store>
  let router: jest.Mocked<Router>
  let route: ActivatedRoute
  
  let configurationService: jest.Mocked<ConfigurationService>
  let portalDialogService: jest.Mocked<PortalDialogService>
  let exportDataService: jest.Mocked<ExportDataService>

  let mockMessageService: PortalMessageServiceMock

  const mockCriteria: ConfigurationSearchCriteria = {
    name: 'test-name',
  }

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)

    configurationService = {
      createConfiguration: jest.fn(),
      updateConfiguration: jest.fn(),
      deleteConfiguration: jest.fn(),
      findConfigurationBySearchCriteria: jest.fn()
    } as unknown as jest.Mocked<ConfigurationService>

    router = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
      parseUrl: jest.fn().mockImplementation((url: string) => {
        const urlParts = url.split('?')[0]
        return {
          queryParams: {},
          fragment: null,
          toString: () => urlParts
        }
      }),
      events: of()
    } as unknown as jest.Mocked<Router>

    portalDialogService = {
      openDialog: jest.fn()
    } as unknown as jest.Mocked<PortalDialogService>

    exportDataService = {
      exportCsv: jest.fn()
    } as unknown as jest.Mocked<ExportDataService>

    route = {
      queryParams: of({
        name: 'test-name',
        description: 'test-description'
      }),
      snapshot: {
        queryParams: {}
      }
    } as unknown as ActivatedRoute

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        ConfigurationSearchEffects,
        provideMockStore({
          initialState: { configurationSearch: initialState }
        }),
        provideMockActions(() => actions$),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: ConfigurationService, useValue: configurationService },
        { provide: PortalDialogService, useValue: portalDialogService },
        { provide: ExportDataService, useValue: exportDataService },
        providePortalMessageServiceMock()
      ]
    }).compileComponents()

    mockMessageService = TestBed.inject(PortalMessageServiceMock)

    effects = TestBed.inject(ConfigurationSearchEffects)
    store = TestBed.inject(MockStore)
  })

  describe('syncParamsToUrl$', () => {
    beforeEach(() => {
      store.overrideSelector(configurationSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()
    })

    it('should navigate to update URL when criteria differs from query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')

      route.queryParams = of({
        name: 'different-name',
        description: 'different-description'
      })

      actions$.next(ConfigurationSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))

      effects.syncParamsToUrl$.subscribe(() => {
        expect(navigateSpy).toHaveBeenCalledWith([], {
          relativeTo: route,
          queryParams: mockCriteria,
          replaceUrl: true,
          onSameUrlNavigation: 'ignore'
        })
        done()
      })
    })

    it('should not navigate when criteria matches query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')

      route.queryParams = of(mockCriteria)

      actions$.next(ConfigurationSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))

      effects.syncParamsToUrl$.subscribe(() => {
        expect(navigateSpy).not.toHaveBeenCalled()
        done()
      })
    })

    it('should navigate when resetButtonClicked action is triggered', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')

      route.queryParams = of({
        name: 'different-name',
      })

      actions$.next(ConfigurationSearchActions.resetButtonClicked())

      effects.syncParamsToUrl$.subscribe(() => {
        expect(navigateSpy).toHaveBeenCalledWith([], {
          relativeTo: route,
          queryParams: mockCriteria,
          replaceUrl: true,
          onSameUrlNavigation: 'ignore'
        })
        done()
      })
    })
  })

  describe('detailsButtonClicked$', () => {
    beforeEach(() => {
      store.overrideSelector(selectUrl, '/search?param=value#fragment')
      store.refreshState()
    })

    it('should navigate to details page with correct URL structure', (done) => {
      const testId = 'test-123'
      const navigateSpy = jest.spyOn(router, 'navigate')

      actions$.next(ConfigurationSearchActions.detailsButtonClicked({ id: testId }))

      effects.detailsButtonClicked$.subscribe(() => {
        expect(navigateSpy).toHaveBeenCalledWith(['/search', 'details', testId])
        done()
      })
    })

    it('should clear query params and fragment from URL', (done) => {
      const testId = 'test-456'
      const parseUrlSpy = jest.spyOn(router, 'parseUrl')

      const mockUrlTree = {
        toString: jest.fn(() => '/search'),
        queryParams: { param: 'value' },
        fragment: 'fragment'
      }

      parseUrlSpy.mockReturnValue(mockUrlTree as never)

      actions$.next(ConfigurationSearchActions.detailsButtonClicked({ id: testId }))

      effects.detailsButtonClicked$.subscribe(() => {
        expect(mockUrlTree.queryParams).toEqual({})
        expect(mockUrlTree.fragment).toBeNull()
        done()
      })
    })
  })

  describe('searchByUrl$', () => {
    beforeEach(() => {
      store.overrideSelector(configurationSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      configurationService.findConfigurationBySearchCriteria.mockReturnValue(
        of({
          stream: [{ id: '1', name: 'Test Context' }],
          size: 10,
          number: 0,
          totalElements: 1,
          totalPages: 1
        }) as never
      )
    })

    it('should call performSearch with criteria from store on router navigation', (done) => {
      const expectedAction = ConfigurationSearchActions.configurationSearchResultsReceived({
        stream: [],
        size: 0,
        number: 0,
        totalElements: 0,
        totalPages: 0
      })

      const performSpy = jest
        .spyOn(effects, 'performSearch')
        .mockReturnValue(of(expectedAction) as any)

      actions$.next({ type: routerNavigatedAction.type })

      effects.searchByUrl$.subscribe((action) => {
        expect(performSpy).toHaveBeenCalledWith(mockCriteria)
        expect(action).toEqual(expectedAction)
        done()
      })
    })

    it('should call performSearch and dispatch configurationSearchResultsReceived on successful search', (done) => {
      effects.performSearch(mockCriteria).subscribe((action) => {
        expect(action.type).toEqual(ConfigurationSearchActions.configurationSearchResultsReceived.type)
        expect(action).toEqual(
          ConfigurationSearchActions.configurationSearchResultsReceived({
            stream: [{ id: '1', name: 'Test Context' }],
            size: 10,
            number: 0,
            totalElements: 1,
            totalPages: 1
          })
        )
        done()
      })
    })

    it('should dispatch configurationSearchResultsLoadingFailed on search error', (done) => {
      const mockError = 'Search failed'

      configurationService.findConfigurationBySearchCriteria.mockReturnValue(throwError(() => mockError))

      effects.performSearch(mockCriteria).subscribe((action) => {
        expect(action.type).toEqual(ConfigurationSearchActions.configurationSearchResultsLoadingFailed.type)
        expect(action).toEqual(
          ConfigurationSearchActions.configurationSearchResultsLoadingFailed({
            error: mockError
          })
        )
        done()
      })
    })

    it('should handle Date objects in search criteria', (done) => {
      const criteriaWithDate = {
        ...mockCriteria,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      }

      const searchSpy = jest.spyOn(configurationService, 'findConfigurationBySearchCriteria')

      effects.performSearch(criteriaWithDate).subscribe(() => {
        expect(searchSpy).toHaveBeenCalledWith({
          ...mockCriteria,
          startDate: '2023-01-01T00:00:00.000Z',
          endDate: '2023-12-31T00:00:00.000Z'
        })
        done()
      })
    })
  })

  describe('refreshSearchAfterCreateUpdate$', () => {
    beforeEach(() => {
      store.overrideSelector(configurationSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      configurationService.findConfigurationBySearchCriteria.mockReturnValue(
        of({
          stream: [{ id: '2', name: 'Updated Context' }],
          size: 10,
          number: 0,
          totalElements: 1,
          totalPages: 1
        }) as never
      )
    });
    [
      {
        desc: 'should trigger search when createConfigurationSucceeded action is dispatched',
        action: ConfigurationSearchActions.createConfigurationSucceeded()
      },
      {
        desc: 'should trigger search when updateConfigurationSucceeded action is dispatched',
        action: ConfigurationSearchActions.updateConfigurationSucceeded()
      }
    ].forEach(({ desc, action }) => {
      it(desc, (done) => {
        actions$.next(action)
        effects.refreshSearchAfterCreateUpdate$.subscribe((effectAction) => {
          expect(effectAction.type).toEqual(ConfigurationSearchActions.configurationSearchResultsReceived.type)
          done()
        })
      })
    })

    it('should handle search errors properly', (done) => {
      const mockError = 'Refresh search failed'

      configurationService.findConfigurationBySearchCriteria.mockReturnValue(throwError(() => mockError))

      actions$.next(ConfigurationSearchActions.createConfigurationSucceeded())

      effects.refreshSearchAfterCreateUpdate$.subscribe((action) => {
        expect(action.type).toEqual(ConfigurationSearchActions.configurationSearchResultsLoadingFailed.type)
        expect(action).toEqual(
          ConfigurationSearchActions.configurationSearchResultsLoadingFailed({
            error: mockError
          })
        )
        done()
      })
    })
  })

  describe('editButtonClicked$', () => {
    const mockConfiguration = {
      id: 'test-123',
      name: 'Test Context',
      description: 'Test Description'
    }

    const mockResults = [mockConfiguration, { id: 'other-id', name: 'Other Context' }]

    beforeEach(() => {
      store.overrideSelector(configurationSearchSelectors.selectResults, mockResults)
      store.refreshState()
    })

    it('should open dialog and dispatch updateConfigurationSucceeded on successful update', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: { ...mockConfiguration, name: 'Updated Context' }
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      configurationService.updateConfiguration.mockReturnValue(of({}) as never)

      const messageSuccessSpy = jest.spyOn(mockMessageService, 'success')

      actions$.next(ConfigurationSearchActions.editConfigurationButtonClicked({ id: 'test-123' }))

      effects.editButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(ConfigurationSearchActions.updateConfigurationSucceeded.type)
        expect(configurationService.updateConfiguration).toHaveBeenCalledWith('test-123', {
          ...mockDialogResult.result
        })
        expect(messageSuccessSpy).toHaveBeenCalledWith({
          summaryKey: 'CONFIGURATION_CREATE_UPDATE.UPDATE.SUCCESS'
        })
        done()
      })
    });

    [
      {
        desc: 'should dispatch updateConfigurationCancelled when dialog is cancelled',
        dialogResult: { button: 'secondary', result: null }
      },
      {
        desc: 'should dispatch updateConfigurationCancelled when dialog result is null',
        dialogResult: null
      }
    ].forEach(({ desc, dialogResult }) => {
      it(desc, (done) => {
        portalDialogService.openDialog.mockReturnValue(of(dialogResult) as never)
        actions$.next(ConfigurationSearchActions.editConfigurationButtonClicked({ id: 'test-123' }))
        effects.editButtonClicked$.subscribe((action) => {
          expect(action.type).toEqual(ConfigurationSearchActions.updateConfigurationCancelled.type)
          expect(configurationService.updateConfiguration).not.toHaveBeenCalled()
          done()
        })
      })
    })

    it('should dispatch updateConfigurationFailed when API call fails', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: { ...mockConfiguration, name: 'Updated Context' }
      }
      const mockError = 'Update failed'

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)
      configurationService.updateConfiguration.mockReturnValue(throwError(() => mockError))

      const messageErrorSpy = jest.spyOn(mockMessageService, 'error')

      actions$.next(ConfigurationSearchActions.editConfigurationButtonClicked({ id: 'test-123' }))

      effects.editButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(ConfigurationSearchActions.updateConfigurationFailed.type)
        expect(action).toEqual(ConfigurationSearchActions.updateConfigurationFailed({ error: mockError }))
        expect(messageErrorSpy).toHaveBeenCalledWith({
          summaryKey: 'CONFIGURATION_CREATE_UPDATE.UPDATE.ERROR'
        })
        done()
      })
    })

    it('should throw error when dialog result is missing', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: null
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      const messageErrorSpy = jest.spyOn(mockMessageService, 'error')

      actions$.next(ConfigurationSearchActions.editConfigurationButtonClicked({ id: 'test-123' }))

      effects.editButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(ConfigurationSearchActions.updateConfigurationFailed.type)
        expect(messageErrorSpy).toHaveBeenCalledWith({
          summaryKey: 'CONFIGURATION_CREATE_UPDATE.UPDATE.ERROR'
        })
        done()
      })
    })

    it('should throw error when item ID is missing from dialog result', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: { name: 'Updated Context' }
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      const messageErrorSpy = jest.spyOn(mockMessageService, 'error')

      actions$.next(ConfigurationSearchActions.editConfigurationButtonClicked({ id: 'test-123' }))

      effects.editButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(ConfigurationSearchActions.updateConfigurationFailed.type)
        expect(messageErrorSpy).toHaveBeenCalledWith({
          summaryKey: 'CONFIGURATION_CREATE_UPDATE.UPDATE.ERROR'
        })
        done()
      })
    })

    it('should pass correct item to dialog based on action id', (done) => {
      const mockDialogResult = {
        button: 'secondary',
        result: null
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)
      actions$.next(ConfigurationSearchActions.editConfigurationButtonClicked({ id: 'test-123' }))

      effects.editButtonClicked$.subscribe(() => {
        expect(portalDialogService.openDialog).toHaveBeenCalledWith(
          'CONFIGURATION_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: expect.anything(),
            inputs: {
              vm: {
                itemToEdit: mockConfiguration
              }
            }
          },
          'CONFIGURATION_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'CONFIGURATION_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
        done()
      })
    })
  })

  describe('refreshSearchAfterDelete$', () => {
    beforeEach(() => {
      store.overrideSelector(configurationSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      configurationService.findConfigurationBySearchCriteria.mockReturnValue(
        of({
          stream: [{ id: '3', name: 'Remaining Context' }],
          size: 10,
          number: 0,
          totalElements: 1,
          totalPages: 1
        }) as never
      )
    })

    it('should trigger search when deleteConfigurationSucceeded action is dispatched', (done) => {
      actions$.next(ConfigurationSearchActions.deleteConfigurationSucceeded())

      effects.refreshSearchAfterDelete$.subscribe((action) => {
        expect(action.type).toEqual(ConfigurationSearchActions.configurationSearchResultsReceived.type)
        expect(action).toEqual(
          ConfigurationSearchActions.configurationSearchResultsReceived({
            stream: [{ id: '3', name: 'Remaining Context' }],
            size: 10,
            number: 0,
            totalElements: 1,
            totalPages: 1
          })
        )
        done()
      })
    })

    it('should handle search errors properly after delete', (done) => {
      const mockError = 'Refresh search after delete failed'

      configurationService.findConfigurationBySearchCriteria.mockReturnValue(throwError(() => mockError))

      actions$.next(ConfigurationSearchActions.deleteConfigurationSucceeded())

      effects.refreshSearchAfterDelete$.subscribe((action) => {
        expect(action.type).toEqual(ConfigurationSearchActions.configurationSearchResultsLoadingFailed.type)
        expect(action).toEqual(
          ConfigurationSearchActions.configurationSearchResultsLoadingFailed({
            error: mockError
          })
        )
        done()
      })
    })

    it('should use current search criteria from store', (done) => {
      const customCriteria = {
        name: 'custom-name',
        description: 'custom-desc'
      }

      store.overrideSelector(configurationSearchSelectors.selectCriteria, customCriteria)
      store.refreshState()

      const searchSpy = jest.spyOn(configurationService, 'findConfigurationBySearchCriteria')

      actions$.next(ConfigurationSearchActions.deleteConfigurationSucceeded())

      effects.refreshSearchAfterDelete$.subscribe(() => {
        expect(searchSpy).toHaveBeenCalledWith(customCriteria)
        done()
      })
    })
  })

  describe('deleteButtonClicked$', () => {
    const mockConfiguration = {
      id: 'test-123',
      name: 'Test Context',
      description: 'Test Description'
    }

    const mockResults = [mockConfiguration, { id: 'other-id', name: 'Other Context' }]

    beforeEach(() => {
      store.overrideSelector(configurationSearchSelectors.selectResults, mockResults)
      store.refreshState()
    })

    it('should open confirmation dialog and dispatch deleteConfigurationSucceeded on successful delete', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: null
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      configurationService.deleteConfiguration.mockReturnValue(of({}) as never)

      const messageSuccessSpy = jest.spyOn(mockMessageService, 'success')

      actions$.next(ConfigurationSearchActions.deleteConfigurationButtonClicked({ id: 'test-123' }))

      effects.deleteButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(ConfigurationSearchActions.deleteConfigurationSucceeded.type)
        expect(configurationService.deleteConfiguration).toHaveBeenCalledWith('test-123')
        expect(messageSuccessSpy).toHaveBeenCalledWith({
          summaryKey: 'CONFIGURATION_DELETE.SUCCESS'
        })
        done()
      })
    });

    [
      {
        desc: 'should dispatch deleteConfigurationCancelled when dialog is cancelled',
        dialogResult: { button: 'secondary', result: null }
      },
      {
        desc: 'should dispatch deleteConfigurationCancelled when dialog result is null',
        dialogResult: null
      }
    ].forEach(({ desc, dialogResult }) => {
      it(desc, (done) => {
        portalDialogService.openDialog.mockReturnValue(of(dialogResult) as never)
        actions$.next(ConfigurationSearchActions.deleteConfigurationButtonClicked({ id: 'test-123' }))
        effects.deleteButtonClicked$.subscribe((action) => {
          expect(action.type).toEqual(ConfigurationSearchActions.deleteConfigurationCancelled.type)
          expect(configurationService.deleteConfiguration).not.toHaveBeenCalled()
          done()
        })
      })
    })

    it('should dispatch deleteConfigurationFailed when API call fails', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: null
      }
      const mockError = 'Delete failed'

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      configurationService.deleteConfiguration.mockReturnValue(throwError(() => mockError))

      const messageErrorSpy = jest.spyOn(mockMessageService, 'error')

      actions$.next(ConfigurationSearchActions.deleteConfigurationButtonClicked({ id: 'test-123' }))

      effects.deleteButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(ConfigurationSearchActions.deleteConfigurationFailed.type)
        expect(action).toEqual(ConfigurationSearchActions.deleteConfigurationFailed({ error: mockError }))
        expect(messageErrorSpy).toHaveBeenCalledWith({
          summaryKey: 'CONFIGURATION_DELETE.ERROR'
        })
        done()
      })
    })

    it('should pass correct item to dialog and use correct dialog parameters', (done) => {
      const mockDialogResult = {
        button: 'secondary',
        result: null
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      actions$.next(ConfigurationSearchActions.deleteConfigurationButtonClicked({ id: 'test-123' }))

      effects.deleteButtonClicked$.subscribe(() => {
        expect(portalDialogService.openDialog).toHaveBeenCalledWith(
          'CONFIGURATION_DELETE.HEADER',
          'CONFIGURATION_DELETE.MESSAGE',
          {
            key: 'CONFIGURATION_DELETE.CONFIRM',
            icon: expect.anything()
          },
          {
            key: 'CONFIGURATION_DELETE.CANCEL',
            icon: expect.anything()
          }
        )
        done()
      })
    })

    it('should handle case when item to delete is not found', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: null
      }

      const emptyResults = [{ id: 'other-id', name: 'Other Context' }]
      store.overrideSelector(configurationSearchSelectors.selectResults, emptyResults)
      store.refreshState()

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      const messageErrorSpy = jest.spyOn(mockMessageService, 'error')

      effects.deleteButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(ConfigurationSearchActions.deleteConfigurationFailed.type)
        expect(messageErrorSpy).toHaveBeenCalledWith({
          summaryKey: 'CONFIGURATION_DELETE.ERROR'
        })
        done()
      })

      actions$.next(ConfigurationSearchActions.deleteConfigurationButtonClicked({ id: 'non-existent-id' }))
    })

    it('should find correct item to delete based on action id', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: null
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)
      configurationService.deleteConfiguration.mockReturnValue(of({}) as never)

      actions$.next(ConfigurationSearchActions.deleteConfigurationButtonClicked({ id: 'test-123' }))

      effects.deleteButtonClicked$.subscribe(() => {
        expect(configurationService.deleteConfiguration).toHaveBeenCalledWith('test-123')
        done()
      })
    })
  })

  describe('createButtonClicked$', () => {
    it('should open create dialog with correct parameters', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: { name: 'New AI Context', description: 'Test description' }
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)
      configurationService.createConfiguration.mockReturnValue(of({}) as never)

      effects.createButtonClicked$.subscribe(() => {
        expect(portalDialogService.openDialog).toHaveBeenCalledWith(
          'CONFIGURATION_CREATE_UPDATE.CREATE.HEADER',
          {
            type: ConfigurationCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: {}
              }
            }
          },
          'CONFIGURATION_CREATE_UPDATE.CREATE.FORM.SAVE',
          'CONFIGURATION_CREATE_UPDATE.CREATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
        done()
      })

      actions$.next(ConfigurationSearchActions.createConfigurationButtonClicked())
    })

    it('should create AI context and dispatch success action when dialog returns primary button with result', (done) => {
      const mockConfigurationData = { name: 'New AI Context', description: 'Test description' }
      const mockDialogResult = {
        button: 'primary',
        result: mockConfigurationData
      }
      const expectedCreateRequest = {
        ...mockConfigurationData
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)
      configurationService.createConfiguration.mockReturnValue(of({}) as never)

      const messageSuccessSpy = jest.spyOn(mockMessageService, 'success')

      effects.createButtonClicked$.subscribe((action) => {
        expect(configurationService.createConfiguration).toHaveBeenCalledWith(expectedCreateRequest)
        expect(messageSuccessSpy).toHaveBeenCalledWith({
          summaryKey: 'CONFIGURATION_CREATE_UPDATE.CREATE.SUCCESS'
        })
        expect(action).toEqual(ConfigurationSearchActions.createConfigurationSucceeded())
        done()
      })

      actions$.next(ConfigurationSearchActions.createConfigurationButtonClicked())
    });

    [
      {
        desc: 'should dispatch cancelled action when dialog is closed without result',
        dialogResult: null
      },
      {
        desc: 'should dispatch cancelled action when dialog secondary button is clicked',
        dialogResult: { button: 'secondary', result: { name: 'Test', description: 'Test' } }
      }
    ].forEach(({ desc, dialogResult }) => {
      it(desc, (done) => {
        portalDialogService.openDialog.mockReturnValue(of(dialogResult) as never)
        effects.createButtonClicked$.subscribe((action) => {
          expect(action).toEqual(ConfigurationSearchActions.createConfigurationCancelled())
          expect(configurationService.createConfiguration).not.toHaveBeenCalled()
          done()
        })
        actions$.next(ConfigurationSearchActions.createConfigurationButtonClicked())
      })
    })

    it('should handle error when dialog result is missing despite primary button', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: undefined
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      const messageErrorSpy = jest.spyOn(mockMessageService, 'error')

      effects.createButtonClicked$.subscribe((action) => {
        expect(messageErrorSpy).toHaveBeenCalledWith({
          summaryKey: 'CONFIGURATION_CREATE_UPDATE.CREATE.ERROR'
        })
        expect(action).toEqual(
          ConfigurationSearchActions.createConfigurationFailed({
            error: expect.any(Error)
          })
        )
        done()
      })

      actions$.next(ConfigurationSearchActions.createConfigurationButtonClicked())
    })

    it('should handle API error during creation', (done) => {
      const mockConfigurationData = { name: 'New AI Context', description: 'Test description' }
      const mockDialogResult = {
        button: 'primary',
        result: mockConfigurationData
      }
      const apiError = 'API Error'

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)
      configurationService.createConfiguration.mockReturnValue(throwError(() => apiError) as never)

      const messageErrorSpy = jest.spyOn(mockMessageService, 'error')

      effects.createButtonClicked$.subscribe((action) => {
        expect(messageErrorSpy).toHaveBeenCalledWith({
          summaryKey: 'CONFIGURATION_CREATE_UPDATE.CREATE.ERROR'
        })
        expect(action).toEqual(
          ConfigurationSearchActions.createConfigurationFailed({
            error: apiError
          })
        )
        done()
      })

      actions$.next(ConfigurationSearchActions.createConfigurationButtonClicked())
    })
  })

  describe('exportData$', () => {
    [
      {
        desc: 'should handle export with empty displayed columns',
        viewModel: {
          columns: [],
          searchCriteria: {},
          results: [
            { id: '1', name: 'Context 1', description: 'Description 1', imagePath: '' }
          ],
          displayedColumns: [],
          resultComponentState: { displayedColumns: undefined },
          searchHeaderComponentState: null,
          diagramComponentState: null,
          chartVisible: false,
          searchLoadingIndicator: false,
          searchExecuted: true
        }
      },
      {
        desc: 'should handle export with null resultComponentState',
        viewModel: {
          columns: [],
          searchCriteria: {},
          results: [
            { id: '1', name: 'Context 1', description: 'Description 1', imagePath: '' }
          ],
          displayedColumns: [],
          resultComponentState: null,
          searchHeaderComponentState: null,
          diagramComponentState: null,
          chartVisible: false,
          searchLoadingIndicator: false,
          searchExecuted: true
        }
      }
    ].forEach(({ desc, viewModel }) => {
      it(desc, (done) => {
        store.overrideSelector(selectConfigurationSearchViewModel, viewModel)
        effects.exportData$.subscribe(() => {
          expect(exportDataService.exportCsv).toHaveBeenCalledWith(
            [],
            viewModel.results,
            'Configuration.csv'
          )
          done()
        })
        actions$.next(ConfigurationSearchActions.exportButtonClicked())
      })
    })

    it('should export CSV with correct parameters when export button is clicked', (done) => {
      const mockColumns = [
        { field: 'name', header: 'Name' },
        { field: 'description', header: 'Description' }
      ]
      const mockResults = [
        { id: '1', name: 'Context 1', description: 'Description 1' },
        { id: '2', name: 'Context 2', description: 'Description 2' }
      ]
      const mockViewModel = {
        resultComponentState: {
          displayedColumns: mockColumns
        },
        results: mockResults
      } as unknown as ConfigurationSearchViewModel

      store.overrideSelector(selectConfigurationSearchViewModel, mockViewModel)

      effects.exportData$.subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(
          mockColumns,
          mockResults,
          'Configuration.csv'
        )
        done()
      })

      actions$.next(ConfigurationSearchActions.exportButtonClicked())
    })

    it('should handle export with empty results', (done) => {
      const mockColumns = [
        { field: 'name', header: 'Name' },
        { field: 'description', header: 'Description' }
      ]
      const mockViewModel = {
        resultComponentState: {
          displayedColumns: mockColumns
        },
        results: []
      } as unknown as ConfigurationSearchViewModel

      store.overrideSelector(selectConfigurationSearchViewModel, mockViewModel)

      effects.exportData$.subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(
          mockColumns,
          [],
          'Configuration.csv'
        )
        done()
      })

      actions$.next(ConfigurationSearchActions.exportButtonClicked())
    })
  })

  describe('displayError$', () => {
    it('should display error message when configurationSearchResultsLoadingFailed action is dispatched', (done) => {
      const messageErrorSpy = jest.spyOn(mockMessageService, 'error')
      effects.displayError$.subscribe(() => {
        expect(messageErrorSpy).toHaveBeenCalledWith({
          summaryKey: 'CONFIGURATION_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
        })
        done()
      })

      actions$.next(ConfigurationSearchActions.configurationSearchResultsLoadingFailed({ error: 'Test error' }))
    })

    it('should not display error message for actions not in errorMessages array', (done) => {
      const messageErrorSpy = jest.spyOn(mockMessageService, 'error')

      setTimeout(() => {
        expect(messageErrorSpy).not.toHaveBeenCalled()
        done()
      }, 0)

      actions$.next(ConfigurationSearchActions.resetButtonClicked())
    })
  })
})
