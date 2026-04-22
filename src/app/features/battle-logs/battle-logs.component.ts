import {
  Component,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { TrainerStore } from '../../state/trainer.store';

@Component({
  selector: 'app-battle-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './battle-logs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BattleLogsComponent {

  private store = inject(TrainerStore);

  readonly logs = toSignal(this.store.logs$, { initialValue: [] });

  constructor() {
    this.store.startBattleLogStream();
  }
}