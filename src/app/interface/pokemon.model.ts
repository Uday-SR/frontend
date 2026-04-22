export interface Pokemon {
    id: number;
    name: string;
    height: number;
    weight: number;
    types: string[];
    stats: {
        name: string;
        value: number;
    }[];
    sprite: string;
}