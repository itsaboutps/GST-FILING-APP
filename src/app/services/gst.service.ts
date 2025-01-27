import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

interface GstFormData {
  gstin: string;
  frequencyType: string;
  period: string | number;
  year: number;
  ecommerceGstin: string;
}

@Injectable({
  providedIn: 'root'
})
export class GstService {
  private forwardData: any[] = [];
  private reverseData: any[] = [];
  private quarterlyForwardData: any[][] = [[], [], []];
  private quarterlyReverseData: any[][] = [[], [], []];

  resetData() {
    this.forwardData = [];
    this.reverseData = [];
    this.quarterlyForwardData = [[], [], []];
    this.quarterlyReverseData = [[], [], []];
  }

  setForwardData(data: any[]) {
    this.forwardData = data;
  }

  setReverseData(data: any[]) {
    this.reverseData = data;
  }

  setQuarterlyForwardData(data: any[], monthIndex: number) {
    this.quarterlyForwardData[monthIndex] = data;
  }

  setQuarterlyReverseData(data: any[], monthIndex: number) {
    this.quarterlyReverseData[monthIndex] = data;
  }

  generateGstJson(formData: GstFormData): Observable<any> {
    const gstJson = {
      gstin: formData.gstin,
      fp: this.formatPeriod(formData.period, formData.year),
      version: "GST3.1.6",
      hash: "hash",
      b2cs: this.processB2CSData(this.forwardData),
      supeco: {
        clttx: this.processReverseData(this.reverseData, formData.ecommerceGstin)
      }
    };

    return of(gstJson);
  }

  private formatPeriod(period: string | number, year: number): string {
    if (typeof period === 'number') {
      return `${period.toString().padStart(2, '0')}${year}`;
    }
    return `${this.getQuarterLastMonth(period)}${year}`;
  }

  private getQuarterLastMonth(quarter: string): string {
    const quarterMap: { [key: string]: string } = {
      'Q1': '06',
      'Q2': '09',
      'Q3': '12',
      'Q4': '03'
    };
    return quarterMap[quarter];
  }

  private processB2CSData(data: any[]): any[] {
    if (!data.length) return [];

    const entries = data.map(row => ({
      sply_ty: row.sply_ty || 'INTER',
      rt: parseFloat(row.rt) || 3,
      typ: row.typ || 'OE',
      pos: row.pos?.toString().padStart(2, '0') || '09',
      txval: this.roundAmount(parseFloat(row.txval) || 0),
      iamt: row.sply_ty === 'INTRA' ? undefined : this.roundAmount(parseFloat(row.iamt) || 0),
      camt: row.sply_ty === 'INTRA' ? this.roundAmount(parseFloat(row.camt) || 0) : undefined,
      samt: row.sply_ty === 'INTRA' ? this.roundAmount(parseFloat(row.samt) || 0) : undefined,
      csamt: this.roundAmount(parseFloat(row.csamt) || 0)
    }));

    // Remove undefined properties
    return entries.map(entry => {
      const cleanEntry = { ...entry };
      Object.keys(cleanEntry).forEach(key => {
        // if (cleanEntry[key] === undefined) {
        //   delete cleanEntry[key];
        // }
      });
      return cleanEntry;
    });
  }

  private processReverseData(data: any[], ecommerceGstin: string): any[] {
    if (!data.length) {
      return [{
        etin: ecommerceGstin,
        suppval: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        cess: 0,
        flag: "N"
      }];
    }

    const totals = data.reduce((acc, curr) => ({
      suppval: acc.suppval + (parseFloat(curr.suppval) || 0),
      igst: acc.igst + (parseFloat(curr.igst) || 0),
      cgst: acc.cgst + (parseFloat(curr.cgst) || 0),
      sgst: acc.sgst + (parseFloat(curr.sgst) || 0),
      cess: acc.cess + (parseFloat(curr.cess) || 0)
    }), { suppval: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 });

    return [{
      etin: ecommerceGstin,
      suppval: this.roundAmount(totals.suppval),
      igst: this.roundAmount(totals.igst),
      cgst: this.roundAmount(totals.cgst),
      sgst: this.roundAmount(totals.sgst),
      cess: this.roundAmount(totals.cess),
      flag: "N"
    }];
  }

  private roundAmount(amount: number): number {
    return Number((Math.round(amount * 100) / 100).toFixed(2));
  }
}