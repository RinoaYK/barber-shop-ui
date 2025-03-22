import { Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { SERVICES_TOKEN } from '../../../services/service.token';
import { DialogManagerService } from '../../../services/dialog-manager.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ClientScheduleAppointmentModel, SaveScheduleModel, ScheduleAppointementMonthModel, SelectClientModel } from '../../schedule.models';
import { FormsModule, NgForm } from '@angular/forms';
import { IDialogManagerService } from '../../../services/idialog-manager.service';
import { CommonModule } from '@angular/common';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { YesNoDialogComponent } from '../../../commons/components/yes-no-dialog/yes-no-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-schedule-calendar',
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTimepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './schedule-calendar.component.html',
  styleUrl: './schedule-calendar.component.scss',
  providers: [
    provideNativeDateAdapter(),
    {
      provide: SERVICES_TOKEN.DIALOG, useClass: DialogManagerService
    }
  ]
})

export class ScheduleCalendarComponent implements OnDestroy, OnChanges, OnInit {
  private subscription?: Subscription;
  private _selected: Date = new Date();

  displayedColumns: string[] = ['startAt', 'endAt', 'client', 'actions'];
  dataSource!: MatTableDataSource<ClientScheduleAppointmentModel>;
  addingSchedule: boolean = false;
  newSchedule: SaveScheduleModel = { startAt: undefined, endAt: undefined, clientId: undefined };
  availableTimes: Date[] = [];
  availableClients: SelectClientModel[] = [];

  @Input() monthSchedule!: ScheduleAppointementMonthModel;
  @Input() clients: SelectClientModel[] = [];
  @Output() onDateChange = new EventEmitter<Date>();
  @Output() onConfirmDelete = new EventEmitter<ClientScheduleAppointmentModel>();
  @Output() onScheduleClient = new EventEmitter<SaveScheduleModel>();

  constructor(@Inject(SERVICES_TOKEN.DIALOG) private readonly dialogManagerService: IDialogManagerService) {}

  get selected(): Date {
    return this._selected;
  }

  set selected(selected: Date) {
    if (this._selected.getTime() !== selected.getTime()) {
      this._selected = selected;
      this.onDateChange.emit(selected);
      this.generateAvailableTimes();
      this.generateAvailableClients();
      this.buildTable();
    }
  }

  ngOnInit() {
    if (this.monthSchedule && this.clients) {
      this.generateAvailableTimes();
      this.generateAvailableClients();
      this.buildTable();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['monthSchedule'] && this.monthSchedule) {
      this.generateAvailableTimes();
      this.generateAvailableClients();
      this.buildTable();
    }
    if (changes['clients'] && this.clients) {
      this.generateAvailableClients();
    }
  }

  onSubmit(form: NgForm) {
    const startAt = new Date(this._selected);
    const endAt = new Date(this._selected);
    startAt.setHours(this.newSchedule.startAt!.getHours(), this.newSchedule.startAt!.getMinutes());
    endAt.setHours(this.newSchedule.endAt!.getHours(), this.newSchedule.endAt!.getMinutes());
    const saved: ClientScheduleAppointmentModel = {
      id: -1,
      day: this._selected.getDate(),
      startAt,
      endAt,
      clientId: this.newSchedule.clientId!,
      clientName: this.clients.find(c => c.id === this.newSchedule.clientId!)!.name
    };
    this.monthSchedule.scheduledAppointments.push(saved);
    this.onScheduleClient.emit(saved);
    this.buildTable();
    form.resetForm();
    this.newSchedule = { startAt: undefined, endAt: undefined, clientId: undefined };
    this.generateAvailableTimes();
    this.generateAvailableClients();
  }

  requestDelete(schedule: ClientScheduleAppointmentModel) {
    this.subscription = this.dialogManagerService.showYesNoDialog(
      YesNoDialogComponent,
      { title: 'Exclusão de agendamento', content: 'Confirma a exclusão do agendamento?' }
    ).subscribe(result => {
      if (result) {
        this.onConfirmDelete.emit(schedule);
        this.monthSchedule.scheduledAppointments = this.monthSchedule.scheduledAppointments.filter(
          a => a.id !== schedule.id
        );
        const updatedList = this.dataSource.data.filter(c => c.id !== schedule.id);
        this.dataSource = new MatTableDataSource<ClientScheduleAppointmentModel>(updatedList);
        this.generateAvailableTimes();
        this.generateAvailableClients();
      }
    });
  }

	private buildTable() {
    if (!this.monthSchedule || !this.monthSchedule.scheduledAppointments) {
      console.log('monthSchedule ou scheduledAppointments não inicializado');
      this.dataSource = new MatTableDataSource<ClientScheduleAppointmentModel>([]);
      return;
    }
    const appointments = this.monthSchedule.scheduledAppointments.filter(a =>
      this.monthSchedule.year === this._selected.getFullYear() &&
      this.monthSchedule.month - 1 === this._selected.getMonth() &&
      a.day === this._selected.getDate()
    );
    console.log('Filtered Appointments:', appointments.map(a => ({
      startAt: a.startAt.toLocaleString(),
      endAt: a.endAt.toLocaleString(),
      clientName: a.clientName,
      completed: this.isCompleted(a)
    })));
    this.dataSource = new MatTableDataSource<ClientScheduleAppointmentModel>(appointments);
  }

  generateAvailableTimes() {
    if (!this.monthSchedule || !this.monthSchedule.scheduledAppointments) {
      console.log('monthSchedule não inicializado, gerando horários padrão');
      this.availableTimes = this.generateDefaultTimes();
      return;
    }

    const now = new Date();
    const selectedDate = new Date(this._selected);
    const start = new Date(selectedDate);
    start.setHours(9, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(17, 0, 0, 0);

    this.availableTimes = [];

    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (selectedDateOnly < nowDateOnly) {
      console.log('Data selecionada é anterior à atual, sem horários disponíveis');
      return;
    }

    const isToday = selectedDateOnly.getTime() === nowDateOnly.getTime();

    while (start < end) {
      const time = new Date(start);
      const hours = time.getHours();

      if (hours !== 12 && this.isTimeAvailable(time)) {
        if (isToday) {
          if (time > now) {
            this.availableTimes.push(time);
          }
        } else {
          this.availableTimes.push(time);
        }
      }
      start.setHours(start.getHours() + 1);
    }
    console.log('Now:', now.toLocaleString());
    console.log('Selected Date:', selectedDate.toLocaleString());
    console.log('Available Times:', this.availableTimes.map(t => t.toLocaleTimeString()));
  }

  private generateDefaultTimes(): Date[] {
    const now = new Date();
    const selectedDate = new Date(this._selected);
    const start = new Date(selectedDate);
    start.setHours(9, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(17, 0, 0, 0);
    const times: Date[] = [];

    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (selectedDateOnly < nowDateOnly) {
      return times;
    }

    const isToday = selectedDateOnly.getTime() === nowDateOnly.getTime();

    while (start < end) {
      const time = new Date(start);
      if (time.getHours() !== 12) {
        if (isToday) {
          if (time > now) {
            times.push(time);
          }
        } else {
          times.push(time);
        }
      }
      start.setHours(start.getHours() + 1);
    }
    return times;
  }

  private isTimeAvailable(date: Date): boolean {
    if (!this.monthSchedule || !this.monthSchedule.scheduledAppointments) {
      return true;
    }

    const appointments = this.monthSchedule.scheduledAppointments.filter(a =>
      this.monthSchedule.year === this._selected.getFullYear() &&
      this.monthSchedule.month - 1 === this._selected.getMonth() &&
      a.day === this._selected.getDate()
    );

    return !appointments.some(appointment => {
      const appointmentStart = new Date(appointment.startAt);
      return (
        appointmentStart.getHours() === date.getHours() &&
        appointmentStart.getMinutes() === date.getMinutes()
      );
    });
  }

  generateAvailableClients() {
    if (!this.monthSchedule || !this.monthSchedule.scheduledAppointments || !this.clients) {
      console.log('monthSchedule ou clients não inicializado, usando todos os clientes');
      this.availableClients = [...this.clients];
      return;
    }

    const appointments = this.monthSchedule.scheduledAppointments.filter(a =>
      this.monthSchedule.year === this._selected.getFullYear() &&
      this.monthSchedule.month - 1 === this._selected.getMonth() &&
      a.day === this._selected.getDate()
    );

    const bookedClientIds = appointments.map(a => a.clientId);
    this.availableClients = this.clients.filter(client => !bookedClientIds.includes(client.id));
    console.log('Booked Client IDs:', bookedClientIds);
    console.log('Available Clients:', this.availableClients);
  }

  onTimeChange(time: Date) {
    if (!time) {
      this.newSchedule.startAt = undefined;
      return;
    }
    const endAt = new Date(time);
    endAt.setHours(time.getHours() + 1);
    this.newSchedule.endAt = endAt;
  }

	isCompleted(schedule: ClientScheduleAppointmentModel): boolean {
    const now = new Date();
    const startAt = new Date(schedule.startAt);

    const nowUTC = now.toISOString();
    const startAtUTC = startAt.toISOString();

    const isCompleted = startAt < now;

    console.log(`Now (local): ${now.toLocaleString()} | Now (UTC): ${nowUTC}`);
    console.log(`Schedule StartAt (local): ${startAt.toLocaleString()} | StartAt (UTC): ${startAtUTC}`);
    console.log(`Schedule ${startAt.toLocaleString()} - Completed: ${isCompleted}`);
    return isCompleted;
  }
}
