export interface Parish {
  id: number;
  name: string;
  tag: string;
  aka: string;
}
export interface ParishWithCounts extends Parish {
  count_communities: number;
}