import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Download } from 'lucide-react';
import { VehicleData } from '@/types/vehicle';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const VehicleDetail = () => {
  const { kenteken } = useParams<{ kenteken: string }>();
  const navigate = useNavigate();
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rawApiData, setRawApiData] = useState<any>(null);

  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!kenteken) return;
      
      setIsLoading(true);
      try {
        // Remove dashes from license plate for API call
        const plateForApi = kenteken.replace(/-/g, '');
        
        const response = await fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${plateForApi}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          const vehicle = data[0];
          setRawApiData(vehicle);
          setVehicleData({
            kenteken: vehicle.kenteken || kenteken,
            merk: vehicle.merk || 'Unknown',
            handelsbenaming: vehicle.handelsbenaming || 'Unknown',
            apkVervaldatum: vehicle.vervaldatum_apk || 'Unknown',
            datumEersteToelating: vehicle.datum_eerste_toelating || 'Unknown',
            wamVerzekerd: vehicle.wam_verzekerd || 'Unknown',
            geschorst: vehicle.geschorst || 'No',
            datumTenaamstelling: vehicle.datum_tenaamstelling || 'Unknown',
            datumEersteTenaamstellingInNederlandDt: vehicle.datum_eerste_tenaamstelling_in_nederland_dt || 'Unknown',
            exportIndicator: vehicle.export_indicator || 'Unknown',
            tenaamstellenMogelijk: vehicle.tenaamstellen_mogelijk || 'Unknown',
            status: 'found'
          });
        } else {
          toast.error('Vehicle not found');
          setVehicleData({
            kenteken: kenteken,
            merk: 'Not Found',
            handelsbenaming: 'Not Found',
            apkVervaldatum: 'Not Found',
            datumEersteToelating: 'Not Found',
            wamVerzekerd: 'Not Found',
            geschorst: 'Not Found',
            datumTenaamstelling: 'Not Found',
            datumEersteTenaamstellingInNederlandDt: 'Not Found',
            exportIndicator: 'Not Found',
            tenaamstellenMogelijk: 'Not Found',
            status: 'error'
          });
        }
      } catch (error) {
        console.error(`Error fetching data for ${kenteken}:`, error);
        toast.error('Error fetching vehicle data');
        setVehicleData({
          kenteken: kenteken,
          merk: 'Error',
          handelsbenaming: 'Error',
          apkVervaldatum: 'Error',
          datumEersteToelating: 'Error',
          wamVerzekerd: 'Error',
          geschorst: 'Error',
          datumTenaamstelling: 'Error',
          datumEersteTenaamstellingInNederlandDt: 'Error',
          exportIndicator: 'Error',
          tenaamstellenMogelijk: 'Error',
          status: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicleData();
  }, [kenteken]);

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Unknown' || dateString === 'Not Found' || dateString === 'Error') {
      return dateString;
    }
    
    try {
      // Handle YYYYMMDD format
      if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        return `${day}-${month}-${year}`;
      }
      
      // Handle other date formats
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('nl-NL');
      }
      
      return dateString;
    } catch {
      return dateString;
    }
  };

  const formatValue = (key: string, value: any) => {
    if (!value || value === '') return 'Not Available';
    
    // Format dates
    if (key.includes('datum') || key.includes('date')) {
      return formatDate(value.toString());
    }
    
    // Format Yes/No values
    if (key.includes('verzekerd') || key.includes('geschorst')) {
      return (
        <Badge
          variant={
            value.toLowerCase() === 'ja' || value.toLowerCase() === 'yes'
              ? 'default'
              : value === 'Not Available'
              ? 'destructive'
              : 'secondary'
          }
          className={
            value.toLowerCase() === 'ja' || value.toLowerCase() === 'yes'
              ? 'bg-green-100 text-green-800'
              : ''
          }
        >
          {value}
        </Badge>
      );
    }
    
    return value.toString();
  };

  const formatFieldName = (key: string) => {
    const fieldNames: { [key: string]: string } = {
      kenteken: 'License Plate',
      merk: 'Make',
      handelsbenaming: 'Model/Trade Name',
      voertuigsoort: 'Vehicle Type',
      eerste_kleur: 'Primary Color',
      tweede_kleur: 'Secondary Color',
      aantal_zitplaatsen: 'Number of Seats',
      aantal_staanplaatsen: 'Standing Places',
      datum_eerste_toelating: 'First Admission Date',
      datum_eerste_afgifte_nederland: 'First Issue Netherlands',
      wam_verzekerd: 'WAM Insured',
      aantal_cilinders: 'Number of Cylinders',
      cilinder_inhoud: 'Engine Displacement',
      massa_ledig_voertuig: 'Empty Vehicle Mass',
      toegestane_maximum_massa_voertuig: 'Maximum Allowed Mass',
      massa_rijklaar: 'Ready-to-Drive Mass',
      maximum_massa_trekken_ongeremd: 'Max Unbraked Trailer Mass',
      maximum_massa_trekken_geremd: 'Max Braked Trailer Mass',
      datum_afgifte_kenteken: 'License Plate Issue Date',
      datum_eerste_tenaamstelling: 'First Registration Date',
      vervaldatum_apk: 'MOT Expiration Date',
      dt_laatste_status_wijziging: 'Last Status Change',
      inrichting: 'Configuration',
      aantal_wielen: 'Number of Wheels',
      aantal_assen: 'Number of Axles',
      vervaldatum_tachograaf: 'Tachograph Expiration',
      taxi_indicator: 'Taxi Indicator',
      maximum_snelheid: 'Maximum Speed',
      laadvermogen: 'Load Capacity',
      oplegger_geremd: 'Semi-trailer Braked',
      aanhangwagen_autonoom_geremd: 'Autonomous Braked Trailer',
      aanhangwagen_middenas_geremd: 'Center Axle Braked Trailer',
      aantal_deuren: 'Number of Doors',
      aantal_wielen_aangedreven: 'Driven Wheels',
      geschorst: 'Suspended',
      lengte: 'Length',
      breedte: 'Width',
      europese_voertuigcategorie: 'European Vehicle Category',
      europese_voertuigcategorie_toevoeging: 'European Category Addition',
      europese_uitvoeringcategorie_toevoeging: 'European Implementation Addition',
      plaats_chassisnummer: 'Chassis Number Location',
      technische_max_massa_voertuig: 'Technical Max Vehicle Mass',
      type: 'Type',
      type_gasinstallatie: 'Gas Installation Type',
      typegoedkeuringsnummer: 'Type Approval Number',
      variant: 'Variant',
      uitvoering: 'Version',
      volgnummer_wijziging_eu_typegoedkeuring: 'EU Type Approval Change Number',
      vermogen_massarijklaar: 'Power Mass Ready',
      wielbasis: 'Wheelbase',
      export_indicator: 'Export Indicator',
      openstaande_terugroepactie_indicator: 'Outstanding Recall Indicator',
      vervaldatum_apk_dt: 'MOT Expiration Date (DT)',
      aantal_rolstoelplaatsen: 'Wheelchair Places',
      maximum_ondersteunende_snelheid: 'Maximum Supporting Speed',
      jaar_laatste_registratie_tellerstand: 'Last Odometer Registration Year',
      tellerstandoordeel: 'Odometer Judgment',
      code_toelichting_tellerstandoordeel: 'Odometer Judgment Code',
      tenaamstelling_dt: 'Registration Date (DT)',
      vervaldatum_tachograaf_dt: 'Tachograph Expiration (DT)',
      maximum_last_onder_de_vooras_sen: 'Max Load Front Axles',
      type_remsysteem_voertuig_code: 'Vehicle Brake System Code',
      rupsonderstelconfiguratie: 'Track Configuration',
      wielbasis_voertuig_minimum: 'Vehicle Wheelbase Minimum',
      wielbasis_voertuig_maximum: 'Vehicle Wheelbase Maximum',
      lengte_voertuig_minimum: 'Vehicle Length Minimum',
      lengte_voertuig_maximum: 'Vehicle Length Maximum',
      breedte_voertuig_minimum: 'Vehicle Width Minimum',
      breedte_voertuig_maximum: 'Vehicle Width Maximum',
      hoogte_voertuig: 'Vehicle Height',
      hoogte_voertuig_minimum: 'Vehicle Height Minimum',
      hoogte_voertuig_maximum: 'Vehicle Height Maximum',
      massa_bedrijfsklaar_minimum: 'Ready-to-Operate Mass Minimum',
      massa_bedrijfsklaar_maximum: 'Ready-to-Operate Mass Maximum',
      technische_max_massa_beklading: 'Technical Max Load Mass',
      type_opbouw: 'Body Type',
      catalogusprijs: 'Catalog Price',
      zuinigheidslabel: 'Efficiency Label',
      co2_uitstoot_gecombineerd: 'CO2 Emission Combined',
      co2_uitstoot_gewogen: 'CO2 Emission Weighted',
      netto_max_vermogen: 'Net Max Power',
      nominaal_continu_maximum_vermogen: 'Nominal Continuous Max Power',
      nettomaximumvermogen_hybride_elektrisch: 'Net Max Power Hybrid Electric',
      elektrisch_bereik: 'Electric Range',
      brandstof_verbruik_buiten: 'Fuel Consumption Outside',
      brandstof_verbruik_gecombineerd: 'Fuel Consumption Combined',
      brandstof_verbruik_stad: 'Fuel Consumption City',
      geluidsniveau_rijdend: 'Noise Level Driving',
      geluidsniveau_stationair: 'Noise Level Stationary'
    };
    
    return fieldNames[key] || key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getFilteredApiData = (data: any) => {
    if (!data) return {};
    
    const fieldsToExclude = [
      'registratie_datum_goedkeuring_afschrijvingsmoment_bpm',
      'registratie_datum_goedkeuring_afschrijvingsmoment_bpm_dt',
      'api_gekentekende_voertuigen_assen',
      'api_gekentekende_voertuigen_brandstof',
      'api_gekentekende_voertuigen_carrosserie',
      'api_gekentekende_voertuigen_carrosserie_specifiek',
      'api_gekentekende_voertuigen_voertuigklasse'
    ];
    
    const filteredData = { ...data };
    fieldsToExclude.forEach(field => {
      delete filteredData[field];
    });
    
    return filteredData;
  };

  const exportToExcel = () => {
    if (!rawApiData || !vehicleData) {
      toast.error('No data available to export');
      return;
    }

    try {
      const filteredData = getFilteredApiData(rawApiData);
      
      // Prepare data for Excel export
      const exportData = Object.entries(filteredData).map(([key, value]) => ({
        Field: formatFieldName(key),
        Value: value ? value.toString() : 'Not Available'
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Add the worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicle Details');

      // Generate filename with license plate
      const filename = `Vehicle_Details_${vehicleData.kenteken.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

      // Write the file
      XLSX.writeFile(workbook, filename);
      
      toast.success('Vehicle details exported to Excel successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export vehicle details');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span className="text-lg">Loading vehicle data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-2 sm:mb-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Search</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex-1">
            <span className="block sm:inline">Vehicle Details:</span>
            <span className="block sm:inline mt-1 sm:mt-0 sm:ml-2">{kenteken}</span>
          </h1>
          {vehicleData && vehicleData.status === 'found' && (
            <Button 
              onClick={exportToExcel}
              className="flex items-center gap-2 w-full sm:w-auto"
              size="sm"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export to Excel</span>
              <span className="sm:hidden">Export</span>
            </Button>
          )}
        </div>

        {vehicleData && (
          <>
            {/* Main Vehicle Information */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-2xl text-blue-700 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <span>Vehicle Information</span>
                  <Badge
                    variant={vehicleData.status === 'found' ? 'default' : 'destructive'}
                    className={vehicleData.status === 'found' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {vehicleData.status === 'found' ? 'Found' : 'Error'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">License Plate</label>
                      <p className="text-lg font-mono font-bold text-blue-700">{vehicleData.kenteken}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Make</label>
                      <p className="text-base sm:text-lg break-words">{vehicleData.merk}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Model</label>
                      <p className="text-base sm:text-lg break-words">{vehicleData.handelsbenaming}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registration Date</label>
                      <p className="text-base sm:text-lg">{formatDate(vehicleData.datumTenaamstelling)}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">MOT Expiration</label>
                      <p className="text-base sm:text-lg">{vehicleData.apkVervaldatum}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">First Admission</label>
                      <p className="text-base sm:text-lg">{formatDate(vehicleData.datumEersteToelating)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">WAM Insured</label>
                      <div className="mt-1">
                        <Badge
                          variant={
                            vehicleData.wamVerzekerd.toLowerCase() === 'ja' || 
                            vehicleData.wamVerzekerd.toLowerCase() === 'yes'
                              ? 'default'
                              : vehicleData.wamVerzekerd === 'Not Found' || vehicleData.wamVerzekerd === 'Error'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={
                            vehicleData.wamVerzekerd.toLowerCase() === 'ja' || 
                            vehicleData.wamVerzekerd.toLowerCase() === 'yes'
                              ? 'bg-green-100 text-green-800'
                              : ''
                          }
                        >
                          {vehicleData.wamVerzekerd}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Export Indicator</label>
                      <p className="text-base sm:text-lg">{vehicleData.exportIndicator}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Complete Vehicle Data */}
            {rawApiData && (
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-2xl text-blue-700">Complete Vehicle Data</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {Object.entries(getFilteredApiData(rawApiData)).map(([key, value]) => (
                      <div key={key} className="space-y-1 p-3 bg-gray-50 rounded-lg">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block">
                          {formatFieldName(key)}
                        </label>
                        <div className="text-sm break-words">
                          {formatValue(key, value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VehicleDetail;
