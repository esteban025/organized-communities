export interface Community {
  id: number;
  number_community: number;
  level_paso: string;
  parish_id: number;
}

export interface CommunityWithBrotherCount extends Community, Omit<Community, "parish_id"> {
  count_brothers: number;
  responsables: string | null
}