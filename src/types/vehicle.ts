
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
}
