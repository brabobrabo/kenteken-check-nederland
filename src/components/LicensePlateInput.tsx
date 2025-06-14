
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ColumnSettings } from '@/components/ColumnSettings';
import { useColumnReorder, ColumnConfig } from '@/hooks/useColumnReorder';

// Default column configuration - matches what's in ResultsTable
const defaultColumns: ColumnConfig[] = [
  { key: 'kenteken', label: 'License Plate', visible: true },
  { key: 'merk', label: 'Brand', visible: true },
  { key: 'handelsbenaming', label: 'Model', visible: true },
  { key: 'apkVervaldatum', label: 'APK Expiry', visible: true },
  { key: 'datumEersteToelating', label: 'First Registration', visible: true },
  { key: 'wamVerzekerd', label: 'Insured', visible: true },
  { key: 'geschorst', label: 'Suspended', visible: true },
  { key: 'voertuigsoort', label: 'Vehicle Type', visible: false },
  { key: 'eerste_kleur', label: 'Primary Color', visible: false },
  { key: 'tweede_kleur', label: 'Secondary Color', visible: false },
  { key: 'aantal_zitplaatsen', label: 'Seats', visible: false },
  { key: 'aantal_staanplaatsen', label: 'Standing Places', visible: false },
  { key: 'datum_eerste_afgifte_nederland', label: 'First Issue NL', visible: false },
  { key: 'aantal_cilinders', label: 'Cylinders', visible: false },
  { key: 'cilinder_inhoud', label: 'Engine Displacement', visible: false },
  { key: 'massa_ledig_voertuig', label: 'Empty Weight', visible: false },
  { key: 'toegestane_maximum_massa_voertuig', label: 'Max Weight', visible: false },
  { key: 'massa_rijklaar', label: 'Curb Weight', visible: false },
  { key: 'maximum_massa_trekken_ongeremd', label: 'Max Towing Unbraked', visible: false },
  { key: 'maximum_massa_trekken_geremd', label: 'Max Towing Braked', visible: false },
  { key: 'datum_afgifte_kenteken', label: 'License Issue Date', visible: false },
  { key: 'vervaldatum_apk', label: 'APK Expiry Date', visible: false },
  { key: 'inrichting', label: 'Configuration', visible: false },
  { key: 'aantal_wielen', label: 'Wheels', visible: false },
  { key: 'aantal_assen', label: 'Axles', visible: false },
  { key: 'vervaldatum_tachograaf', label: 'Tachograph Expiry', visible: false },
  { key: 'taxi_indicator', label: 'Taxi', visible: false },
  { key: 'maximum_snelheid', label: 'Max Speed', visible: false },
  { key: 'laadvermogen', label: 'Load Capacity', visible: false },
  { key: 'oplegger_geremd', label: 'Trailer Braked', visible: false },
  { key: 'aanhangwagen_autonoom_geremd', label: 'Trailer Auto Braked', visible: false },
  { key: 'aanhangwagen_middenas_geremd', label: 'Trailer Center Braked', visible: false },
  { key: 'aantal_deuren', label: 'Doors', visible: false },
  { key: 'aantal_wielen_aangedreven', label: 'Driven Wheels', visible: false },
  { key: 'lengte', label: 'Length', visible: false },
  { key: 'breedte', label: 'Width', visible: false },
  { key: 'europese_voertuigcategorie', label: 'EU Vehicle Category', visible: false },
  { key: 'europese_voertuigcategorie_toevoeging', label: 'EU Category Addition', visible: false },
  { key: 'europese_uitvoeringcategorie_toevoeging', label: 'EU Execution Addition', visible: false },
  { key: 'plaats_chassisnummer', label: 'Chassis Number Location', visible: false },
  { key: 'technische_max_massa_voertuig', label: 'Technical Max Mass', visible: false },
  { key: 'type', label: 'Type', visible: false },
  { key: 'type_gasinstallatie', label: 'Gas Installation Type', visible: false },
  { key: 'typegoedkeuringsnummer', label: 'Type Approval Number', visible: false },
  { key: 'variant', label: 'Variant', visible: false },
  { key: 'uitvoering', label: 'Execution', visible: false },
  { key: 'volgnummer_wijziging_eu_typegoedkeuring', label: 'EU Type Approval Change', visible: false },
  { key: 'vermogen_massarijklaar', label: 'Power Mass Ready', visible: false },
  { key: 'wielbasis', label: 'Wheelbase', visible: false },
  { key: 'openstaande_terugroepactie_indicator', label: 'Recall Indicator', visible: false },
  { key: 'vervaldatum_apk_dt', label: 'APK Expiry DateTime', visible: false },
  { key: 'aantal_rolstoelplaatsen', label: 'Wheelchair Places', visible: false },
  { key: 'maximum_ondersteunende_snelheid', label: 'Max Support Speed', visible: false },
  { key: 'jaar_laatste_registratie_tellerstand', label: 'Last Odometer Year', visible: false },
  { key: 'tellerstandoordeel', label: 'Odometer Judgment', visible: false },
  { key: 'code_toelichting_tellerstandoordeel', label: 'Odometer Code', visible: false },
  { key: 'tenaamstelling_dt', label: 'Registration DateTime', visible: false },
  { key: 'vervaldatum_tachograaf_dt', label: 'Tachograph Expiry DateTime', visible: false },
  { key: 'maximum_last_onder_de_vooras_sen', label: 'Max Front Axle Load', visible: false },
  { key: 'type_remsysteem_voertuig_code', label: 'Brake System Code', visible: false },
  { key: 'rupsonderstelconfiguratie', label: 'Track Configuration', visible: false },
  { key: 'wielbasis_voertuig_minimum', label: 'Min Wheelbase', visible: false },
  { key: 'wielbasis_voertuig_maximum', label: 'Max Wheelbase', visible: false },
  { key: 'lengte_voertuig_minimum', label: 'Min Length', visible: false },
  { key: 'lengte_voertuig_maximum', label: 'Max Length', visible: false },
  { key: 'breedte_voertuig_minimum', label: 'Min Width', visible: false },
  { key: 'breedte_voertuig_maximum', label: 'Max Width', visible: false },
  { key: 'hoogte_voertuig', label: 'Height', visible: false },
  { key: 'hoogte_voertuig_minimum', label: 'Min Height', visible: false },
  { key: 'hoogte_voertuig_maximum', label: 'Max Height', visible: false },
  { key: 'massa_bedrijfsklaar_minimum', label: 'Min Ready Mass', visible: false },
  { key: 'massa_bedrijfsklaar_maximum', label: 'Max Ready Mass', visible: false },
  { key: 'technische_max_massa_beklading', label: 'Max Load Mass', visible: false },
  { key: 'type_opbouw', label: 'Body Type', visible: false },
  { key: 'catalogusprijs', label: 'Catalog Price', visible: false },
  { key: 'zuinigheidslabel', label: 'Efficiency Label', visible: false },
  { key: 'co2_uitstoot_gecombineerd', label: 'CO2 Combined', visible: false },
  { key: 'co2_uitstoot_gewogen', label: 'CO2 Weighted', visible: false },
  { key: 'netto_max_vermogen', label: 'Net Max Power', visible: false },
  { key: 'nominaal_continu_maximum_vermogen', label: 'Nominal Max Power', visible: false },
  { key: 'nettomaximumvermogen_hybride_elektrisch', label: 'Hybrid Max Power', visible: false },
  { key: 'elektrisch_bereik', label: 'Electric Range', visible: false },
  { key: 'brandstof_verbruik_buiten', label: 'Fuel Consumption Outside', visible: false },
  { key: 'brandstof_verbruik_gecombineerd', label: 'Fuel Consumption Combined', visible: false },
  { key: 'brandstof_verbruik_stad', label: 'Fuel Consumption City', visible: false },
  { key: 'geluidsniveau_rijdend', label: 'Driving Noise Level', visible: false },
  { key: 'geluidsniveau_stationair', label: 'Idle Noise Level', visible: false },
];

interface LicensePlateInputProps {
  onSubmit: (licensePlates: string[], columnConfig?: ColumnConfig[]) => void;
  isLoading: boolean;
}

export const LicensePlateInput: React.FC<LicensePlateInputProps> = ({
  onSubmit,
  isLoading
}) => {
  const [inputText, setInputText] = useState('');
  
  const {
    columns,
    moveColumn,
    toggleColumnVisibility,
    resetColumns
  } = useColumnReorder(defaultColumns, 'license-plate-input-columns');

  const handleSubmit = () => {
    const licensePlates = inputText
      .split('\n')
      .map(plate => plate.trim())
      .filter(plate => plate.length > 0);
    
    if (licensePlates.length === 0) {
      return;
    }
    
    onSubmit(licensePlates, columns);
  };

  const examplePlates = ['1-ABC-23', '12-AB-34', 'AB-123-C'].join('\n');

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="licensePlates" className="text-lg font-medium">
          Enter License Plates (one per line)
        </Label>
        <Textarea
          id="licensePlates"
          placeholder={`Enter license plates, one per line:\n\nExample:\n${examplePlates}`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="mt-2 min-h-[200px] font-mono"
          disabled={isLoading}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {inputText.split('\n').filter(line => line.trim()).length} license plates entered
        </div>
        
        <div className="flex gap-2">
          <ColumnSettings
            columns={columns}
            onMoveColumn={moveColumn}
            onToggleVisibility={toggleColumnVisibility}
            onReset={resetColumns}
          />
          
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || inputText.trim().length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Processing...' : 'Verify License Plates'}
          </Button>
        </div>
      </div>
    </div>
  );
};
