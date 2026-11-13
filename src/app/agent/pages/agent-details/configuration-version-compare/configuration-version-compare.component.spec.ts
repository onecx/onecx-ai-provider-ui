import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { AgentConfiguration, AgentConfigurationVersion } from 'src/app/shared/generated'
import { AgentConfigurationVersionCompareComponent } from './configuration-version-compare.component'

describe('AgentConfigurationVersionCompareComponent', () => {
  let fixture: ComponentFixture<AgentConfigurationVersionCompareComponent>
  let component: AgentConfigurationVersionCompareComponent

  const versions = [
    { id: 'v2', name: 'v2.0' },
    { id: 'v1', name: 'v1.0' }
  ] as AgentConfigurationVersion[]

  const configV1 = { schemaVersion: '1.0', model: { name: 'gpt-4' } } as AgentConfiguration
  const configV2 = { schemaVersion: '1.0', model: { name: 'gpt-5' } } as AgentConfiguration

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AgentConfigurationVersionCompareComponent,
        TranslateTestingModule.withTranslations({
          de: require('../../../../../assets/i18n/de.json'),
          en: require('../../../../../assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(AgentConfigurationVersionCompareComponent)
    component = fixture.componentInstance
  })

  it('defaults to the two newest versions, comparing the older one against the newer one', () => {
    component.versions = versions
    component.details = { v1: configV1, v2: configV2 }
    component.ngOnChanges()

    expect(component.leftId).toBe('v1')
    expect(component.rightId).toBe('v2')
  })

  it('shows only changed rows by default', () => {
    component.versions = versions
    component.details = { v1: configV1, v2: configV2 }
    component.ngOnChanges()

    expect(component.visibleRows.map((row) => row.path)).toEqual(['model.name'])
    expect(component.changedCount).toBe(1)
  })

  it('does not request details from ngOnChanges; the parent prefetches the defaults', () => {
    const requested: string[] = []
    component.detailRequested.subscribe((id: string) => requested.push(id))
    component.versions = versions
    component.details = {}
    component.ngOnChanges()

    expect(requested).toEqual([])
  })

  it('does not request details that are already loaded', () => {
    const requested: string[] = []
    component.detailRequested.subscribe((id: string) => requested.push(id))
    component.versions = versions
    component.details = { v1: configV1, v2: configV2 }
    component.ngOnChanges()

    expect(requested).toEqual([])
  })

  it('requests missing details and recalculates the diff when the selection changes', () => {
    const requested: string[] = []
    component.detailRequested.subscribe((id: string) => requested.push(id))
    component.versions = versions
    component.details = { v1: configV1 }
    component.ngOnChanges()
    expect(component.rows).toEqual([])

    component.details = { v1: configV1 }
    component.rightId = 'v2'
    component.onSelectionChange()
    expect(requested).toEqual(['v2'])

    component.details = { v1: configV1, v2: configV2 }
    component.onSelectionChange()

    expect(requested).toEqual(['v2'])
    expect(component.changedCount).toBe(1)
  })

  it('shows every row when showOnlyChanged is disabled', () => {
    component.versions = versions
    component.details = { v1: configV1, v2: configV2 }
    component.ngOnChanges()
    component.showOnlyChanged = false

    expect(component.visibleRows.length).toBeGreaterThanOrEqual(component.changedCount)
    expect(component.visibleRows.map((row) => row.path)).toContain('schemaVersion')
  })

  it('keeps the current selection when both selected versions are still listed', () => {
    component.versions = versions
    component.details = { v1: configV1, v2: configV2 }
    component.leftId = 'v2'
    component.rightId = 'v1'
    component.ngOnChanges()

    expect(component.leftId).toBe('v2')
    expect(component.rightId).toBe('v1')
  })

  it('compares the only version against itself when a single version exists', () => {
    component.versions = [versions[0]]
    component.details = { v2: configV2 }
    component.ngOnChanges()

    expect(component.leftId).toBe('v2')
    expect(component.rightId).toBe('v2')
    expect(component.changedCount).toBe(0)
    expect(component.visibleRows).toEqual([])
  })

  it('clears the selection and rows when no versions are listed', () => {
    const requested: string[] = []
    component.detailRequested.subscribe((id: string) => requested.push(id))
    component.versions = []
    component.ngOnChanges()

    expect(component.leftId).toBeUndefined()
    expect(component.rightId).toBeUndefined()
    expect(component.rows).toEqual([])
    expect(requested).toEqual([])
  })

  it('replaces a selection that is no longer listed', () => {
    component.versions = versions
    component.details = { v1: configV1, v2: configV2 }
    component.leftId = 'removed'
    component.rightId = 'removed'
    component.ngOnChanges()

    expect(component.leftId).toBe('v1')
    expect(component.rightId).toBe('v2')
  })

  it('uses the version ID as label when a version has no name and skips versions without ID', () => {
    component.versions = [{ id: 'v3' } as AgentConfigurationVersion, { name: 'orphan' } as AgentConfigurationVersion]
    component.details = {}
    component.ngOnChanges()

    expect(component.options).toEqual([{ label: 'v3', value: 'v3' }])
  })

  it('shows no rows while only one side of the comparison is loaded', () => {
    component.versions = versions
    component.details = { v2: configV2 }
    component.ngOnChanges()

    expect(component.rows).toEqual([])
    expect(component.changedCount).toBe(0)
  })
})
