import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  formGroup = new FormGroup({
    cad: new FormControl<number | undefined>(undefined),
    eur: new FormControl<number | undefined>(undefined),
    tps: new FormControl<number | undefined>({value: undefined, disabled: true}),
    tvq: new FormControl<number | undefined>({value: undefined, disabled: true}),
    cadTtc: new FormControl<number | undefined>(undefined),
    eurTtc: new FormControl<number | undefined>(undefined),
  });

  exchangeRate = 0;
  tpsValue = 0.05;
  tvqValue = 0.09975;
  exchangeRateError = false;

  get cad() { return this.formGroup.get('cad')!; }
  get eur() { return this.formGroup.get('eur')!; }
  get tps() { return this.formGroup.get('tps')!; }
  get tvq() { return this.formGroup.get('tvq')!; }
  get cadTtc() { return this.formGroup.get('cadTtc')!; }
  get eurTtc() { return this.formGroup.get('eurTtc')!; }

  constructor(private httpClient: HttpClient) {}

  ngOnInit() {
    console.log('init');
    this.httpClient.get<{ date: Date, cad: number }>("https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/eur/cad.json").subscribe((res) => {
      this.exchangeRate = res.cad;
      localStorage.setItem("exchangeRate", res.cad.toString());
    }, error => {
      const exchangeRate = localStorage.getItem('exchangeRate');
      if (exchangeRate) {
        this.exchangeRate = +exchangeRate;
      } else {
        this.exchangeRateError = true;
      }
    })

    this.cad.valueChanges.subscribe(cad => {
      if (!cad) {
        this.formGroup.reset(undefined, { emitEvent: false });
        return;
      }
      this.eur.setValue(this.round(cad / this.exchangeRate), { emitEvent: false });
      this.refreshTaxes();
      this.refreshTtc();
    });

    this.eur.valueChanges.subscribe(eur => {
      if (!eur) {
        this.formGroup.reset(undefined, { emitEvent: false });
        return;
      }
      this.cad.setValue(this.round(eur * this.exchangeRate), { emitEvent: false });
      this.refreshTaxes();
      this.refreshTtc();
    });

    this.cadTtc.valueChanges.subscribe(cadTtc => {
      if (!cadTtc) {
        this.formGroup.reset(undefined, { emitEvent: false });
        return;
      }
      this.eurTtc.setValue(this.round(cadTtc! / this.exchangeRate), { emitEvent: false });
      this.refreshHt();
      this.refreshTaxes();
    });

    this.eurTtc.valueChanges.subscribe(eurTtc => {
      if (!eurTtc) {
        this.formGroup.reset(undefined, { emitEvent: false });
        return;
      }
      this.cadTtc.setValue(this.round(eurTtc! * this.exchangeRate), { emitEvent: false });
      this.refreshHt();
      this.refreshTaxes();
    });
  }

  refreshTaxes() {
    this.tps.setValue(this.round(this.cad.value! * this.tpsValue));
    this.tvq.setValue(this.round(this.cad.value! * this.tvqValue));
  }

  refreshTtc() {
    this.cadTtc.setValue(this.round(this.cad.value! + this.tps.value! + this.tvq.value!), { emitEvent: false });
    this.eurTtc.setValue(this.round(this.cadTtc.value! / this.exchangeRate), { emitEvent: false });
  }

  refreshHt() {
    this.cad.setValue(this.round(this.cadTtc.value! / (1 + this.tpsValue + this.tvqValue)), { emitEvent: false });
    this.eur.setValue(this.round(this.cad.value! / this.exchangeRate), { emitEvent: false });
  }

  round(n: number) {
    return Math.round(n * 1000) / 1000
  }
}
