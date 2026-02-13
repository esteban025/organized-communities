export interface Community {
  id: number;
  number_community: number;
  level_paso: string;
  parish_id: number;
}

export interface CommunityResume extends Community {
  count_persons: number;
  total_communities: number;
  responsable: string | null;
}

export interface CommunityFilters {
  responsable: string;
  parity: "all" | "even" | "odd";
  number: string;
  paso: string;
}