import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown, Filter, Heart, Star } from 'lucide-react';
import { VehicleData } from '@/types/vehicle';
import { useSavedLicenses } from '@/hooks/useSavedLicenses';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';
import { ColumnSettings } from './ColumnSettings';
import { useColumnReorder, ColumnConfig } from '@/hooks/useColumnReorder';

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
  datumEersteToelating: string[];
  wamVerzekerd: string[];
  geschorst: string[];
  datumTenaamstelling: string[];
  datumEersteTenaamstellingInNederlandDt: string[];
  exportIndicator: string[];
  tenaamstellenMogelijk: string[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  data,
  isLoading,
  progress
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveLicense, isLicenseSaved } = useSavedLicenses();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof VehicleData>('kenteken');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    kenteken: [],
    merk: [],
    handelsbenaming: [],
    apkVervaldatum: [],
    datumEersteToelating: [],
    wamVerzekerd: [],
    geschorst: [],
    datumTenaamstelling: [],
    datumEersteTenaamstellingInNederlandDt: [],
    exportIndicator: [],
    tenaamstellenMogelijk: []
  });

  const defaultColumns: ColumnConfig[] = [
    { key: 'kenteken', label: 'License Plate', visible: true },
    { key: 'merk', label: 'Make', visible: true },
    { key: 'handelsbenaming', label: 'Model', visible: true },
    { key: 'apkVervaldatum', label: 'MOT Expiration', visible: true },
    { key: 'datumEersteToelating', label: 'First Admission', visible: true },
    { key: 'wamVerzekerd', label: 'WAM Insured', visible: true },
    { key: 'geschorst', label: 'Suspended', visible: true },
    { key: 'datumTenaamstelling', label: 'Registration Date', visible: true },
    { key: 'datumEersteTenaamstellingInNederlandDt', label: 'First NL Registration', visible: true },
    { key: 'exportIndicator', label: 'Export Indicator', visible: true },
    { key: 'tenaamstellenMogelijk', label: 'Registration Possible', visible: true }
  ];

  const {
    columns,
    moveColumn,
    toggleColumnVisibility,
    resetColumns,
    visibleColumns
  } = useColumnReorder(defaultColumns, 'results-table-columns');

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
      const value = item[column];
      // Add null check before calling toString()
      if (value === null || value === undefined) {
        return 'Unknown';
      }
      const stringValue = value.toString();
      return column === 'datumEersteToelating' || column === 'datumTenaamstelling' || column === 'datumEersteTenaamstellingInNederlandDt' 
        ? formatDate(stringValue) 
        : stringValue;
    });
    return [...new Set(values)].sort();
  };

  const handleSaveLicense = async (item: VehicleData, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    await saveLicense(item);
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

  const clearAllFilters = () => {
    setSearchTerm('');
    setColumnFilters({
      kenteken: [],
      merk: [],
      handelsbenaming: [],
      apkVervaldatum: [],
      datumEersteToelating: [],
      wamVerzekerd: [],
      geschorst: [],
      datumTenaamstelling: [],
      datumEersteTenaamstellingInNederlandDt: [],
      exportIndicator: [],
      tenaamstellenMogelijk: []
    });
  };

  const exportToExcel = () => {
    const orderedData = filteredData.map(item => {
      const orderedItem: any = {};
      visibleColumns.forEach(column => {
        const key = column.key as keyof VehicleData;
        switch (key) {
          case 'kenteken':
            orderedItem['License Plate'] = item.kenteken;
            break;
          case 'merk':
            orderedItem['Make'] = item.merk;
            break;
          case 'handelsbenaming':
            orderedItem['Model'] = item.handelsbenaming;
            break;
          case 'apkVervaldatum':
            orderedItem['MOT Expiration'] = item.apkVervaldatum;
            break;
          case 'datumEersteToelating':
            orderedItem['First Admission'] = formatDate(item.datumEersteToelating);
            break;
          case 'wamVerzekerd':
            orderedItem['WAM Insured'] = item.wamVerzekerd;
            break;
          case 'geschorst':
            orderedItem['Suspended'] = item.geschorst;
            break;
          case 'datumTenaamstelling':
            orderedItem['Registration Date'] = formatDate(item.datumTenaamstelling);
            break;
          case 'datumEersteTenaamstellingInNederlandDt':
            orderedItem['First NL Registration'] = formatDate(item.datumEersteTenaamstellingInNederlandDt);
            break;
          case 'exportIndicator':
            orderedItem['Export Indicator'] = item.exportIndicator;
            break;
          case 'tenaamstellenMogelijk':
            orderedItem['Registration Possible'] = item.tenaamstellenMogelijk;
            break;
        }
      });
      orderedItem['Status'] = item.status;
      return orderedItem;
    });
    
    const worksheet = XLSX.utils.json_to_sheet(orderedData);
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
    const selectedValues = columnFilters[column];
    const [localSelectedValues, setLocalSelectedValues] = useState<string[]>([]);
    const [filterSearch, setFilterSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredValues = uniqueValues.filter(value =>
      value.toLowerCase().includes(filterSearch.toLowerCase())
    );

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (open) {
        // Initialize local state with current filters
        setLocalSelectedValues([...selectedValues]);
        setFilterSearch('');
      }
    };

    const toggleValue = (value: string) => {
      setLocalSelectedValues(prev => 
        prev.includes(value) 
          ? prev.filter(v => v !== value)
          : [...prev, value]
      );
    };

    const selectAll = () => {
      setLocalSelectedValues([...uniqueValues]);
    };

    const deselectAll = () => {
      setLocalSelectedValues([]);
    };

    const applyFilters = () => {
      setColumnFilters(prev => ({
        ...prev,
        [column]: localSelectedValues
      }));
      setIsOpen(false);
    };

    const cancelFilters = () => {
      setLocalSelectedValues([...selectedValues]);
      setIsOpen(false);
    };

    return (
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-dashed text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">
              {selectedValues.length > 0 ? `${selectedValues.length} selected` : 'Filter'}
            </span>
            <span className="sm:hidden">
              {selectedValues.length > 0 ? selectedValues.length.toString() : 'F'}
            </span>
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0 bg-white border shadow-lg z-50" align="start">
          <Command>
            <CommandInput 
              placeholder={`Search ${label.toLowerCase()}...`}
              value={filterSearch}
              onValueChange={setFilterSearch}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={selectAll} className="cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <span>Select All</span>
                  </div>
                </CommandItem>
                <CommandItem onSelect={deselectAll} className="cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <span>Deselect All</span>
                  </div>
                </CommandItem>
                <div className="border-t my-1" />
                {filteredValues.map((value) => (
                  <CommandItem
                    key={value}
                    onSelect={() => toggleValue(value)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                        {localSelectedValues.includes(value) && (
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
              <Button size="sm" onClick={applyFilters} className="flex-1">
                Apply
              </Button>
              <Button size="sm" variant="outline" onClick={cancelFilters} className="flex-1">
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
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl sm:text-2xl text-blue-700">
            Verification Results
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/saved')} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              View Saved
            </Button>
            {data.length > 0 && (
              <>
                <ColumnSettings
                  columns={columns}
                  onMoveColumn={moveColumn}
                  onToggleVisibility={toggleColumnVisibility}
                  onReset={resetColumns}
                />
                <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
                  Export to Excel
                </Button>
              </>
            )}
          </div>
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
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
            <div className="flex gap-2 order-2 sm:order-1">
              <Badge variant="default" className="bg-green-100 text-green-800">
                Found: {foundCount}
              </Badge>
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                Errors: {errorCount}
              </Badge>
            </div>
            <Input
              placeholder="Global search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm order-1 sm:order-2"
            />
            <Button onClick={clearAllFilters} variant="outline" size="sm" className="w-full sm:w-auto order-3">
              Clear Filters
            </Button>
          </div>
        )}
      </CardHeader>
      
      {data.length > 0 && (
        <CardContent className="px-2 sm:px-6">
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {filteredData.map((item, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 cursor-pointer transition-colors relative ${
                  item.status === 'error' ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'hover:bg-blue-50'
                }`}
                onClick={() => handleRowClick(item.kenteken)}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-blue-700">{item.kenteken}</span>
                    <div className="flex items-center gap-2">
                      {user && item.status === 'found' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleSaveLicense(item, e)}
                          disabled={isLicenseSaved(item.kenteken)}
                          className={`p-1 ${isLicenseSaved(item.kenteken) ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'}`}
                        >
                          <Heart className={`h-4 w-4 ${isLicenseSaved(item.kenteken) ? 'fill-current' : ''}`} />
                        </Button>
                      )}
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
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div><span className="font-medium">Make:</span> {item.merk}</div>
                    <div><span className="font-medium">Model:</span> {item.handelsbenaming}</div>
                    <div><span className="font-medium">MOT:</span> {item.apkVervaldatum}</div>
                    <div><span className="font-medium">Registration:</span> {formatDate(item.datumTenaamstelling)}</div>
                    <div><span className="font-medium">Export:</span> {item.exportIndicator}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2 lg:p-3 text-left w-8"></th>
                  {visibleColumns.map(({ key, label }) => (
                    <th key={key} className="p-2 lg:p-3 text-left">
                      <div className="space-y-2">
                        <div
                          className="cursor-pointer hover:bg-gray-100 font-semibold flex items-center text-xs lg:text-sm"
                          onClick={() => handleSort(key as keyof VehicleData)}
                        >
                          <span className="truncate">{label}</span>
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
                    <td className="p-2 lg:p-3">
                      {user && item.status === 'found' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleSaveLicense(item, e)}
                          disabled={isLicenseSaved(item.kenteken)}
                          className={`p-1 ${isLicenseSaved(item.kenteken) ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'}`}
                        >
                          <Heart className={`h-4 w-4 ${isLicenseSaved(item.kenteken) ? 'fill-current' : ''}`} />
                        </Button>
                      )}
                    </td>
                    {visibleColumns.map(({ key }) => {
                      const cellKey = key as keyof VehicleData;
                      let cellContent;
                      
                      switch (cellKey) {
                        case 'kenteken':
                          cellContent = (
                            <span className="font-mono font-bold text-blue-700 text-sm">
                              {item.kenteken}
                            </span>
                          );
                          break;
                        case 'wamVerzekerd':
                          cellContent = (
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
                          );
                          break;
                        case 'datumEersteToelating':
                        case 'datumTenaamstelling':
                        case 'datumEersteTenaamstellingInNederlandDt':
                          cellContent = (
                            <span className="text-sm">
                              {formatDate(item[cellKey])}
                            </span>
                          );
                          break;
                        default:
                          cellContent = (
                            <span className="text-sm truncate max-w-0">
                              {item[cellKey]}
                            </span>
                          );
                      }
                      
                      return (
                        <td key={key} className="p-2 lg:p-3">
                          {cellContent}
                        </td>
                      );
                    })}
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
