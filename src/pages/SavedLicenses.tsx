
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserMenu } from '@/components/UserMenu';
import { useSavedLicenses } from '@/hooks/useSavedLicenses';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Trash2, Calendar, Car, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const SavedLicenses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savedLicenses, loading, deleteLicense } = useSavedLicenses();

  const handleDelete = async (id: string, kenteken: string) => {
    if (window.confirm(`Are you sure you want to remove ${kenteken} from saved licenses?`)) {
      await deleteLicense(id);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === 'Unknown' || dateString === 'Not Found') {
      return dateString;
    }
    
    try {
      if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        return `${day}-${month}-${year}`;
      }
      
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('nl-NL');
      }
      
      return dateString;
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading saved licenses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center py-4 px-2">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">
                Saved License Plates
              </h1>
              <p className="text-base sm:text-xl text-gray-600">
                Community saved vehicles ({savedLicenses.length} total)
              </p>
            </div>
          </div>
          <UserMenu />
        </div>

        {savedLicenses.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <Car className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No saved licenses yet</h3>
              <p className="text-gray-600 mb-4">
                Start by searching for license plates and saving your favorites.
              </p>
              <Button onClick={() => navigate('/')}>
                Search License Plates
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedLicenses.map((license) => (
              <Card 
                key={license.id} 
                className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => navigate(`/vehicle/${license.kenteken}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-mono text-blue-700">
                      {license.kenteken}
                    </CardTitle>
                    {user?.id === license.added_by && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(license.id, license.kenteken);
                        }}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    Saved {new Date(license.added_at).toLocaleDateString()}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{license.merk}</span>
                      <span className="text-gray-600">{license.handelsbenaming}</span>
                    </div>
                    
                    {license.catalogusprijs && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">€{license.catalogusprijs}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">MOT Expiry:</span>
                      <span>{license.apk_vervaldatum || 'Unknown'}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">First Registration:</span>
                      <span>{formatDate(license.datum_eerste_toelating)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Insurance:</span>
                      <Badge
                        variant={
                          license.wam_verzekerd?.toLowerCase() === 'ja' 
                            ? 'default'
                            : 'destructive'
                        }
                        className={
                          license.wam_verzekerd?.toLowerCase() === 'ja'
                            ? 'bg-green-100 text-green-800'
                            : ''
                        }
                      >
                        {license.wam_verzekerd || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedLicenses;
