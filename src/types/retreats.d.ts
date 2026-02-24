export interface Retreat {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  cost_per_person: number;
  status: 'planificacion' | 'en_curso' | 'finalizada';
  is_leaders_only: boolean;
}

export interface CreateRetreatInput extends Omit<Retreat, 'id' | 'status'> {
  communities_ids: number[];
}

export interface RetreatsGet {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  cost_per_person: string;
  status: 'planificacion' | 'en_curso' | 'finalizada';
  is_leaders_only: number;
  created_at: string;
  updated_at: string;
  communities: {
    id: number;
    number_community: string;
    responsable: string | null;
  }[];
  total_communities: number;
}

export interface RetreatConfirmedAttendees {
  convivencia: {
    titulo: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  estadisticas: {
    total_personas: number;
    total_matrimonios: number;
    total_solteros: number;
    total_solteras: number;
  };
  parroquias: any;
}

export interface RetreatConf {
  title: string;
  start_date: string;
  end_date: string;
  cost_per_person: number;
  status: string;
}

export interface StatsConf {
  total_personas: number;
  total_matrimonios: number;
  total_solteros: number;
  total_solteras: number;
}

export interface ParishesConf {
  parish_id: number;
  parish_name: string;
  community_id: number;
  number_community: string;
}

export interface AttendeesConf {
  community_id: number;
  group_key: string;
  nombres_confirmados: string;
  observaciones_combinadas: string | null;
  retreat_house_id: number | null;
  retreat_house_name: string | null;
  person_ids: string; // Este campo vendrá como string con IDs separados por comas, lo convertiremos a array luego
  marriage_id: number | null;
  marriage_person1_id: number | null;
  marriage_person2_id: number | null;
  civil_status: string;
}

export interface CommunityInfo {
  numero: string;
  estadisticas: {
    total_personas: number;
    total_matrimonios: number;
    total_solteros: number;
    total_solteras: number;
  };
  confirmados: {
    group_key: string;
    nombres_confirmados: string;
    observaciones_combinadas: string | null;
    retreat_house_id: number | null;
    retreat_house_name: string | null;
    person_ids: number[];
    marriage_id: number | null;
    civil_status: string;
  }[];
}

export interface ConfirmadoInternal {
  group_key: string;
  nombres_confirmados: string;
  observaciones_combinadas: string | null;
  retreat_house_id: number | null;
  retreat_house_name: string | null;
  person_ids: number[];
  marriage_id: number | null;
  civil_status: string;
  marriage_person1_id: number | null;
  marriage_person2_id: number | null;
}

export interface CommunityInternal {
  community_id: number;
  numero: string;
  estadisticas: StatsConf;
  confirmados: ConfirmadoInternal[];
}

export interface ParishMapValue {
  parroquia: string;
  comunidades: CommunityInternal[];
}

export interface RetreatHistory {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  total_communities: number;
  total_personas: number;
  total_debt: number;
}

export interface CommunityCharge {
  parish_name: string;
  community_id: number;
  number_community: number;
  total_attendees: number;
  total_cost: number;
  total_debt: number;
}
