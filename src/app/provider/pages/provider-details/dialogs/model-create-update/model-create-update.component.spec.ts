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

    component.ocxDialogButtonClicked()

    expect(component.dialogResult).toEqual({
      modelIdentifier: 'gpt-4o',
      name: 'gpt-4o',
      modelConfig: '{}'
    })
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

  it('does not allow a whitespace-only model identifier to be saved', () => {
    const component = createComponent()
    component.formGroup.patchValue({ modelIdentifier: '   ' })

    component.ocxDialogButtonClicked()

    expect(component.formGroup.valid).toBe(false)
    expect(component.dialogResult).toBeUndefined()
  })

  it('omits the default API when serializing an explicit reasoning effort', () => {
    const component = createComponent()
    component.formGroup.patchValue({ modelIdentifier: 'o3', reasoningEffort: ' none ' })

    component.ocxDialogButtonClicked()

    expect(component.dialogResult?.modelConfig).toBe('{"reasoningEffort":"none"}')
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
    expect(component.hasLegacyModelConfigWarning).toBe(false)

    component.ocxDialogButtonClicked()

    expect(component.dialogResult).toEqual({
      id: 'm1',
      name: 'new-name',
      modelIdentifier: 'new-name',
      modelConfig: 'legacy payload'
    })
  })
})
