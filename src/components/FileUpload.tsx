
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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

  const findLicensePlateColumn = (headers: string[]): number => {
    // First, try exact matches (case insensitive)
    const exactMatches = [
      'licenseplate', 'license plate', 'kenteken', 'license_plate'
    ];
    
    for (const match of exactMatches) {
      const index = headers.findIndex(header => 
        header.toLowerCase().trim() === match
      );
      if (index !== -1) return index;
    }
    
    // Then try partial matches
    const partialMatches = [
      'license', 'kenteken', 'plate', 'nummerplaat'
    ];
    
    for (const match of partialMatches) {
      const index = headers.findIndex(header => 
        header.toLowerCase().includes(match)
      );
      if (index !== -1) return index;
    }
    
    // If no match found, return first column (index 0)
    return 0;
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
      let rows: string[][] = [];

      if (isExcel) {
        // Handle Excel files
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        rows = jsonData as string[][];
      } else {
        // Handle CSV/TSV files
        const text = await selectedFile.text();
        const lines = text.split('\n').filter(line => line.trim());
        rows = lines.map(line => line.split(/[,;\t]/).map(col => col.trim().replace(/"/g, '')));
      }

      if (rows.length < 2) {
        toast.error('File must contain at least a header row and one data row');
        return;
      }
      
      const headers = rows[0].map(h => String(h || '').trim());
      console.log('Found headers:', headers);
      
      const licensePlateIndex = findLicensePlateColumn(headers);
      console.log(`Using column ${licensePlateIndex}: "${headers[licensePlateIndex]}" for license plates`);
      
      const licensePlates: string[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        const plate = String(rows[i][licensePlateIndex] || '').trim();
        if (plate && plate.length > 0) {
          licensePlates.push(plate);
        }
      }
      
      if (licensePlates.length === 0) {
        toast.error('No valid license plates found in the file');
        return;
      }
      
      toast.success(`Found ${licensePlates.length} license plates in column "${headers[licensePlateIndex]}"`);
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
          File should contain license plates. Will automatically detect columns named "LicensePlate", "Kenteken", or use the first column.
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
