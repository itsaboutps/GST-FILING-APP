import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <mat-toolbar color="primary" class="mat-elevation-z6">
      <span>GST Filing Application</span>
    </mat-toolbar>
    <app-gst-form></app-gst-form>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    mat-toolbar {
      margin-bottom: 2rem;
    }
  `]
})
export class AppComponent {}