import { TestBed } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { Model, Provider, ProviderType } from 'src/app/shared/generated'
import { ModelCreateUpdateComponent } from './model-create-update.component'

describe('ModelCreateUpdateComponent', () => {
  const createComponent = (model: Model = {}, providerType = ProviderType.Openai) => {
    const component = new ModelCreateUpdateComponent()
    component.vm = {
      model,
      provider: { type: providerType } as Provider
    }
    component.ngOnInit()
    return component
  }

  it('defaults OpenAI models to Chat Completions and omits blank reasoning effort', () => {
    const component = createComponent({ modelIdentifier: 'gpt-4o' })

    expect(component.formGroup.get('api')?.value).toBe('chat-completions')
    expect(component.formGroup.get('reasoningEffort')?.value).toBe('')
    expect(component.reasoningEffortDescribedBy).toBeNull()

    component.ocxDialogButtonClicked()

    expect(component.dialogResult).toEqual({
      modelIdentifier: 'gpt-4o',
      name: 'gpt-4o',
      modelConfig: '{}'
    })
  })

  it('does not allow a model identifier longer than 255 characters', () => {
    const component = createComponent()
    component.formGroup.patchValue({ modelIdentifier: 'x'.repeat(256) })

    component.ocxDialogButtonClicked()

    expect(component.formGroup.valid).toBe(false)
    expect(component.modelIdentifierInvalid).toBe(true)
    expect(component.dialogResult).toBeUndefined()
  })

  it('serializes Responses and trims a nonblank reasoning effort', () => {
    const component = createComponent()
    component.formGroup.patchValue({
      modelIdentifier: '  gpt-5  ',
      api: 'responses',
      reasoningEffort: '  medium  '
    })
    component.ocxDialogButtonClicked()

    expect(component.dialogResult).toEqual({
      modelIdentifier: 'gpt-5',
      name: 'gpt-5',
      modelConfig: '{"api":"responses","reasoningEffort":"medium"}'
    })
  })

  it('preserves the existing model name and unrelated values when editing model settings', () => {
    const component = createComponent({
      id: 'm1',
      name: 'Imported display name',
      modelIdentifier: 'gpt-4',
      provider: { id: 'p1' },
      communicationMode: 'ASYNC'
    } as Model)
    component.formGroup.patchValue({ api: 'responses', reasoningEffort: ' high ' })

    component.ocxDialogButtonClicked()

    expect(component.dialogResult).toEqual({
      id: 'm1',
      name: 'Imported display name',
      modelIdentifier: 'gpt-4',
      modelConfig: '{"api":"responses","reasoningEffort":"high"}',
      provider: { id: 'p1' },
      communicationMode: 'ASYNC'
    })

    component.formGroup.patchValue({ modelIdentifier: 'gpt-4.1' })
    component.ocxDialogButtonClicked()

    expect(component.dialogResult).toEqual({
      id: 'm1',
      name: 'Imported display name',
      modelIdentifier: 'gpt-4.1',
      modelConfig: '{"api":"responses","reasoningEffort":"high"}',
      provider: { id: 'p1' },
      communicationMode: 'ASYNC'
    })
  })

  it('does not allow a whitespace-only model identifier to be saved', () => {
    const component = createComponent()
    component.formGroup.patchValue({ modelIdentifier: '   ' })

    component.ocxDialogButtonClicked()

    expect(component.formGroup.valid).toBe(false)
    expect(component.dialogResult).toBeUndefined()
  })

  it('treats a null model identifier as invalid', () => {
    const component = createComponent()
    component.formGroup.controls['modelIdentifier'].setValue(null)

    expect(component.modelIdentifierInvalid).toBe(true)
    expect(component.formGroup.valid).toBe(false)
  })

  it('omits the default API when serializing an explicit reasoning effort', () => {
    const component = createComponent()
    component.formGroup.patchValue({ modelIdentifier: 'o3', reasoningEffort: ' none ' })

    component.ocxDialogButtonClicked()

    expect(component.dialogResult?.modelConfig).toBe('{"reasoningEffort":"none"}')
  })

  it('omits a null reasoning effort when serializing', () => {
    const component = createComponent({ modelIdentifier: 'gpt-4' })
    component.formGroup.controls['reasoningEffort'].setValue(null)

    component.ocxDialogButtonClicked()

    expect(component.dialogResult?.modelConfig).toBe('{}')
  })

  it('uses the existing name when model identifier is absent', () => {
    const component = createComponent({ id: 'm1', name: 'imported-model' })

    expect(component.formGroup.get('modelIdentifier')?.value).toBe('imported-model')

    component.ocxDialogButtonClicked()

    expect(component.dialogResult?.name).toBe('imported-model')
    expect(component.dialogResult?.modelIdentifier).toBe('imported-model')
  })

  it.each([
    ['malformed JSON', '{'],
    ['unsupported API', '{"api":"other"}'],
    ['unknown keys', '{"temperature":0.2}'],
    ['unsupported API type', '{"api":2}'],
    ['wrong value types', '{"reasoningEffort":1}'],
    ['non-object JSON', '[]']
  ])('warns and uses defaults for legacy %s', (_description, modelConfig) => {
    const component = createComponent({ modelIdentifier: 'legacy', modelConfig })

    expect(component.hasLegacyModelConfigWarning).toBe(true)
    expect(component.formGroup.get('api')?.value).toBe('chat-completions')
    expect(component.formGroup.get('reasoningEffort')?.value).toBe('')

    component.ocxDialogButtonClicked()
    expect(component.dialogResult?.modelConfig).toBe('{}')
  })

  it('renders a warning and default controls for unsupported legacy configuration, then saves supported settings', async () => {
    await TestBed.configureTestingModule({
      imports: [
        ModelCreateUpdateComponent,
        TranslateTestingModule.withTranslations({
          en: {
            PROVIDER_DETAILS: {
              MODELS: {
                LEGACY_CONFIG_WARNING: 'Legacy configuration is not applied',
                IDENTIFIER_VALIDATION:
                  'A non-blank model identifier of at most 255 characters is required to enable Save.',
                API_OPTIONS: { 'chat-completions': 'Chat Completions', responses: 'Responses' }
              }
            }
          }
        })
      ]
    }).compileComponents()
    const fixture = TestBed.createComponent(ModelCreateUpdateComponent)
    fixture.componentRef.setInput('vm', {
      model: {
        modelIdentifier: 'legacy',
        modelConfig: '{"temperature":0.2}'
      },
      provider: { type: ProviderType.Openai }
    })
    fixture.detectChanges()
    const element: HTMLElement = fixture.nativeElement
    expect(element.querySelector('#model_config_legacy_warning')?.textContent).toContain(
      'Legacy configuration is not applied'
    )
    expect(element.querySelector('#model_api')).not.toBeNull()
    expect(element.querySelector('#model_api')?.getAttribute('aria-describedby')).toBe('model_config_legacy_warning')
    expect(fixture.componentInstance.formGroup.get('api')?.value).toBe('chat-completions')
    expect(element.querySelector('#model_reasoning_effort')?.getAttribute('aria-describedby')).toBe(
      'model_config_legacy_warning'
    )
    expect(element.querySelector('#model_identifier_validation')).toBeNull()
    expect(element.querySelector<HTMLInputElement>('#model_reasoning_effort')?.value).toBe('')

    fixture.componentInstance.ocxDialogButtonClicked()
    expect(fixture.componentInstance.dialogResult?.modelConfig).toBe('{}')

    fixture.componentInstance.formGroup.patchValue({ modelIdentifier: '   ' })
    fixture.detectChanges()
    expect(fixture.componentInstance.formGroup.valid).toBe(false)
    expect(element.querySelector('#model_identifier_validation')?.textContent).toContain('enable Save')
    expect(element.querySelector('#model_identifier')?.getAttribute('aria-describedby')).toBe(
      'model_identifier_validation'
    )
  })

  it('associates the configuration size error with its reasoning effort input', async () => {
    await TestBed.configureTestingModule({
      imports: [
        ModelCreateUpdateComponent,
        TranslateTestingModule.withTranslations({
          en: {
            PROVIDER_DETAILS: {
              MODELS: {
                API_OPTIONS: { 'chat-completions': 'Chat Completions', responses: 'Responses' },
                CONFIGURATION_TOO_LONG: 'Configuration exceeds the 255-character storage limit.',
                IDENTIFIER_VALIDATION:
                  'A non-blank model identifier of at most 255 characters is required to enable Save.'
              }
            }
          }
        })
      ]
    }).compileComponents()
    const fixture = TestBed.createComponent(ModelCreateUpdateComponent)
    fixture.componentRef.setInput('vm', {
      model: {
        modelIdentifier: 'gpt-4',
        modelConfig: '{"temperature":0.2}'
      },
      provider: { type: ProviderType.Openai }
    })
    fixture.detectChanges()
    fixture.componentInstance.formGroup.patchValue({ reasoningEffort: 'x'.repeat(234) })
    fixture.detectChanges()
    const element: HTMLElement = fixture.nativeElement

    expect(element.querySelector('#model_config_too_long')?.textContent).toContain('255-character')
    expect(element.querySelector('#model_reasoning_effort')?.getAttribute('aria-describedby')).toBe(
      'model_config_legacy_warning model_config_too_long'
    )
    expect(element.querySelector('#model_config_legacy_warning')).not.toBeNull()
    expect(fixture.componentInstance.formGroup.valid).toBe(false)
  })

  it.each([
    ['{"\\u0061pi":"responses","reasoning\\u0045ffort":"medium"}', '{"api":"responses","reasoningEffort":"medium"}'],
    [
      '{"api":"responses","reasoningEffort":"api: \\"responses\\", \\"api\\": \\"other\\""}',
      '{"api":"responses","reasoningEffort":"api: \\"responses\\", \\"api\\": \\"other\\""}'
    ],
    [
      '{"reasoningEffort":"colon: and backslash \\\\ and quote \\""}',
      '{"reasoningEffort":"colon: and backslash \\\\ and quote \\""}'
    ]
  ])('preserves escaped keys and string values when saving: %s', (modelConfig, saved) => {
    const component = createComponent({ modelIdentifier: 'model', modelConfig })
    expect(component.hasLegacyModelConfigWarning).toBe(false)
    component.ocxDialogButtonClicked()
    expect(component.dialogResult?.modelConfig).toBe(saved)
  })

  it('saves parsed OpenAI settings without repeated JSON keys', () => {
    const component = createComponent({
      modelIdentifier: 'model',
      modelConfig: '{"api":"chat-completions","api":"responses","reasoningEffort":"medium"}'
    })

    expect(component.hasLegacyModelConfigWarning).toBe(false)
    expect(component.formGroup.get('api')?.value).toBe('responses')

    component.ocxDialogButtonClicked()

    expect(component.dialogResult?.modelConfig).toBe('{"api":"responses","reasoningEffort":"medium"}')
  })

  it('preserves duplicate-key configuration for non-OpenAI providers without warning', () => {
    const modelConfig = '{"api":"chat-completions","api":"responses"}'
    const component = createComponent({ modelIdentifier: 'model', modelConfig }, ProviderType.Anthropic)
    expect(component.hasLegacyModelConfigWarning).toBe(false)
    component.ocxDialogButtonClicked()
    expect(component.dialogResult?.modelConfig).toBe(modelConfig)
  })

  it('reads supported configuration and omits default API on save', () => {
    const component = createComponent({
      modelIdentifier: 'o3',
      modelConfig: '{"api":"chat-completions","reasoningEffort":"medium"}'
    })

    expect(component.hasLegacyModelConfigWarning).toBe(false)
    expect(component.formGroup.get('api')?.value).toBe('chat-completions')
    expect(component.formGroup.get('reasoningEffort')?.value).toBe('medium')

    component.ocxDialogButtonClicked()
    expect(component.dialogResult?.modelConfig).toBe('{"reasoningEffort":"medium"}')
  })

  it('accepts a serialized configuration of exactly 255 characters', () => {
    const component = createComponent()
    component.formGroup.patchValue({
      modelIdentifier: 'model',
      reasoningEffort: 'x'.repeat(233)
    })

    expect(component.serializedModelConfigLength).toBe(255)
    expect(component.formGroup.valid).toBe(true)
  })

  it('rejects a serialized configuration longer than 255 characters', () => {
    const component = createComponent()
    component.formGroup.patchValue({
      modelIdentifier: 'model',
      reasoningEffort: 'x'.repeat(234)
    })

    expect(component.serializedModelConfigLength).toBe(256)
    expect(component.formGroup.valid).toBe(false)
    expect(component.configurationTooLong).toBe(true)
  })

  it('preserves non-OpenAI configuration when editing the identifier', () => {
    const component = createComponent(
      { id: 'm1', name: 'old-name', modelIdentifier: 'old-name', modelConfig: 'legacy payload' },
      ProviderType.Anthropic
    )
    component.formGroup.patchValue({ modelIdentifier: 'new-name' })

    expect(component.isOpenAi).toBe(false)
    expect(component.serializedModelConfigLength).toBe(0)
    expect(component.hasLegacyModelConfigWarning).toBe(false)

    component.ocxDialogButtonClicked()

    expect(component.dialogResult).toEqual({
      id: 'm1',
      name: 'old-name',
      modelIdentifier: 'new-name',
      modelConfig: 'legacy payload'
    })
  })
})
