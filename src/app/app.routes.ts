import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'clients/edit-client/:id',
    loadComponent: () => import('./clients/edit-client/edit-client.component').then(m => m.EditClientComponent),
    data: { title: 'Atualizar Cliente' }
  },
  {
    path: 'clients/new-client',
    loadComponent: () => import('./clients/new-client/new-client.component').then(m => m.NewClientComponent),
    data: { title: 'Cadastrar Cliente' }
  },
  {
    path: 'clients/list',
    loadComponent: () => import('./clients/list-clients/list-clients.component').then(m => m.ListClientsComponent),
    data: { title: 'Clientes Cadastrados' }
  },
  {
    path: 'schedules/month',
    loadComponent: () => import('./schedules/schedules-month/schedules-month.component').then(m => m.SchedulesMonthComponent),
    data: { title: 'Agendamentos' }
  },
  { path: '**', redirectTo: 'schedules/month' }
];
