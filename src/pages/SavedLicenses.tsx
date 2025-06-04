import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { UserMenu } from '@/components/UserMenu';
import { useSavedLicenses } from '@/hooks/useSavedLicenses';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Trash2, Calendar, Car, CreditCard, Filter, ChevronDown, Check, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ColumnFilters {
  kenteken: string[];
  merk: string[];
  handelsbenaming: string[];
  apk_vervaldatum: string[];
  datum_eerste_toelating: string[];
  wam_verzekerd: string[];
  geschorst: string[];
  datum_tenaamstelling: string[];
  datum_eerste_tenaamstelling_in_nederland_dt: string[];
  export_indicator: string[];
  tenaamstellen_mogelijk: string[];
}

const SavedLicenses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savedLicenses, loading, deleteLicense } = useSavedLicenses();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof typeof savedLicenses[0]>('kenteken');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    kenteken: [],
    merk: [],
    handelsbenaming: [],
    apk_vervaldatum: [],
    datum_eerste_toelating: [],
    wam_verzekerd: [],
    geschorst: [],
    datum_tenaamstelling: [],
    datum_eerste_tenaamstelling_in_nederland_dt: [],
    export_indicator: [],
    tenaamstellen_mogelijk: []
  });

  const handleDelete = async (id: string, kenteken: string) => {
    if (window.confirm(`Are you sure you want to remove ${kenteken} from saved licenses?`)) {
      await deleteLicense(id);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select licenses to delete');
      return;
    }

    const userOwnedIds = selectedIds.filter(id => {
      const license = savedLicenses.find(l => l.id === id);
      return license && license.added_by === user?.id;
    });

    if (userOwnedIds.length === 0) {
      toast.error('You can only delete your own saved licenses');
      return;
    }

    if (userOwnedIds.length !== selectedIds.length) {
      toast.error('Some selected licenses cannot be deleted (not owned by you)');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected license(s)?`)) {
      try {
        for (const id of selectedIds) {
          await deleteLicense(id);
        }
        setSelectedIds([]);
        toast.success(`Successfully deleted ${selectedIds.length} license(s)`);
      } catch (error) {
        toast.error('Error deleting some licenses');
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredData.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
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

  // Get unique values for each column
  const getUniqueValues = (column: keyof ColumnFilters) => {
    const values = savedLicenses.map(item => {
      const value = item[column]?.toString() || '';
      return column === 'datum_eerste_toelating' || column === 'datum_tenaamstelling' || column === 'datum_eerste_tenaamstelling_in_nederland_dt'
        ? formatDate(value) 
        : value;
    });
    return [...new Set(values)].filter(Boolean).sort();
  };

  const filteredData = useMemo(() => {
    let filtered = savedLicenses.filter(item => {
      // Global search
      const matchesGlobalSearch = Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Column-specific filters
      const matchesColumnFilters = Object.entries(columnFilters).every(([key, filterValues]) => {
        if (filterValues.length === 0) return true;
        const itemValue = key === 'datum_eerste_toelating' 
          ? formatDate(item[key as keyof typeof item]?.toString() || '')
          : item[key as keyof typeof item]?.toString() || '';
        return filterValues.includes(itemValue);
      });
      
      return matchesGlobalSearch && matchesColumnFilters;
    });

    return filtered.sort((a, b) => {
      const aVal = a[sortColumn]?.toString() || '';
      const bVal = b[sortColumn]?.toString() || '';
      const result = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [savedLicenses, searchTerm, sortColumn, sortDirection, columnFilters]);

  const handleSort = (column: keyof typeof savedLicenses[0]) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedIds([]);
    setColumnFilters({
      kenteken: [],
      merk: [],
      handelsbenaming: [],
      apk_vervaldatum: [],
      datum_eerste_toelating: [],
      wam_verzekerd: [],
      geschorst: [],
      datum_tenaamstelling: [],
      datum_eerste_tenaamstelling_in_nederland_dt: [],
      export_indicator: [],
      tenaamstellen_mogelijk: []
    });
  };

  const exportToExcel = (selectedOnly = false) => {
    const dataToExport = selectedOnly 
      ? filteredData.filter(item => selectedIds.includes(item.id))
      : filteredData;
      
    if (selectedOnly && dataToExport.length === 0) {
      toast.error('Please select licenses to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(item => ({
      'License Plate': item.kenteken,
      'Make': item.merk,
      'Model': item.handelsbenaming,
      'MOT Expiry': item.apk_vervaldatum,
      'First Registration': formatDate(item.datum_eerste_toelating),
      'WAM Insured': item.wam_verzekerd,
      'Suspended': item.geschorst,
      'Registration Date': formatDate(item.datum_tenaamstelling),
      'First NL Registration': formatDate(item.datum_eerste_tenaamstelling_in_nederland_dt),
      'Export Indicator': item.export_indicator,
      'Registration Possible': item.tenaamstellen_mogelijk,
      'Added By': item.added_by,
      'Added At': new Date(item.added_at).toLocaleDateString()
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Saved Licenses');
    const filename = selectedOnly 
      ? `selected_licenses_${new Date().toISOString().split('T')[0]}.xlsx`
      : `saved_licenses_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    if (selectedOnly) {
      toast.success(`Exported ${dataToExport.length} selected license(s)`);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading saved licenses...</div>
      </div>
    );
  }

  const isAllSelected = filteredData.length > 0 && selectedIds.length === filteredData.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < filteredData.length;

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
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-xl sm:text-2xl text-blue-700">
                  Saved Licenses ({filteredData.length})
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  {selectedIds.length > 0 && (
                    <>
                      <Button 
                        onClick={() => exportToExcel(true)} 
                        variant="outline"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export Selected ({selectedIds.length})
                      </Button>
                      <Button 
                        onClick={handleBulkDelete} 
                        variant="outline"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Selected ({selectedIds.length})
                      </Button>
                    </>
                  )}
                  <Button onClick={() => exportToExcel(false)} className="bg-green-600 hover:bg-green-700">
                    Export All to Excel
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
                <Input
                  placeholder="Global search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:max-w-sm order-1"
                />
                <Button onClick={clearAllFilters} variant="outline" size="sm" className="w-full sm:w-auto order-2">
                  Clear Filters
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="px-2 sm:px-6">
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {filteredData.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 transition-colors hover:bg-blue-50 relative"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span 
                            className="font-mono font-bold text-blue-700 cursor-pointer"
                            onClick={() => handleRowClick(item.kenteken)}
                          >
                            {item.kenteken}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {user?.id === item.added_by && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item.id, item.kenteken);
                              }}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Badge
                            variant={
                              item.wam_verzekerd?.toLowerCase() === 'ja' 
                                ? 'default'
                                : 'destructive'
                            }
                            className={
                              item.wam_verzekerd?.toLowerCase() === 'ja'
                                ? 'bg-green-100 text-green-800'
                                : ''
                            }
                          >
                            {item.wam_verzekerd || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div><span className="font-medium">Make:</span> {item.merk}</div>
                        <div><span className="font-medium">Model:</span> {item.handelsbenaming}</div>
                        <div><span className="font-medium">MOT:</span> {item.apk_vervaldatum}</div>
                        <div><span className="font-medium">Registration:</span> {formatDate(item.datum_tenaamstelling)}</div>
                        <div><span className="font-medium">Export:</span> {item.export_indicator}</div>
                        <div><span className="font-medium">Added:</span> {new Date(item.added_at).toLocaleDateString()}</div>
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
                      <th className="p-2 lg:p-3 text-left w-8">
                        <div className="relative">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                          />
                          {isPartiallySelected && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="p-2 lg:p-3 text-left w-8">Actions</th>
                      {[
                        { key: 'kenteken', label: 'License Plate' },
                        { key: 'merk', label: 'Make' },
                        { key: 'handelsbenaming', label: 'Model' },
                        { key: 'apk_vervaldatum', label: 'MOT Expiry' },
                        { key: 'datum_eerste_toelating', label: 'First Registration' },
                        { key: 'wam_verzekerd', label: 'WAM Insured' },
                        { key: 'geschorst', label: 'Suspended' },
                        { key: 'datum_tenaamstelling', label: 'Registration Date' },
                        { key: 'datum_eerste_tenaamstelling_in_nederland_dt', label: 'First NL Registration' },
                        { key: 'export_indicator', label: 'Export Indicator' },
                        { key: 'tenaamstellen_mogelijk', label: 'Registration Possible' }
                      ].map(({ key, label }) => (
                        <th key={key} className="p-2 lg:p-3 text-left">
                          <div className="space-y-2">
                            <div
                              className="cursor-pointer hover:bg-gray-100 font-semibold flex items-center text-xs lg:text-sm"
                              onClick={() => handleSort(key as keyof typeof savedLicenses[0])}
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
                    {filteredData.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-blue-50 transition-colors"
                      >
                        <td className="p-2 lg:p-3">
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          />
                        </td>
                        <td className="p-2 lg:p-3">
                          {user?.id === item.added_by && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item.id, item.kenteken);
                              }}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                        <td 
                          className="p-2 lg:p-3 font-mono font-bold text-blue-700 text-sm cursor-pointer"
                          onClick={() => handleRowClick(item.kenteken)}
                        >
                          {item.kenteken}
                        </td>
                        <td className="p-2 lg:p-3 text-sm truncate max-w-0">{item.merk}</td>
                        <td className="p-2 lg:p-3 text-sm truncate max-w-0">{item.handelsbenaming}</td>
                        <td className="p-2 lg:p-3 text-sm">{item.apk_vervaldatum}</td>
                        <td className="p-2 lg:p-3 text-sm">{formatDate(item.datum_eerste_toelating)}</td>
                        <td className="p-2 lg:p-3">
                          <Badge
                            variant={
                              item.wam_verzekerd?.toLowerCase() === 'ja'
                                ? 'default'
                                : item.wam_verzekerd === 'Unknown' || item.wam_verzekerd === 'Not Found'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className={
                              item.wam_verzekerd?.toLowerCase() === 'ja'
                                ? 'bg-green-100 text-green-800'
                                : ''
                            }
                          >
                            {item.wam_verzekerd || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="p-2 lg:p-3 text-sm">{item.geschorst}</td>
                        <td className="p-2 lg:p-3 text-sm">{formatDate(item.datum_tenaamstelling)}</td>
                        <td className="p-2 lg:p-3 text-sm">{formatDate(item.datum_eerste_tenaamstelling_in_nederland_dt)}</td>
                        <td className="p-2 lg:p-3 text-sm">{item.export_indicator}</td>
                        <td className="p-2 lg:p-3 text-sm">{item.tenaamstellen_mogelijk}</td>
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
          </Card>
        )}
      </div>
    </div>
  );
};

export default SavedLicenses;
