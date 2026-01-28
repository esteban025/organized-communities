export interface Community {
  id: number;
  number_community: number;
  level_paso: string;
  parish_id: number;
}

export interface CommunityWithBrotherCount extends Community, Omit<Community, "parish_id"> {
  count_persons: number;
  count_marriages: number;
  count_singles: number;
  responsable: string | null;
}