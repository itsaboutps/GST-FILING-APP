import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GstService } from '../../services/gst.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-gst-form',
  template: `
    <div class="container">
      <mat-card>
        <mat-card-content>
          <mat-stepper [linear]="true" #stepper>
            <mat-step [stepControl]="gstForm">
              <form [formGroup]="gstForm">
                <ng-template matStepLabel>Basic Details</ng-template>
                
                <mat-form-field appearance="outline">
                  <mat-label>Frequency Type</mat-label>
                  <mat-select formControlName="frequencyType">
                    <mat-option value="monthly">Monthly</mat-option>
                    <mat-option value="quarterly">Quarterly</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" *ngIf="gstForm.get('frequencyType')?.value === 'monthly'">
                  <mat-label>Month</mat-label>
                  <mat-select formControlName="period">
                    <mat-option *ngFor="let month of months; let i = index" [value]="i + 1">
                      {{month}}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" *ngIf="gstForm.get('frequencyType')?.value === 'quarterly'">
                  <mat-label>Quarter</mat-label>
                  <mat-select formControlName="period">
                    <mat-option *ngFor="let quarter of quarters" [value]="quarter.value">
                      {{quarter.label}}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Year</mat-label>
                  <mat-select formControlName="year">
                    <mat-option *ngFor="let year of years" [value]="year">
                      {{year}}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>GSTIN</mat-label>
                  <input matInput formControlName="gstin">
                  <mat-error *ngIf="gstForm.get('gstin')?.hasError('pattern')">
                    Please enter a valid GSTIN
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>E-commerce GSTIN</mat-label>
                  <input matInput formControlName="ecommerceGstin">
                  <mat-error *ngIf="gstForm.get('ecommerceGstin')?.hasError('pattern')">
                    Please enter a valid GSTIN
                  </mat-error>
                </mat-form-field>

                <div class="button-container">
                  <button mat-raised-button color="primary" matStepperNext>Next</button>
                </div>
              </form>
            </mat-step>

            <mat-step [stepControl]="fileForm">
              <form [formGroup]="fileForm">
                <ng-template matStepLabel>Upload Files</ng-template>
                
                <ng-container *ngIf="gstForm.get('frequencyType')?.value === 'monthly'">
                  <h3>Forward Excel File</h3>
                  <app-file-upload (fileSelected)="onForwardFileSelect($event)"></app-file-upload>

                  <h3>Reverse Excel File</h3>
                  <app-file-upload (fileSelected)="onReverseFileSelect($event)"></app-file-upload>
                </ng-container>

                <ng-container *ngIf="gstForm.get('frequencyType')?.value === 'quarterly'">
                  <div *ngFor="let month of getQuarterMonths()">
                    <h3>{{month.name}}</h3>
                    
                    <h4>Forward Excel File</h4>
                    <app-file-upload 
                      (fileSelected)="onQuarterlyForwardFileSelect($event, month.index)">
                    </app-file-upload>

                    <h4>Reverse Excel File</h4>
                    <app-file-upload 
                      (fileSelected)="onQuarterlyReverseFileSelect($event, month.index)">
                    </app-file-upload>
                  </div>
                </ng-container>

                <div class="button-container">
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-raised-button color="primary" 
                          [disabled]="!canGenerateJson()"
                          (click)="generateJson()">
                    Generate JSON
                  </button>
                </div>
              </form>
            </mat-step>
          </mat-stepper>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 1rem;
    }
    .button-container {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }
    h3 {
      margin: 1.5rem 0 0.5rem;
      color: rgba(0, 0, 0, 0.87);
      font-size: 1.25rem;
      font-weight: 500;
    }
    h4 {
      margin: 1rem 0 0.5rem;
      color: rgba(0, 0, 0, 0.87);
      font-size: 1rem;
      font-weight: 500;
    }
  `]
})
export class GstFormComponent {
  gstForm: FormGroup;
  fileForm: FormGroup;
  
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  quarters = [
    { value: 'Q1', label: 'Q1 (Apr-Jun)' },
    { value: 'Q2', label: 'Q2 (Jul-Sep)' },
    { value: 'Q3', label: 'Q3 (Oct-Dec)' },
    { value: 'Q4', label: 'Q4 (Jan-Mar)' }
  ];
  
  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  constructor(
    private fb: FormBuilder,
    private gstService: GstService,
    private snackBar: MatSnackBar
  ) {
    this.gstForm = this.fb.group({
      frequencyType: ['', Validators.required],
      period: ['', Validators.required],
      year: ['', Validators.required],
      gstin: ['', [Validators.required, Validators.pattern('^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')]],
      ecommerceGstin: ['09CJLPS5920D1ZY', [Validators.required, Validators.pattern('^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')]]
    });

    this.fileForm = this.fb.group({
      forwardFile: [null],
      reverseFile: [null],
      quarterlyForwardFiles: this.fb.array([null, null, null]),
      quarterlyReverseFiles: this.fb.array([null, null, null])
    });

    // Reset files when frequency type changes
    this.gstForm.get('frequencyType')?.valueChanges.subscribe(() => {
      this.fileForm.patchValue({
        forwardFile: null,
        reverseFile: null,
        quarterlyForwardFiles: [null, null, null],
        quarterlyReverseFiles: [null, null, null]
      });
      this.gstService.resetData();
    });
  }

  getQuarterMonths() {
    const quarterMap: { [key: string]: number[] } = {
      'Q1': [3, 4, 5],    // Apr, May, Jun
      'Q2': [6, 7, 8],    // Jul, Aug, Sep
      'Q3': [9, 10, 11],  // Oct, Nov, Dec
      'Q4': [0, 1, 2]     // Jan, Feb, Mar
    };

    const quarter = this.gstForm.get('period')?.value;
    if (!quarter) return [];

    return quarterMap[quarter].map(monthIndex => ({
      index: monthIndex,
      name: this.months[monthIndex]
    }));
  }

  onForwardFileSelect(file: File) {
    this.fileForm.patchValue({ forwardFile: file });
    this.readExcelFile(file, 'forward');
  }

  onReverseFileSelect(file: File) {
    this.fileForm.patchValue({ reverseFile: file });
    this.readExcelFile(file, 'reverse');
  }

  onQuarterlyForwardFileSelect(file: File, monthIndex: number) {
    const files = this.fileForm.get('quarterlyForwardFiles')?.value;
    files[monthIndex] = file;
    this.fileForm.patchValue({ quarterlyForwardFiles: files });
    this.readQuarterlyExcelFile(file, 'forward', monthIndex);
  }

  onQuarterlyReverseFileSelect(file: File, monthIndex: number) {
    const files = this.fileForm.get('quarterlyReverseFiles')?.value;
    files[monthIndex] = file;
    this.fileForm.patchValue({ quarterlyReverseFiles: files });
    this.readQuarterlyExcelFile(file, 'reverse', monthIndex);
  }

  readExcelFile(file: File, type: string) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      if (type === 'forward') {
        this.gstService.setForwardData(jsonData);
      } else {
        this.gstService.setReverseData(jsonData);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  readQuarterlyExcelFile(file: File, type: string, monthIndex: number) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      if (type === 'forward') {
        this.gstService.setQuarterlyForwardData(jsonData, monthIndex);
      } else {
        this.gstService.setQuarterlyReverseData(jsonData, monthIndex);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  canGenerateJson(): boolean {
    if (!this.gstForm.valid) return false;

    const isQuarterly = this.gstForm.get('frequencyType')?.value === 'quarterly';
    
    if (isQuarterly) {
      const forwardFiles = this.fileForm.get('quarterlyForwardFiles')?.value;
      const reverseFiles = this.fileForm.get('quarterlyReverseFiles')?.value;
      return forwardFiles.every((f: File) => f) && reverseFiles.every((f: File) => f);
    }

    return !!this.fileForm.get('forwardFile')?.value && 
           !!this.fileForm.get('reverseFile')?.value;
  }

  generateJson() {
    if (this.canGenerateJson()) {
      this.gstService.generateGstJson(this.gstForm.value).subscribe({
        next: (jsonData) => {
          const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          saveAs(blob, `gst_return_${this.gstForm.value.period}_${this.gstForm.value.year}.json`);
          this.snackBar.open('JSON file generated successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        },
        error: (error) => {
          console.error('Error generating JSON:', error);
          this.snackBar.open('Error generating JSON file', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        }
      });
    }
  }
}