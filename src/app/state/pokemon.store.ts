import { Injectable, DestroyRef, inject } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { PokemonService } from '../core/services/pokemon.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Pokemon } from '../interface/pokemon.model';

@Injectable({ providedIn: 'root' })
export class PokemonStore {


  private pokemonSubject = new BehaviorSubject<Pokemon[]>([]);
  readonly pokemon$ = this.pokemonSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  constructor(private service: PokemonService) {}

  fetchPokemon(limit: number, offset: number): void {

    this.loadingSubject.next(true);

    this.service.getPokemon(limit, offset).pipe(

      retry({ count: 2, delay: 1000 }),

      tap((newPokemon) => {
        const current = this.pokemonSubject.value;

        const merged = [
          ...current,
          ...newPokemon.filter(p => !current.some(c => c.id === p.id))
        ];

        this.pokemonSubject.next(merged);
      }),

      catchError(err => {
        console.error('Fetch failed:', err);
        return of([]);
      }),

      tap(() => this.loadingSubject.next(false)),

      takeUntilDestroyed()

    ).subscribe();
  }

  getById(id: number): Pokemon | undefined {
    return this.pokemonSubject.value.find(p => p.id === id);
  }
}