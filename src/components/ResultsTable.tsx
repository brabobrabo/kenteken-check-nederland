
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown, Filter } from 'lucide-react';
import { VehicleData } from '@/types/vehicle';
import * as XLSX from 'xlsx';

interface ResultsTableProps {
  data: VehicleData[];
  isLoading: boolean;
  progress: number;
}

interface ColumnFilters {
  kenteken: string[];
  merk: string[];
  handelsbenaming: string[];
  apkVervaldatum: string[];
  catalogusprijs: string[];
  datumEersteToelating: string[];
  wamVerzekerd: string[];
  geschorst: string[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  data,
  isLoading,
  progress
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof VehicleData>('kenteken');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    kenteken: [],
    merk: [],
    handelsbenaming: [],
    apkVervaldatum: [],
    catalogusprijs: [],
    datumEersteToelating: [],
    wamVerzekerd: [],
    geschorst: []
  });
  
  // Temporary filter state for each column
  const [tempColumnFilters, setTempColumnFilters] = useState<ColumnFilters>({
    kenteken: [],
    merk: [],
    handelsbenaming: [],
    apkVervaldatum: [],
    catalogusprijs: [],
    datumEersteToelating: [],
    wamVerzekerd: [],
    geschorst: []
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

  // Get unique values for each column
  const getUniqueValues = (column: keyof VehicleData) => {
    const values = data.map(item => {
      const value = item[column].toString();
      return column === 'datumEersteToelating' ? formatDate(value) : value;
    });
    return [...new Set(values)].sort();
  };

  const filteredData = useMemo(() => {
    let filtered = data.filter(item => {
      // Global search
      const matchesGlobalSearch = Object.values(item).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Column-specific filters
      const matchesColumnFilters = Object.entries(columnFilters).every(([key, filterValues]) => {
        if (filterValues.length === 0) return true;
        const itemValue = key === 'datumEersteToelating' 
          ? formatDate(item[key as keyof VehicleData].toString())
          : item[key as keyof VehicleData].toString();
        return filterValues.includes(itemValue);
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

  const handleTempFilterChange = (column: keyof ColumnFilters, value: string, checked: boolean) => {
    setTempColumnFilters(prev => ({
      ...prev,
      [column]: checked 
        ? [...prev[column], value]
        : prev[column].filter(v => v !== value)
    }));
  };

  const applyFilters = (column: keyof ColumnFilters) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: tempColumnFilters[column]
    }));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setColumnFilters({
      kenteken: [],
      merk: [],
      handelsbenaming: [],
      apkVervaldatum: [],
      catalogusprijs: [],
      datumEersteToelating: [],
      wamVerzekerd: [],
      geschorst: []
    });
    setTempColumnFilters({
      kenteken: [],
      merk: [],
      handelsbenaming: [],
      apkVervaldatum: [],
      catalogusprijs: [],
      datumEersteToelating: [],
      wamVerzekerd: [],
      geschorst: []
    });
  };

  const selectAllForColumn = (column: keyof ColumnFilters) => {
    const uniqueValues = getUniqueValues(column);
    setTempColumnFilters(prev => ({
      ...prev,
      [column]: uniqueValues
    }));
  };

  const deselectAllForColumn = (column: keyof ColumnFilters) => {
    setTempColumnFilters(prev => ({
      ...prev,
      [column]: []
    }));
  };

  const initializeTempFilters = (column: keyof ColumnFilters) => {
    setTempColumnFilters(prev => ({
      ...prev,
      [column]: [...columnFilters[column]]
    }));
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

  const handleRowClick = (kenteken: string) => {
    navigate(`/vehicle/${kenteken}`);
  };

  const FilterDropdown = ({ column, label }: { column: keyof ColumnFilters; label: string }) => {
    const uniqueValues = getUniqueValues(column);
    const selectedValues = tempColumnFilters[column];
    const appliedValues = columnFilters[column];
    const [filterSearch, setFilterSearch] = useState('');

    const filteredValues = uniqueValues.filter(value =>
      value.toLowerCase().includes(filterSearch.toLowerCase())
    );

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-dashed"
            onClick={() => initializeTempFilters(column)}
          >
            <Filter className="h-4 w-4 mr-1" />
            {appliedValues.length > 0 ? `${appliedValues.length} selected` : 'Filter'}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0 bg-white" align="start">
          <Command>
            <CommandInput 
              placeholder={`Search ${label.toLowerCase()}...`}
              value={filterSearch}
              onValueChange={setFilterSearch}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => selectAllForColumn(column)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <span>Select All</span>
                  </div>
                </CommandItem>
                <CommandItem
                  onSelect={() => deselectAllForColumn(column)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <span>Deselect All</span>
                  </div>
                </CommandItem>
                <div className="border-t my-1" />
                {filteredValues.map((value) => (
                  <CommandItem
                    key={value}
                    onSelect={() => handleTempFilterChange(column, value, !selectedValues.includes(value))}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                        {selectedValues.includes(value) && (
                          <Check className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                      <span className="text-sm">{value}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="p-2 border-t bg-gray-50 flex gap-2">
              <Button 
                size="sm" 
                onClick={() => applyFilters(column)}
                className="flex-1"
              >
                Apply
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setTempColumnFilters(prev => ({
                  ...prev,
                  [column]: [...columnFilters[column]]
                }))}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl text-blue-700">
            Verification Results
          </CardTitle>
          {data.length > 0 && (
            <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
              Export to Excel
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
                        <FilterDropdown column={key as keyof ColumnFilters} label={label} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr
                    key={index}
                    className={`border-b hover:bg-blue-50 cursor-pointer transition-colors ${
                      item.status === 'error' ? 'bg-red-50 hover:bg-red-100' : ''
                    }`}
                    onClick={() => handleRowClick(item.kenteken)}
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
          
          {filteredData.length === 0 && (searchTerm || Object.values(columnFilters).some(f => f.length > 0)) && (
            <div className="text-center py-8 text-gray-500">
              No results found with current filters
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
