import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { map, startWith } from 'rxjs'

import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/angular-accelerator'

@Component({
  selector: 'app-agent-configuration-version-publish',
  imports: [TranslateModule, ReactiveFormsModule, FloatLabelModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agent-configuration-version-publish.component.html'
})
export class AgentConfigurationVersionPublishComponent
  implements
    OnInit,
    DialogPrimaryButtonDisabled,
    DialogResult<string | undefined>,
    DialogButtonClicked<AgentConfigurationVersionPublishComponent>
{
  @Input() suggestedName = ''
  readonly nameControl = new FormControl('', [Validators.required, Validators.maxLength(255), Validators.pattern(/\S/)])
  readonly formGroup = new FormGroup({ name: this.nameControl })
  readonly primaryButtonEnabled = new EventEmitter<boolean>()
  dialogResult: string | undefined = undefined

  constructor() {
    this.formGroup.statusChanges
      .pipe(
        startWith(this.formGroup.status),
        map((status) => status === 'VALID')
      )
      .subscribe(this.primaryButtonEnabled)
  }

  ngOnInit() {
    this.nameControl.setValue(this.suggestedName)
  }

  ocxDialogButtonClicked() {
    this.dialogResult = this.nameControl.value?.trim()
  }
}
