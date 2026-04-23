/**
 * Displays a searchable, filterable, and paginated list of Pokémon.
 * Allows users to:
 * - Search Pokémon by name
 * - Filter by type
 * - Sort by name or ID
 * - View detailed stats in a side panel
 * - Visualize stats using a radar chart
 * - Watch Pokémon-related videos
*/

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { PokemonStore } from '../../state/pokemon.store';
import { selectFilteredSortedPokemon } from '../../state/pokemon.selectors';

import { Pokemon } from '../../interface/pokemon.model';
import { POKEMON_VIDEO_MAP } from './videoMap.component';

@Component({
  selector: 'app-pokedex',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './pokedex.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokedexComponent {

  private store = inject(PokemonStore);
  private sanitizer = inject(DomSanitizer);

  readonly search = signal('');
  readonly sortBy = signal<'name' | 'id'>('name');
  readonly typeFilter = signal<string | null>(null);

  readonly page = signal(1);
  readonly pageSize = signal(10);

  readonly selectedPokemon = signal<Pokemon | null>(null);

  readonly loading = toSignal(this.store.loading$, { initialValue: false });

  // TYPE COLOR MAP
  readonly typeColors: Record<string, string> = {
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    grass: 'bg-green-500',
    electric: 'bg-yellow-400 text-black',
    ice: 'bg-cyan-300 text-black',
    fighting: 'bg-orange-700',
    poison: 'bg-purple-500',
    ground: 'bg-yellow-600',
    flying: 'bg-indigo-400',
    psychic: 'bg-pink-500',
    bug: 'bg-lime-500',
    rock: 'bg-stone-500',
    ghost: 'bg-violet-700',
    dragon: 'bg-indigo-700',
    dark: 'bg-gray-800',
    steel: 'bg-gray-400 text-black',
    fairy: 'bg-pink-300 text-black'
  };

  private filtered$ = selectFilteredSortedPokemon(
    this.store.pokemon$,
    toObservable(this.search),
    toObservable(this.sortBy),
    toObservable(this.typeFilter)
  );

  readonly filteredPokemon = toSignal(this.filtered$, { initialValue: [] });

  readonly totalPages = computed(() =>
    Math.ceil(this.filteredPokemon().length / this.pageSize())
  );

  readonly paginatedPokemon = computed(() => {
    const list = this.filteredPokemon();
    const start = (this.page() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  readonly radarData = computed<ChartData<'radar'> | undefined>(() => {
    const p = this.selectedPokemon();
    if (!p) return undefined;

    return {
      labels: p.stats.map(s => s.name.toUpperCase()),
      datasets: [
        {
          data: p.stats.map(s => s.value),
          label: p.name
        }
      ]
    };
  });

  readonly radarOptions: ChartOptions<'radar'> = {
    responsive: true,
    scales: {
      r: {
        beginAtZero: true
      }
    }
  };

  readonly videoUrl = computed<SafeResourceUrl | null>(() => {
    const p = this.selectedPokemon();
    if (!p) return null;

    const url = POKEMON_VIDEO_MAP[p.id];
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  constructor() {
    this.store.fetchPokemon(50, 0);

    effect(() => {
      this.search();
      this.sortBy();
      this.typeFilter();
      this.page.set(1);
    });
  }

  selectPokemon(p: Pokemon) {
    this.selectedPokemon.set(p);
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update(v => v + 1);
    }
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update(v => v - 1);
    }
  }
}