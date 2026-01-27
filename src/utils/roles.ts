// deben tener informacion de radios y checkboxes
// los principales radios y checkboxes los de support
export const ROLES = {
  principals: [
    {
      value: '',
      label: 'Ninguno',
      checked: true,
      id: 'role-none',
      class: 'roles-bro',
    },
    {
      value: 'responsable',
      label: 'Responsable',
      class: 'roles-bro',
    },
    {
      value: 'corresponsable',
      label: 'Corresponsable',
      class: 'roles-bro',
    },
  ],
  // support: ['ostiario', 'didascada', 'catequista'],
  support: [
    {
      value: 'ostiario',
      label: 'Ostiario',
      class: 'roles-bro',
    },
    {
      value: 'didascada',
      label: 'Didascada',
      class: 'roles-bro',
    },
    {
      value: 'catequista',
      label: 'Catequista',
      class: 'roles-bro',
    },
  ],
};