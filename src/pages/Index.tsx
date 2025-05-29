
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { LicensePlateInput } from '@/components/LicensePlateInput';
import { ResultsTable } from '@/components/ResultsTable';
import { VehicleData } from '@/types/vehicle';
import { toast } from 'sonner';

const Index = () => {
  const [vehicleData, setVehicleData] = useState<VehicleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleLicensePlatesSubmit = async (licensePlates: string[]) => {
    setIsLoading(true);
    setProgress(0);
    setVehicleData([]);
    
    try {
      const results: VehicleData[] = [];
      const total = licensePlates.length;
      
      for (let i = 0; i < licensePlates.length; i++) {
        const plate = licensePlates[i].trim().toUpperCase();
        if (!plate) continue;
        
        // Remove dashes from license plate for API call
        const plateForApi = plate.replace(/-/g, '');
        
        try {
          const response = await fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${plateForApi}`);
          const data = await response.json();
          
          if (data && data.length > 0) {
            const vehicle = data[0];
            results.push({
              kenteken: vehicle.kenteken || plate,
              merk: vehicle.merk || 'Unknown',
              handelsbenaming: vehicle.handelsbenaming || 'Unknown',
              apkVervaldatum: vehicle.vervaldatum_apk || 'Unknown',
              datumEersteToelating: vehicle.datum_eerste_toelating || 'Unknown',
              wamVerzekerd: vehicle.wam_verzekerd || 'Unknown',
              geschorst: vehicle.geschorst || 'No',
              status: 'found'
            });
          } else {
            results.push({
              kenteken: plate,
              merk: 'Not Found',
              handelsbenaming: 'Not Found',
              apkVervaldatum: 'Not Found',
              datumEersteToelating: 'Not Found',
              wamVerzekerd: 'Not Found',
              geschorst: 'Not Found',
              status: 'error'
            });
          }
        } catch (error) {
          console.error(`Error fetching data for ${plate}:`, error);
          results.push({
            kenteken: plate,
            merk: 'Error',
            handelsbenaming: 'Error',
            apkVervaldatum: 'Error',
            datumEersteToelating: 'Error',
            wamVerzekerd: 'Error',
            geschorst: 'Error',
            status: 'error'
          });
        }
        
        setProgress(((i + 1) / total) * 100);
        setVehicleData([...results]);
        
        // Small delay to prevent overwhelming the API
        if (i < licensePlates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      toast.success(`Processed ${results.length} license plates successfully`);
    } catch (error) {
      console.error('Error processing license plates:', error);
      toast.error('Error processing license plates');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🇳🇱 Dutch License Plate Verifier
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Verify vehicle information and insurance status using RDW Open Data
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-blue-700">
              Input License Plates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="text">Text Input</TabsTrigger>
                <TabsTrigger value="file">Excel Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="text">
                <LicensePlateInput 
                  onSubmit={handleLicensePlatesSubmit}
                  isLoading={isLoading}
                />
              </TabsContent>
              
              <TabsContent value="file">
                <FileUpload 
                  onSubmit={handleLicensePlatesSubmit}
                  isLoading={isLoading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {(isLoading || vehicleData.length > 0) && (
          <ResultsTable 
            data={vehicleData}
            isLoading={isLoading}
            progress={progress}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
