
import { useState, useRef, useCallback } from 'react';
import { VehicleData } from '@/types/vehicle';
import * as XLSX from 'xlsx';

interface BulkProcessingState {
  isProcessing: boolean;
  progress: number;
  processed: number;
  total: number;
  results: VehicleData[];
  error: string | null;
  canCancel: boolean;
}

export const useBulkProcessor = () => {
  const [state, setState] = useState<BulkProcessingState>({
    isProcessing: false,
    progress: 0,
    processed: 0,
    total: 0,
    results: [],
    error: null,
    canCancel: false
  });

  const workerRef = useRef<Worker | null>(null);
  const isLargeRequestRef = useRef(false);

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Unknown' || dateString === 'Not Found' || dateString === 'Error') {
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

  const exportToExcel = useCallback((results: VehicleData[], filename?: string) => {
    const processedData = results.map(item => ({
      'License Plate': item.kenteken,
      'Make': item.merk,
      'Model': item.handelsbenaming,
      'MOT Expiration': item.apkVervaldatum,
      'First Admission': formatDate(item.datumEersteToelating),
      'WAM Insured': item.wamVerzekerd,
      'Suspended': item.geschorst,
      'Registration Date': formatDate(item.datumTenaamstelling),
      'First NL Registration': formatDate(item.datumEersteTenaamstellingInNederlandDt),
      'Export Indicator': item.exportIndicator,
      'Registration Possible': item.tenaamstellenMogelijk,
      'Status': item.status
    }));

    const summaryData = [
      ['Processing Summary', ''],
      ['Total Processed', results.length],
      ['Found', results.filter(r => r.status === 'found').length],
      ['Errors/Not Found', results.filter(r => r.status === 'error').length],
      ['Processing Date', new Date().toLocaleString()],
      ['', ''],
      ['Status Breakdown', 'Count'],
      ...Object.entries(
        results.reduce((acc, item) => {
          const key = item.status === 'found' ? 'Valid Records' : 'Invalid/Error Records';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
    ];

    const workbook = XLSX.utils.book_new();
    
    // Add results sheet
    const resultsSheet = XLSX.utils.json_to_sheet(processedData);
    XLSX.utils.book_append_sheet(workbook, resultsSheet, 'Vehicle Data');
    
    // Add summary sheet
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    const defaultFilename = `vehicle_verification_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename || defaultFilename);
  }, []);

  const processBulk = useCallback(async (
    licensePlates: string[], 
    options: {
      batchSize?: number;
      isLargeRequest?: boolean;
      exportDirectly?: boolean;
      onProgress?: (data: Partial<BulkProcessingState>) => void;
      onComplete?: (results: VehicleData[]) => void;
    } = {}
  ) => {
    const {
      batchSize = 50,
      isLargeRequest = false,
      exportDirectly = false,
      onProgress,
      onComplete
    } = options;

    isLargeRequestRef.current = isLargeRequest;

    setState({
      isProcessing: true,
      progress: 0,
      processed: 0,
      total: licensePlates.length,
      results: [],
      error: null,
      canCancel: true
    });

    try {
      // Create worker
      workerRef.current = new Worker(new URL('../workers/licensePlateWorker.ts', import.meta.url), {
        type: 'module'
      });

      const allResults: VehicleData[] = [];

      workerRef.current.onmessage = (event) => {
        const { type, data } = event.data;

        switch (type) {
          case 'PROGRESS':
            allResults.push(...data.results);
            const newState = {
              progress: data.progress,
              processed: data.processed,
              total: data.total,
              results: isLargeRequest ? [] : allResults // Don't store results in state for large requests
            };
            setState(prev => ({ ...prev, ...newState }));
            onProgress?.(newState);
            break;

          case 'BATCH_COMPLETE':
            setState(prev => ({
              ...prev,
              isProcessing: false,
              canCancel: false,
              progress: 100,
              processed: data.total,
              results: isLargeRequest ? [] : allResults
            }));

            if (exportDirectly || isLargeRequest) {
              exportToExcel(allResults);
            }

            onComplete?.(allResults);
            break;

          case 'ERROR':
            setState(prev => ({
              ...prev,
              isProcessing: false,
              canCancel: false,
              error: data.error
            }));
            break;

          case 'CANCELLED':
            setState(prev => ({
              ...prev,
              isProcessing: false,
              canCancel: false
            }));
            break;
        }
      };

      // Start processing
      workerRef.current.postMessage({
        type: 'PROCESS_BATCH',
        data: {
          licensePlates,
          batchSize,
          startIndex: 0
        }
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        canCancel: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [exportToExcel]);

  const cancelProcessing = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'CANCEL' });
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      processed: 0,
      total: 0,
      results: [],
      error: null,
      canCancel: false
    });
  }, []);

  return {
    ...state,
    processBulk,
    cancelProcessing,
    resetState,
    exportToExcel
  };
};
