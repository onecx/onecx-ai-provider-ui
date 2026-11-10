import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { AgentConfigurationVersionPublishComponent } from './agent-configuration-version-publish.component'

describe('AgentConfigurationVersionPublishComponent', () => {
  let component: AgentConfigurationVersionPublishComponent
  let fixture: ComponentFixture<AgentConfigurationVersionPublishComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AgentConfigurationVersionPublishComponent,
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(AgentConfigurationVersionPublishComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should keep the primary action disabled for empty and whitespace-only names', () => {
    const enabled: boolean[] = []
    component.primaryButtonEnabled.subscribe((value) => enabled.push(value))

    component.nameControl.setValue('')
    expect(enabled.at(-1)).toBe(false)

    component.nameControl.setValue('   ')
    expect(enabled.at(-1)).toBe(false)

    component.nameControl.setValue('Release 1')
    expect(enabled.at(-1)).toBe(true)
  })

  it('should trim the name submitted from the dialog', () => {
    component.nameControl.setValue('  Release 1  ')
    component.ocxDialogButtonClicked()

    expect(component.dialogResult).toBe('Release 1')
  })

  it('should declare dialogResult as an instance property so the dialog host copies the submitted name', () => {
    expect('dialogResult' in component).toBe(true)
  })

  it('should reject names longer than 255 characters', () => {
    component.nameControl.setValue('x'.repeat(256))

    expect(component.nameControl.invalid).toBe(true)
  })

  it('should prefill the name field with the suggested name', () => {
    const suggested = TestBed.createComponent(AgentConfigurationVersionPublishComponent)
    suggested.componentInstance.suggestedName = 'v4.0'
    suggested.detectChanges()

    expect(suggested.componentInstance.nameControl.value).toBe('v4.0')
  })
})
