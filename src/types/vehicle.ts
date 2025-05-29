
export interface VehicleData {
  kenteken: string;
  merk: string;
  handelsbenaming: string;
  apkVervaldatum: string;
  catalogusprijs: string;
  datumEersteToelating: string;
  wamVerzekerd: string;
  geschorst: string;
  status: 'found' | 'error';
}
