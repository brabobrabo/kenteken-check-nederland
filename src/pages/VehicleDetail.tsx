
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { VehicleData } from '@/types/vehicle';
import { toast } from 'sonner';

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
            catalogusprijs: vehicle.catalogusprijs || 'Unknown',
            datumEersteToelating: vehicle.datum_eerste_toelating || 'Unknown',
            wamVerzekerd: vehicle.wam_verzekerd || 'Unknown',
            geschorst: vehicle.geschorst || 'No',
            status: 'found'
          });
        } else {
          toast.error('Vehicle not found');
          setVehicleData({
            kenteken: kenteken,
            merk: 'Not Found',
            handelsbenaming: 'Not Found',
            apkVervaldatum: 'Not Found',
            catalogusprijs: 'Not Found',
            datumEersteToelating: 'Not Found',
            wamVerzekerd: 'Not Found',
            geschorst: 'Not Found',
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
          catalogusprijs: 'Error',
          datumEersteToelating: 'Error',
          wamVerzekerd: 'Error',
          geschorst: 'Error',
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Vehicle Details: {kenteken}
          </h1>
        </div>

        {vehicleData && (
          <>
            {/* Main Vehicle Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-700 flex items-center gap-3">
                  🚗 Vehicle Information
                  <Badge
                    variant={vehicleData.status === 'found' ? 'default' : 'destructive'}
                    className={vehicleData.status === 'found' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {vehicleData.status === 'found' ? 'Found' : 'Error'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">License Plate</label>
                      <p className="text-lg font-mono font-bold text-blue-700">{vehicleData.kenteken}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Make</label>
                      <p className="text-lg">{vehicleData.merk}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Model</label>
                      <p className="text-lg">{vehicleData.handelsbenaming}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Catalog Price</label>
                      <p className="text-lg">{vehicleData.catalogusprijs}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">MOT Expiration</label>
                      <p className="text-lg">{vehicleData.apkVervaldatum}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">First Admission</label>
                      <p className="text-lg">{formatDate(vehicleData.datumEersteToelating)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">WAM Insured</label>
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
                    <div>
                      <label className="text-sm font-medium text-gray-500">Suspended</label>
                      <p className="text-lg">{vehicleData.geschorst}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Raw API Data */}
            {rawApiData && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-blue-700">📊 Complete API Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(rawApiData, null, 2)}
                    </pre>
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
