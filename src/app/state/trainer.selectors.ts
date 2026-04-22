import { Observable, map } from "rxjs";
import { distinctUntilChanged, shareReplay } from "rxjs";
import { Battle } from "../interface/battle.model";

export function selectWinRate(
  battles$: Observable<Battle[]>
): Observable<number> {

  return battles$.pipe(
    map(battles => {
      if (!battles.length) return 0;

      const wins = battles.filter(b => b.result === 'win').length;
      return wins / battles.length;
    }),
    distinctUntilChanged(),
    shareReplay(1)
  );
}