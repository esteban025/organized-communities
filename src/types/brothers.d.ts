export interface Brother {
  id: number;
  names: string;
  civil_status: string;
  community_id: number;
  phone: string | null;
  spouse_id: number | null;
}

export interface BrotherInvited extends Omit<Brother, 'phone' | 'spouse_id'> {
  number_community: number;
}
export interface BrotherConfirmated {
  group_key: string;
  parroquia: string;
  nombres_confirmados: string
  observaciones_combinadas: string | null;
  retreat_house_id: number | null;
  retreat_house_name: string | null;
  person_ids: number[];
  number_community: number;
  marriage_id: number | null;
  ultima_confirmacion: string;
}

export interface BrotherOutDB {
  id: number;
  names: string;
  phone: string | null;
  community_id: number;
  civil_status: string;
  marriage_id: number | null;
  spouse_id: number | null;
  spouse_name: string | null;
  spouse_phone: string | null;
  roles: string[];
  catechist_communities: number[];
}

export interface BrotherwithRoles extends Brother {
  roles: string[] | null;
}
export interface BrotherwithRolesOutDB {
  group_id: string;
  person_id: number;
  marriage_id: number | null;
  person1_id: number | null;
  person2_id: number | null;
  names: string;
  civil_status: string;
  roles: string[] | null;
}

export interface SingleBrotherInput {
  id: number;
  names: string;
  civil_status: "soltero" | "soltera";
  community_id: number;
  phone: string | null;
  roles: string[];
  catechist_communities?: number[];
};

export interface CreateMarriageInput {
  id: number
  husband: { names: string; phone: string | null };
  wife: { names: string; phone: string | null };
  community_id: number;
  roles: string[];
  catechist_communities?: number[];
};

export interface BrotherLeader {
  group_id: string;
  names: string;
  civil_status: string;
  person_type: string;
  role: string;
  own_community_id: number;
}