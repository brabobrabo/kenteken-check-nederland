
export interface VehicleData {
  kenteken: string;
  merk: string;
  handelsbenaming: string;
  apkVervaldatum: string;
  datumEersteToelating: string;
  wamVerzekerd: string;
  geschorst: string;
  datumTenaamstelling: string;
  datumEersteTenaamstellingInNederlandDt: string;
  exportIndicator: string;
  tenaamstellenMogelijk: string;
  status: 'found' | 'error';

  // Extra fields needed for table/filters/details:
  voertuigsoort?: string;
  eerste_kleur?: string;
  tweede_kleur?: string;
  aantal_zitplaatsen?: string | number;
  aantal_staanplaatsen?: string | number;
  datum_eerste_afgifte_nederland?: string;
  aantal_cilinders?: string | number;
  cilinder_inhoud?: string | number;
  massa_ledig_voertuig?: string | number;
  toegestane_maximum_massa_voertuig?: string | number;
  massa_rijklaar?: string | number;
  maximum_massa_trekken_ongeremd?: string | number;
  maximum_massa_trekken_geremd?: string | number;
  datum_afgifte_kenteken?: string;
  vervaldatum_apk?: string;
  inrichting?: string;
  aantal_wielen?: string | number;
  aantal_assen?: string | number;
  // Add more fields as needed in future
}

