/**
 * BattleDashboardComponent
 * Displays trainer battle analytics using charts and live logs.
 *
 * Features:
 * - Wins vs Losses bar chart
 * - Live battle logs stream
 * - Battle creation test action
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData } from 'chart.js';
import { toSignal } from '@angular/core/rxjs-interop';

import { TrainerStore } from '../../state/trainer.store';

@Component({
  selector: 'app-battle-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './battle-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BattleDashboardComponent {

  private store = inject(TrainerStore);

  /**
   * Reactive battle list from store
   */
  readonly battles = toSignal(this.store.battles$, { initialValue: [] });

  /**
   * Reactive battle logs stream
   */
  readonly logs = toSignal(this.store.logs$, { initialValue: [] });

  // BAR CHART (Wins vs Losses)

  /**
   * Computes total wins and losses for bar chart visualization
   */
  readonly barChartData = computed<ChartData<'bar'>>(() => {
    const battles = this.battles();

    let wins = 0;
    let losses = 0;

    for (const b of battles) {
      b.result === 'win' ? wins++ : losses++;
    }

    return {
      labels: ['Battles'],
      datasets: [
        {
          label: 'Wins',
          data: [wins],
          backgroundColor: '#22c55e'
        },
        {
          label: 'Losses',
          data: [losses],
          backgroundColor: '#ef4444'
        }
      ]
    };
  });

  /**
   * Chart configuration options
   */
  readonly barChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true }
    }
  };

  /**
   * Creates a mock battle for testing UI and analytics
   */
  addBattle(): void {
    this.store.createBattle({
      trainer_id: 1,
      team_id: 1,
      opponent_name: 'AI Trainer',
      result: Math.random() > 0.5 ? 'win' : 'loss',
      date: new Date().toISOString(),
      score_trainer: 3,
      score_opponent: 2
    });
  }

  constructor() {
    /**
     * Load initial battle data for trainer
     */
    this.store.loadBattles(1);

    /**
     * Start simulated live battle log stream
     */
    this.store.startBattleLogStream();
  }
}