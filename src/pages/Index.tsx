
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/FileUpload';
import { LicensePlateInput } from '@/components/LicensePlateInput';
import { ResultsTable } from '@/components/ResultsTable';
import { UserMenu } from '@/components/UserMenu';
import { VehicleData } from '@/types/vehicle';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LogIn, Heart, Trash2 } from 'lucide-react';

const CACHE_KEY = 'license_plate_results';

const Index = () => {
  const [vehicleData, setVehicleData] = useState<VehicleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedColumns, setSelectedColumns] = useState<any[]>([]);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Load cached results on component mount
  useEffect(() => {
    const cachedResults = sessionStorage.getItem(CACHE_KEY);
    if (cachedResults) {
      try {
        const parsedResults = JSON.parse(cachedResults);
        setVehicleData(parsedResults);
      } catch (error) {
        console.error('Error parsing cached results:', error);
        sessionStorage.removeItem(CACHE_KEY);
      }
    }
  }, []);

  // Cache results whenever vehicleData changes
  useEffect(() => {
    if (vehicleData.length > 0) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(vehicleData));
    }
  }, [vehicleData]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg text-center">
          <CardContent className="pt-6">
            <LogIn className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to access the license plate verifier.</p>
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLicensePlatesSubmit = async (licensePlates: string[], columnConfig?: any[]) => {
    // Store the column configuration for the ResultsTable
    if (columnConfig) {
      setSelectedColumns(columnConfig);
    }

    // Check if this should be handled as a bulk request
    if (licensePlates.length >= 1000) {
      toast.info('Large dataset detected. Consider using the bulk export mode for better performance.');
    }

    setIsLoading(true);
    setProgress(0);
    setVehicleData([]);
    
    try {
      const results: VehicleData[] = [];
      const total = licensePlates.length;
      const batchSize = licensePlates.length >= 1000 ? 100 : 50;
      
      // Process in batches for better performance
      for (let i = 0; i < licensePlates.length; i += batchSize) {
        const batch = licensePlates.slice(i, i + batchSize);
        
        // Process batch concurrently
        const batchPromises = batch.map(async (plate) => {
          const trimmedPlate = plate.trim().toUpperCase();
          if (!trimmedPlate) return null;
          
          // Remove dashes from license plate for API call
          const plateForApi = trimmedPlate.replace(/-/g, '');
          
          try {
            const response = await fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${plateForApi}`);
            const data = await response.json();
            
            if (data && data.length > 0) {
              const vehicle = data[0];
              return {
                kenteken: vehicle.kenteken || trimmedPlate,
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
                status: 'found' as const
              };
            } else {
              return {
                kenteken: trimmedPlate,
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
                status: 'error' as const
              };
            }
          } catch (error) {
            console.error(`Error fetching data for ${trimmedPlate}:`, error);
            return {
              kenteken: trimmedPlate,
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
              status: 'error' as const
            };
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        const validResults = batchResults
          .filter(result => result.status === 'fulfilled' && result.value !== null)
          .map(result => (result as PromiseFulfilledResult<VehicleData>).value);
        
        results.push(...validResults);
        
        const currentProgress = ((i + batchSize) / total) * 100;
        setProgress(Math.min(currentProgress, 100));
        
        // Update results in batches for better performance
        if (results.length <= 5000) { // Only show in UI for reasonable dataset sizes
          setVehicleData([...results]);
        }
        
        // Small delay to prevent overwhelming the API and give UI time to update
        if (i + batchSize < licensePlates.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      setVehicleData(results);
      toast.success(`Processed ${results.length} license plates successfully`);
    } catch (error) {
      console.error('Error processing license plates:', error);
      toast.error('Error processing license plates');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleClearTable = () => {
    setVehicleData([]);
    setSelectedColumns([]);
    sessionStorage.removeItem(CACHE_KEY);
    toast.success('Table cleared successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center py-4 px-2">
          <div className="text-center flex-1">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
              Dutch License Plate Verifier
            </h1>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Verify vehicle information and insurance status using RDW Open Data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => navigate('/saved')} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Saved Licenses</span>
            </Button>
            {vehicleData.length > 0 && (
              <Button 
                onClick={handleClearTable}
                variant="outline"
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Clear Table</span>
              </Button>
            )}
            <UserMenu />
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl sm:text-2xl text-center text-blue-700">
              Input License Plates
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-11 p-0.5 bg-gray-100 rounded-lg">
                <TabsTrigger 
                  value="text" 
                  className="text-sm sm:text-base font-medium h-10 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all flex items-center justify-center"
                >
                  Text Input
                </TabsTrigger>
                <TabsTrigger 
                  value="file" 
                  className="text-sm sm:text-base font-medium h-10 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all flex items-center justify-center"
                >
                  Excel Upload
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="text">
                <LicensePlateInput 
                  onSubmit={handleLicensePlatesSubmit}
                  isLoading={isLoading}
                />
              </TabsContent>
              
              <TabsContent value="file">
                <FileUpload 
                  onSubmit={(plates) => handleLicensePlatesSubmit(plates)}
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
            initialColumnConfig={selectedColumns}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
