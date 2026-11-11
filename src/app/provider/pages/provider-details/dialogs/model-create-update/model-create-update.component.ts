import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { SelectModule } from 'primeng/select'
import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/angular-accelerator'

import { Model, Provider, ProviderType } from 'src/app/shared/generated'
import { ModelCreateUpdateViewModel } from './model-create-update.viewmodel'
import { ModelApi, parseModelConfig, serializeModelConfig } from './model-config.utils'
import { PrimeSelectDescribedByDirective } from './prime-select-describedby.directive'

@Component({
  selector: 'app-model-create-update',
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    FloatLabelModule,
    InputTextModule,
    SelectModule,
    PrimeSelectDescribedByDirective
  ],
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

  readonly apiOptions = [
    { label: 'PROVIDER_DETAILS.MODELS.API_OPTIONS.chat-completions', value: 'chat-completions' as const },
    { label: 'PROVIDER_DETAILS.MODELS.API_OPTIONS.responses', value: 'responses' as const }
  ]
  readonly formGroup: FormGroup
  readonly primaryButtonEnabled = new EventEmitter<boolean>()
  dialogResult: Model | undefined = undefined
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
    return this.isOpenAi ? this.serializeCurrentModelConfig().length : 0
  }

  get configurationTooLong(): boolean {
    return this.isOpenAi && this.serializedModelConfigLength > 255
  }

  get modelIdentifierInvalid(): boolean {
    const identifier = String(this.formGroup.controls['modelIdentifier'].value ?? '')
    return !identifier.trim() || identifier.length > 255
  }

  get reasoningEffortDescribedBy(): string | null {
    const descriptions = [
      this.hasLegacyModelConfigWarning ? 'model_config_legacy_warning' : '',
      this.configurationTooLong ? 'model_config_too_long' : ''
    ].filter((description) => description.length > 0)
    return descriptions.length > 0 ? descriptions.join(' ') : null
  }

  ngOnInit(): void {
    const model = this.vm.model
    const parsedConfig = parseModelConfig(model.modelConfig, this.isOpenAi)
    this.hasLegacyModelConfigWarning = parsedConfig.hasLegacyWarning
    this.formGroup.patchValue({
      modelIdentifier: model.modelIdentifier ?? model.name ?? '',
      api: parsedConfig.api,
      reasoningEffort: parsedConfig.reasoningEffort
    })
    this.updatePrimaryButton()
  }

  ocxDialogButtonClicked(): void {
    if (this.formGroup.invalid) {
      return
    }

    const modelIdentifier = String(this.formGroup.controls['modelIdentifier'].value).trim()
    this.dialogResult = {
      ...this.vm.model,
      name: this.vm.model.name ?? modelIdentifier,
      modelIdentifier,
      ...(this.isOpenAi
        ? {
            modelConfig: this.serializeCurrentModelConfig()
          }
        : {})
    }
  }

  private serializeCurrentModelConfig(): string {
    return serializeModelConfig(
      this.formGroup.get('api')?.value as ModelApi,
      String(this.formGroup.controls['reasoningEffort'].value ?? '')
    )
  }

  private updatePrimaryButton(): void {
    this.primaryButtonEnabled.emit(this.formGroup.valid)
  }
}
