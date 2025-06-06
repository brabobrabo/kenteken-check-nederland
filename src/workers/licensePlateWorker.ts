
interface WorkerMessage {
  type: 'PROCESS_BATCH' | 'CANCEL';
  data?: {
    licensePlates: string[];
    batchSize: number;
    startIndex: number;
  };
}

interface WorkerResponse {
  type: 'BATCH_COMPLETE' | 'PROGRESS' | 'ERROR' | 'CANCELLED';
  data?: any;
}

let isCancelled = false;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  if (type === 'CANCEL') {
    isCancelled = true;
    self.postMessage({ type: 'CANCELLED' });
    return;
  }

  if (type === 'PROCESS_BATCH' && data) {
    const { licensePlates, batchSize } = data;
    
    try {
      const results = [];
      const total = licensePlates.length;
      
      // Process in batches
      for (let i = 0; i < licensePlates.length; i += batchSize) {
        if (isCancelled) break;
        
        const batch = licensePlates.slice(i, i + batchSize);
        const batchPromises = batch.map(async (plate) => {
          const plateForApi = plate.replace(/-/g, '');
          
          try {
            const response = await fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${plateForApi}`);
            const data = await response.json();
            
            if (data && data.length > 0) {
              const vehicle = data[0];
              return {
                kenteken: vehicle.kenteken || plate,
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
                kenteken: plate,
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
            return {
              kenteken: plate,
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
        const processedResults = batchResults.map(result => 
          result.status === 'fulfilled' ? result.value : null
        ).filter(Boolean);

        results.push(...processedResults);

        // Send progress update
        self.postMessage({
          type: 'PROGRESS',
          data: {
            processed: Math.min(i + batchSize, total),
            total,
            results: processedResults,
            progress: (Math.min(i + batchSize, total) / total) * 100
          }
        });

        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!isCancelled) {
        self.postMessage({
          type: 'BATCH_COMPLETE',
          data: { results, total: results.length }
        });
      }
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }
};
