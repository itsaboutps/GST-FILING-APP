import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  template: `
    <div class="file-upload" [class.file-uploaded]="fileName">
      <input type="file" 
             #fileInput
             [accept]="accept"
             (change)="onFileSelected($event)"
             style="display: none">
      <button mat-stroked-button 
              type="button"
              (click)="fileInput.click()"
              class="upload-button">
        <mat-icon>cloud_upload</mat-icon>
        {{fileName || 'Choose file'}}
      </button>
    </div>
  `,
  styles: [`
    .file-upload {
      margin: 1rem 0;
    }
    .upload-button {
      width: 100%;
      padding: 1rem;
    }
    .file-uploaded .upload-button {
      color: #4caf50;
    }
    mat-icon {
      margin-right: 8px;
    }
  `]
})
export class FileUploadComponent {
  @Input() accept = '.xlsx,.xls';
  @Output() fileSelected = new EventEmitter<File>();
  
  fileName = '';

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      this.fileSelected.emit(file);
    }
  }
}