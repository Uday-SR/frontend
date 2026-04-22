import { Injectable, inject, DestroyRef } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  of,
  tap,
  interval,
  switchMap,
  map
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TrainerService } from '../core/services/trainer.service';
import { Team } from '../interface/team.model';
import { Battle } from '../interface/battle.model';
import { Trainer } from '../interface/trainer.model';

@Injectable({ providedIn: 'root' })
export class TrainerStore {

  private service = inject(TrainerService);
  private destroyRef = inject(DestroyRef);

  // STATE

  private trainerSubject = new BehaviorSubject<Trainer | null>(null);
  readonly trainer$ = this.trainerSubject.asObservable();

  private teamsSubject = new BehaviorSubject<Team[]>([]);
  readonly teams$ = this.teamsSubject.asObservable();

  private battlesSubject = new BehaviorSubject<Battle[]>([]);
  readonly battles$ = this.battlesSubject.asObservable();

  private logsSubject = new BehaviorSubject<any[]>([]);
  readonly logs$ = this.logsSubject.asObservable();

  // -------------------------
  // LOCAL STORAGE KEYS
  // -------------------------

  private readonly TEAMS_KEY = 'trainer_teams';
  private readonly TRAINER_KEY = 'trainer_profile';
  private readonly BATTLES_KEY = 'trainer_battles';

  // INIT 

  constructor() {
    this.hydrate();
  }

  private hydrate() {
    const teams = this.safeParse(localStorage.getItem(this.TEAMS_KEY));
    const trainer = this.safeParse(localStorage.getItem(this.TRAINER_KEY));
    const battles = this.safeParse(localStorage.getItem(this.BATTLES_KEY));

    if (teams) this.teamsSubject.next(teams);
    if (trainer) this.trainerSubject.next(trainer);
    if (battles) this.battlesSubject.next(battles);
  }

  private safeParse(data: string | null) {
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // STORAGE HELPERS

  private saveTeams() {
    localStorage.setItem(this.TEAMS_KEY, JSON.stringify(this.teamsSubject.value));
  }

  private saveTrainer() {
    localStorage.setItem(this.TRAINER_KEY, JSON.stringify(this.trainerSubject.value));
  }

  private saveBattles() {
    localStorage.setItem(this.BATTLES_KEY, JSON.stringify(this.battlesSubject.value));
  }

  // LOAD DATA (API + CACHE)

  loadTrainer(id: number) {
    this.service.getTrainer(id).pipe(
      tap(trainer => {
        this.trainerSubject.next(trainer);
        this.saveTrainer();
      }),
      catchError(err => {
        console.error('Trainer load failed', err);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  loadTeams(trainerId: number) {
  this.service.getTeams(trainerId).pipe(
    tap(serverTeams => {

      const cached = this.safeParse(
        localStorage.getItem(this.TEAMS_KEY)
      ) ?? [];

      const merged =
        serverTeams.length > 0
          ? this.mergeById(cached, serverTeams)
          : cached;

      this.teamsSubject.next(merged);
      this.saveTeams(); 
    }),
    catchError(err => {
      console.error('Failed to load teams', err);
      return of([]);
    }),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe();
}

  loadBattles(trainerId: number) {
    this.service.getBattles(trainerId).pipe(
      tap(battles => {
        this.battlesSubject.next(battles);
        this.saveBattles();
      }),
      catchError(err => {
        console.error('Battles load failed', err);
        return of([]);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  // MERGE UTILITY

  private mergeById(cache: Team[], server: Team[]): Team[] {
    const map = new Map<number, Team>();

    [...cache, ...server].forEach(t => {
      if (t?.id) map.set(t.id, t);
    });

    return Array.from(map.values());
  }

  // TEAM MUTATIONS

  createTeam(team: Team) {
    const current = this.teamsSubject.value;

    const optimistic: Team = {
      ...team,
      id: Date.now()
    };

    const updated = [...current, optimistic];

    this.teamsSubject.next(updated);
    this.saveTeams();

    this.service.createTeam(team).subscribe({
      next: (res) => {
        if (!res) return;

        const finalList = this.teamsSubject.value.map(t =>
          t.id === optimistic.id ? res : t
        );

        this.teamsSubject.next(finalList);
        this.saveTeams();
      },
      error: () => {
        this.teamsSubject.next(current);
        this.saveTeams();
      }
    });
  }

  updateTeam(team: Team) {
    const current = this.teamsSubject.value;

    const updated = current.map(t =>
      t.id === team.id ? { ...t, ...team } : t
    );

    this.teamsSubject.next(updated);
    this.saveTeams();

    this.service.updateTeam(team).subscribe({
      next: (res) => {
        if (!res) return;

        const final = this.teamsSubject.value.map(t =>
          t.id === team.id ? res : t
        );

        this.teamsSubject.next(final);
        this.saveTeams();
      },
      error: () => {
        this.teamsSubject.next(current);
        this.saveTeams();
      }
    });
  }

  deleteTeam(teamId: number) {
    const current = this.teamsSubject.value;

    const updated = current.filter(t => t.id !== teamId);

    this.teamsSubject.next(updated);
    this.saveTeams();

    this.service.deleteTeam(teamId).subscribe({
      error: () => {
        this.teamsSubject.next(current);
        this.saveTeams();
      }
    });
  }

  // BATTLES

  createBattle(battle: Battle) {
    this.service.createBattle(battle).subscribe({
      next: () => this.loadBattles(battle.trainer_id),
      error: err => console.error(err)
    });
  }

  // TRAINER UPDATE

  updateTrainer(trainer: Trainer) {
    const current = this.trainerSubject.value;

    this.trainerSubject.next(trainer);
    this.saveTrainer();

    this.service.updateTrainer(trainer).subscribe({
      next: (res) => {
        if (res) {
          this.trainerSubject.next(res);
          this.saveTrainer();
        }
      },
      error: () => {
        this.trainerSubject.next(current);
        this.saveTrainer();
      }
    });
  }

  // LIVE LOG STREAM

  startBattleLogStream() {
    interval(5000).pipe(
      switchMap(() => this.service.getBattleLogs()),
      map(logs => {
        const current = this.logsSubject.value;
        return logs.filter(l => !current.some(c => c.id === l.id));
      }),
      tap(newLogs => {
        if (newLogs.length) {
          const updated = [...this.logsSubject.value, ...newLogs];
          this.logsSubject.next(updated);
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}