export interface Brother {
  id: number;
  names: string;
  civil_status: string;
  community_id: number;
  phone: string | null;
  spouse_id: number | null;
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