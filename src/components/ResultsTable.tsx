
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VehicleData } from '@/types/vehicle';
import * as XLSX from 'xlsx';

interface ResultsTableProps {
  data: VehicleData[];
  isLoading: boolean;
  progress: number;
}

interface ColumnFilters {
  kenteken: string;
  merk: string;
  handelsbenaming: string;
  apkVervaldatum: string;
  catalogusprijs: string;
  datumEersteToelating: string;
  wamVerzekerd: string;
  geschorst: string;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  data,
  isLoading,
  progress
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof VehicleData>('kenteken');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    kenteken: '',
    merk: '',
    handelsbenaming: '',
    apkVervaldatum: '',
    catalogusprijs: '',
    datumEersteToelating: '',
    wamVerzekerd: '',
    geschorst: ''
  });

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

  const filteredData = useMemo(() => {
    let filtered = data.filter(item => {
      // Global search
      const matchesGlobalSearch = Object.values(item).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Column-specific filters
      const matchesColumnFilters = Object.entries(columnFilters).every(([key, filterValue]) => {
        if (!filterValue) return true;
        const itemValue = item[key as keyof VehicleData].toString().toLowerCase();
        return itemValue.includes(filterValue.toLowerCase());
      });
      
      return matchesGlobalSearch && matchesColumnFilters;
    });

    return filtered.sort((a, b) => {
      const aVal = a[sortColumn].toString();
      const bVal = b[sortColumn].toString();
      const result = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [data, searchTerm, sortColumn, sortDirection, columnFilters]);

  const handleSort = (column: keyof VehicleData) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleColumnFilterChange = (column: keyof ColumnFilters, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setColumnFilters({
      kenteken: '',
      merk: '',
      handelsbenaming: '',
      apkVervaldatum: '',
      catalogusprijs: '',
      datumEersteToelating: '',
      wamVerzekerd: '',
      geschorst: ''
    });
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(item => ({
      'License Plate': item.kenteken,
      'Make': item.merk,
      'Model': item.handelsbenaming,
      'MOT Expiration': item.apkVervaldatum,
      'Catalog Price': item.catalogusprijs,
      'First Admission': formatDate(item.datumEersteToelating),
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
              placeholder="Global search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={clearAllFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
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
                    <th key={key} className="p-3 text-left">
                      <div className="space-y-2">
                        <div
                          className="cursor-pointer hover:bg-gray-100 font-semibold flex items-center"
                          onClick={() => handleSort(key as keyof VehicleData)}
                        >
                          {label}
                          {sortColumn === key && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                        <Input
                          placeholder={`Filter ${label.toLowerCase()}...`}
                          value={columnFilters[key as keyof ColumnFilters]}
                          onChange={(e) => handleColumnFilterChange(key as keyof ColumnFilters, e.target.value)}
                          className="text-xs h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
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
                    <td className="p-3">{formatDate(item.datumEersteToelating)}</td>
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
          
          {filteredData.length === 0 && (searchTerm || Object.values(columnFilters).some(f => f)) && (
            <div className="text-center py-8 text-gray-500">
              No results found with current filters
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
