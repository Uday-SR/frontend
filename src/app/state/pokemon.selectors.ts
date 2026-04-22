import { Observable, combineLatest } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay
} from 'rxjs/operators';
import { Pokemon } from '../interface/pokemon.model';

/**
 * Filters Pokémon list based on search input.
 *
 * Uses debounce and distinctUntilChanged for efficient querying.
 *
 * @param pokemon$ - Stream of Pokémon list
 * @param search$ - Stream of search input
 * @returns Observable<Pokemon[]> - Filtered Pokémon list
*/

export function selectPokemonSearch(
  pokemon$: Observable<Pokemon[]>,
  search$: Observable<string>
): Observable<Pokemon[]> {

  return combineLatest([
    pokemon$,
    search$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    )
  ]).pipe(

    map(([pokemon, search]) => {
      if (!search) return pokemon;

      return pokemon.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }),

    shareReplay(1)
  );
}

/**
 * Sorts Pokémon list based on selected criteria.
 *
 * @param pokemon$ - Stream of Pokémon list
 * @param sortBy$ - Stream of sorting key (name, total, or stat)
 * @returns Observable<Pokemon[]> - Sorted Pokémon list
*/

export function selectSortedPokemon(
  pokemon$: Observable<Pokemon[]>,
  sortBy$: Observable<string>
): Observable<Pokemon[]> {

  return combineLatest([pokemon$, sortBy$]).pipe(

    map(([pokemon, sortBy]) => {
      if (!sortBy) return pokemon;

      return [...pokemon].sort((a, b) => {

        // Sort by name
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }

        // Sort by total stats
        if (sortBy === 'total') {
          const totalA = a.stats.reduce((s, x) => s + x.value, 0);
          const totalB = b.stats.reduce((s, x) => s + x.value, 0);
          return totalB - totalA;
        }

        // Sort by individual stat
        const aVal = a.stats.find(s => s.name === sortBy)?.value || 0;
        const bVal = b.stats.find(s => s.name === sortBy)?.value || 0;

        return bVal - aVal;
      });
    }),

    shareReplay(1)
  );
}

/**
 * Computes total base stats for each Pokémon.
 *
 * shareReplay is used to cache expensive computation.
 *
 * @param pokemon$ - Stream of Pokémon list
 * @returns Observable<{ id: number; total: number }[]>
*/

export function selectTotalStats(
  pokemon$: Observable<Pokemon[]>
): Observable<{ id: number; total: number }[]> {

  return pokemon$.pipe(

    map(list =>
      list.map(p => ({
        id: p.id,
        total: p.stats.reduce((sum, s) => sum + s.value, 0)
      }))
    ),

    shareReplay(1)
  );
}

/**
 * Filters Pokémon by type.
 *
 * @param pokemon$ - Stream of Pokémon list
 * @param typeFilter$ - Selected type (e.g., fire, water)
 * @returns Observable<Pokemon[]>
*/

export function selectPokemonByType(
  pokemon$: Observable<Pokemon[]>,
  typeFilter$: Observable<string | null>
): Observable<Pokemon[]> {

  return combineLatest([pokemon$, typeFilter$]).pipe(

    map(([pokemon, type]) => {
      if (!type) return pokemon;

      return pokemon.filter(p =>
        p.types.includes(type)
      );
    }),

    shareReplay(1)
  );
}

/**
 * Master selector combining search, sorting, and filtering.
 *
 * This is the primary selector used in UI components.
 *
 * @param pokemon$ - Base Pokémon stream
 * @param search$ - Search input stream
 * @param sortBy$ - Sorting key stream
 * @param typeFilter$ - Type filter stream
 * @returns Observable<Pokemon[]>
*/

export function selectFilteredSortedPokemon(
  pokemon$: Observable<Pokemon[]>,
  search$: Observable<string>,
  sortBy$: Observable<string>,
  typeFilter$: Observable<string | null>
): Observable<Pokemon[]> {

  return combineLatest([
    pokemon$,
    search$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ),
    sortBy$,
    typeFilter$
  ]).pipe(

    map(([pokemon, search, sortBy, type]) => {

      let result = [...pokemon];

      // SEARCH
      if (search) {
        result = result.filter(p =>
          p.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      // TYPE FILTER
      if (type) {
        result = result.filter(p =>
          p.types.includes(type)
        );
      }

      // SORTING
      if (sortBy) {
        result.sort((a, b) => {

          if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
          }

          if (sortBy === 'total') {
            const totalA = a.stats.reduce((s, x) => s + x.value, 0);
            const totalB = b.stats.reduce((s, x) => s + x.value, 0);
            return totalB - totalA;
          }

          const aVal = a.stats.find(s => s.name === sortBy)?.value || 0;
          const bVal = b.stats.find(s => s.name === sortBy)?.value || 0;

          return bVal - aVal;
        });
      }

      return result;
    }),

    shareReplay(1)
  );
}