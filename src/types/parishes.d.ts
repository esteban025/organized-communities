export interface Parish {
  id: number;
  name: string;
  tag: string;
  aka: string;
  locality: string | null;
}
export interface ParishWithCounts extends Parish {
  count_communities: number;
}

export interface TableParishesProps {
  parishes: ParishWithCounts[]
  total: {
    total_parishes: number
    total_communities: number
  }
}