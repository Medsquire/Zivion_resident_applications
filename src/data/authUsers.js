import { FLATS_DIRECTORY } from './mockData.js';

export const DEMO_USERS = [
  {
    email: 'admin@royalheights.com',
    name: 'Apartment Admin',
    role: 'admin'
  },
  ...['A', 'B', 'C'].map(block => ({
    email: `supervisor.${block.toLowerCase()}@royalheights.com`,
    name: `Block ${block} Supervisor`,
    role: 'supervisor',
    block
  })),
  ...FLATS_DIRECTORY.map(flat => ({
    email: `homeowner.${flat.flatNo.replace(/-/g, '').toLowerCase()}@royalheights.com`,
    name: flat.ownerName,
    role: 'homeowner',
    flatNo: flat.flatNo
  }))
];