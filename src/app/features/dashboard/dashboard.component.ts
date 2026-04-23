/**
 * Acts as the main overview page,
 * showing key stats, recent activity, and quick navigation
 * to core features like battles, teams, and Pokédex.
*/


import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed
} from '@angular/core';

import { toSignal } from '@angular/core/rxjs-interop';

import { TrainerStore } from '../../state/trainer.store';
import { Trainer } from '../../interface/trainer.model';
import { Team } from '../../interface/team.model';
import { Battle } from '../../interface/battle.model';

import { TrainerProfileComponent } from '../trainer-profile/trainer-profile.component';
import { TeamsComponent } from '../teams/teams.component';
import { BattleLogsComponent } from '../battle-logs/battle-logs.component';
import { BattleDashboardComponent } from '../battle-dashboard/battle-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TrainerProfileComponent,
    TeamsComponent,
    BattleLogsComponent,
    BattleDashboardComponent
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {

  private store = inject(TrainerStore);

  private readonly TRAINER_ID = 1;

  private initialized = false;

  constructor() {
    if (this.initialized) return;
    this.initialized = true;

    this.store.loadTrainer(this.TRAINER_ID);
    this.store.loadTeams(this.TRAINER_ID);
    this.store.loadBattles(this.TRAINER_ID);

    this.store.startBattleLogStream();
  }

  // SIGNALS

  trainer = toSignal(this.store.trainer$, {
    initialValue: null as Trainer | null
  });

  teams = toSignal(this.store.teams$, {
    initialValue: [] as Team[]
  });

  battles = toSignal(this.store.battles$, {
    initialValue: [] as Battle[]
  });

  logs = toSignal(this.store.logs$, {
    initialValue: []
  });

  // DERIVED METRICS

  totalTeams = computed(() => this.teams().length);

  totalBattles = computed(() => this.battles().length);

  winRate = computed(() => {
    const battles = this.battles();
    if (!battles.length) return 0;

    const wins = battles.filter(b => b.result === 'win').length;
    return Math.round((wins / battles.length) * 100);
  });

  latestLogs = computed(() =>
    this.logs().slice(-10).reverse()
  );

  // ACTIONS

  refresh() {
    this.store.loadTrainer(this.TRAINER_ID);
    this.store.loadTeams(this.TRAINER_ID);
    this.store.loadBattles(this.TRAINER_ID);
  }
}