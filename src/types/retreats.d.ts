export interface Retreats {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  cost_per_person: number;
  status: 'planificacion' | 'en_curso' | 'finalizada';
  is_leaders_only: boolean;
}

export interface CreateRetreatInput extends Omit<Retreats, 'id' | 'status'> {
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
// {
//   id: 2,
//   title: 'nueva convivencia',
//   description: 'ets akjsnckacas',
//   start_date: 2026-02-05T05:00:00.000Z,
//   start_date: 2026-02-05T05:00:00.000Z,
//   end_date: 2026-02-08T05:00:00.000Z,
//   start_date: 2026-02-05T05:00:00.000Z,
//   end_date: 2026-02-08T05:00:00.000Z,
//   end_date: 2026-02-08T05:00:00.000Z,
//   cost_per_person: '45.00',
//   status: 'planificacion',
//   is_leaders_only: 0,
//   created_at: 2026-02-03T15:52:25.000Z,
//   updated_at: 2026-02-03T15:52:25.000Z,
//   communities: [ [Object], [Object] ],
//   total_communities: 2
// }