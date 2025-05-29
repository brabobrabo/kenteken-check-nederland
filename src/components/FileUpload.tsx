
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface FileUploadProps {
  onSubmit: (licensePlates: string[]) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onSubmit,
  isLoading
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      const text = await selectedFile.text();
      
      // Simple CSV/TSV parsing - look for LicensePlate column
      const lines = text.split('\n');
      const headers = lines[0].split(/[,;\t]/).map(h => h.trim());
      
      const licensePlateIndex = headers.findIndex(header => 
        header.toLowerCase().includes('licenseplate') || 
        header.toLowerCase().includes('kenteken') ||
        header.toLowerCase().includes('license')
      );
      
      if (licensePlateIndex === -1) {
        toast.error('Could not find LicensePlate column in the file');
        return;
      }
      
      const licensePlates: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(/[,;\t]/);
        const plate = columns[licensePlateIndex]?.trim();
        if (plate && plate.length > 0) {
          licensePlates.push(plate);
        }
      }
      
      if (licensePlates.length === 0) {
        toast.error('No valid license plates found in the file');
        return;
      }
      
      toast.success(`Found ${licensePlates.length} license plates in file`);
      onSubmit(licensePlates);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Error reading file. Please ensure it\'s a valid CSV/Excel file.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fileUpload" className="text-lg font-medium">
          Upload Excel/CSV File
        </Label>
        <p className="text-sm text-gray-600 mt-1 mb-3">
          File should contain a column named "LicensePlate" or "Kenteken"
        </p>
        <Input
          id="fileUpload"
          type="file"
          accept=".xlsx,.xls,.csv,.txt"
          onChange={handleFileChange}
          disabled={isLoading}
          className="cursor-pointer"
        />
      </div>
      
      {selectedFile && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">Selected File:</p>
                <p className="text-sm text-green-700">{selectedFile.name}</p>
                <p className="text-xs text-green-600">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Processing...' : 'Process File'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
