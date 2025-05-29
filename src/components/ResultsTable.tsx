
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { VehicleData } from '@/types/vehicle';
import * as XLSX from 'xlsx';

interface ResultsTableProps {
  data: VehicleData[];
  isLoading: boolean;
  progress: number;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  data,
  isLoading,
  progress
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof VehicleData>('kenteken');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredData = useMemo(() => {
    let filtered = data.filter(item =>
      Object.values(item).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    return filtered.sort((a, b) => {
      const aVal = a[sortColumn].toString();
      const bVal = b[sortColumn].toString();
      const result = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [data, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: keyof VehicleData) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(item => ({
      'License Plate': item.kenteken,
      'Make': item.merk,
      'Model': item.handelsbenaming,
      'MOT Expiration': item.apkVervaldatum,
      'Catalog Price': item.catalogusprijs,
      'First Admission': item.datumEersteToelating,
      'WAM Insured': item.wamVerzekerd,
      'Suspended': item.geschorst,
      'Status': item.status
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicle Data');
    XLSX.writeFile(workbook, `vehicle_verification_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const foundCount = data.filter(item => item.status === 'found').length;
  const errorCount = data.filter(item => item.status === 'error').length;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl text-blue-700">
            Verification Results
          </CardTitle>
          {data.length > 0 && (
            <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
              📊 Export to Excel
            </Button>
          )}
        </div>
        
        {isLoading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Processing license plates...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
        
        {data.length > 0 && (
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                ✓ Found: {foundCount}
              </Badge>
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                ✗ Errors: {errorCount}
              </Badge>
            </div>
            <Input
              placeholder="Search results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        )}
      </CardHeader>
      
      {data.length > 0 && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  {[
                    { key: 'kenteken', label: 'License Plate' },
                    { key: 'merk', label: 'Make' },
                    { key: 'handelsbenaming', label: 'Model' },
                    { key: 'apkVervaldatum', label: 'MOT Expiration' },
                    { key: 'catalogusprijs', label: 'Catalog Price' },
                    { key: 'datumEersteToelating', label: 'First Admission' },
                    { key: 'wamVerzekerd', label: 'WAM Insured' },
                    { key: 'geschorst', label: 'Suspended' }
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className="text-left p-3 cursor-pointer hover:bg-gray-100 font-semibold"
                      onClick={() => handleSort(key as keyof VehicleData)}
                    >
                      {label}
                      {sortColumn === key && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr
                    key={index}
                    className={`border-b hover:bg-gray-50 ${
                      item.status === 'error' ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-blue-700">
                      {item.kenteken}
                    </td>
                    <td className="p-3">{item.merk}</td>
                    <td className="p-3">{item.handelsbenaming}</td>
                    <td className="p-3">{item.apkVervaldatum}</td>
                    <td className="p-3">{item.catalogusprijs}</td>
                    <td className="p-3">{item.datumEersteToelating}</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          item.wamVerzekerd.toLowerCase() === 'ja' || 
                          item.wamVerzekerd.toLowerCase() === 'yes'
                            ? 'default'
                            : item.wamVerzekerd === 'Not Found' || item.wamVerzekerd === 'Error'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className={
                          item.wamVerzekerd.toLowerCase() === 'ja' || 
                          item.wamVerzekerd.toLowerCase() === 'yes'
                            ? 'bg-green-100 text-green-800'
                            : ''
                        }
                      >
                        {item.wamVerzekerd}
                      </Badge>
                    </td>
                    <td className="p-3">{item.geschorst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredData.length === 0 && searchTerm && (
            <div className="text-center py-8 text-gray-500">
              No results found for "{searchTerm}"
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
