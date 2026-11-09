import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/angular-accelerator'

import { Model, Provider, ProviderType } from 'src/app/shared/generated'
import { ModelCreateUpdateViewModel } from './model-create-update.viewmodel'

type ModelApi = 'chat-completions' | 'responses'

interface ModelConfiguration {
  api?: ModelApi
  reasoningEffort?: string
}

@Component({
  selector: 'app-model-create-update',
  imports: [TranslateModule, ReactiveFormsModule, FloatLabelModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './model-create-update.component.html'
})
export class ModelCreateUpdateComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<Model | undefined>,
    DialogButtonClicked<ModelCreateUpdateComponent>,
    OnInit
{
  @Input() vm: ModelCreateUpdateViewModel = { model: {} }

  readonly apiOptions: ModelApi[] = ['chat-completions', 'responses']
  readonly formGroup: FormGroup
  readonly primaryButtonEnabled = new EventEmitter<boolean>()
  dialogResult: Model | undefined
  hasLegacyModelConfigWarning = false

  constructor() {
    this.formGroup = new FormGroup(
      {
        modelIdentifier: new FormControl('', [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(255)
        ]),
        api: new FormControl<ModelApi>('chat-completions'),
        reasoningEffort: new FormControl('')
      },
      { validators: () => (this.configurationTooLong ? { modelConfigTooLong: true } : null) }
    )
    this.formGroup.statusChanges.subscribe(() => this.updatePrimaryButton())
  }

  get isOpenAi(): boolean {
    return this.provider?.type === ProviderType.Openai
  }

  get provider(): Provider | undefined {
    return this.vm.provider ?? this.vm.model.provider
  }

  get serializedModelConfigLength(): number {
    return this.isOpenAi ? this.serializeModelConfig().length : 0
  }

  get configurationTooLong(): boolean {
    return this.isOpenAi && this.serializedModelConfigLength > 255
  }

  ngOnInit(): void {
    const model = this.vm.model ?? {}
    this.formGroup.patchValue({
      modelIdentifier: model.modelIdentifier ?? model.name ?? '',
      ...(this.isOpenAi ? this.parseModelConfig(model.modelConfig) : {})
    })
    this.updatePrimaryButton()
  }

  ocxDialogButtonClicked(): void {
    if (this.formGroup.invalid) {
      return
    }

    const modelIdentifier = String(this.formGroup.get('modelIdentifier')?.value ?? '').trim()
    if (!modelIdentifier) {
      return
    }

    this.dialogResult = {
      ...this.vm.model,
      name: modelIdentifier,
      modelIdentifier,
      ...(this.isOpenAi ? { modelConfig: this.serializeModelConfig() } : {})
    }
  }

  private parseModelConfig(modelConfig?: string): Partial<{ api: ModelApi; reasoningEffort: string }> {
    this.hasLegacyModelConfigWarning = false
    if (!modelConfig?.trim()) {
      return { api: 'chat-completions', reasoningEffort: '' }
    }

    try {
      const parsed: unknown = JSON.parse(modelConfig)
      const config = this.validateModelConfig(parsed)
      if (!config || this.hasDuplicateConfigKeys(modelConfig)) {
        this.hasLegacyModelConfigWarning = true
        return { api: 'chat-completions', reasoningEffort: '' }
      }
      return {
        api: config.api ?? 'chat-completions',
        reasoningEffort: config.reasoningEffort?.trim() ?? ''
      }
    } catch {
      this.hasLegacyModelConfigWarning = true
      return { api: 'chat-completions', reasoningEffort: '' }
    }
  }

  private hasDuplicateConfigKeys(json: string): boolean {
    const keys = new Set<string>()
    // JSON.parse has checked syntax. Scan whole string tokens so escaped quotes and key spellings are decoded safely.
    for (let index = 0; index < json.length; index++) {
      if (json[index] !== '"') {
        continue
      }
      const start = index++
      while (index < json.length && json[index] !== '"') {
        index += json[index] === '\\' ? 2 : 1
      }
      if (
        json
          .slice(index + 1)
          .trimStart()
          .startsWith(':')
      ) {
        const key: string = JSON.parse(json.slice(start, index + 1))
        if (keys.has(key)) {
          return true
        }
        keys.add(key)
      }
    }
    return false
  }

  private validateModelConfig(value: unknown): ModelConfiguration | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined
    }
    const entries = value as Record<string, unknown>
    if (Object.keys(entries).some((key) => key !== 'api' && key !== 'reasoningEffort')) {
      return undefined
    }
    if (entries['api'] !== undefined && entries['api'] !== 'chat-completions' && entries['api'] !== 'responses') {
      return undefined
    }
    if (entries['reasoningEffort'] !== undefined && typeof entries['reasoningEffort'] !== 'string') {
      return undefined
    }
    return {
      ...(entries['api'] === undefined ? {} : { api: entries['api'] as ModelApi }),
      ...(entries['reasoningEffort'] === undefined ? {} : { reasoningEffort: entries['reasoningEffort'] as string })
    }
  }

  private serializeModelConfig(): string {
    const api = this.formGroup.get('api')?.value as ModelApi
    const reasoningEffort = String(this.formGroup.get('reasoningEffort')?.value ?? '').trim()
    const config: ModelConfiguration = {
      ...(api === 'responses' ? { api } : {}),
      ...(reasoningEffort ? { reasoningEffort } : {})
    }
    return JSON.stringify(config)
  }

  private updatePrimaryButton(): void {
    this.primaryButtonEnabled.emit(this.formGroup.valid)
  }
}
