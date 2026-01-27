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