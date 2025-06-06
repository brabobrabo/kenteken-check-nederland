
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Download, Pause, Play, X } from 'lucide-react';

interface BulkProcessingOptionsProps {
  licensePlateCount: number;
  onProcessStandard: () => void;
  onProcessBulk: () => void;
  isProcessing: boolean;
  progress: number;
  processed: number;
  total: number;
  canCancel: boolean;
  onCancel: () => void;
  error: string | null;
}

const LARGE_REQUEST_THRESHOLD = 1000;
const HUGE_REQUEST_THRESHOLD = 5000;

export const BulkProcessingOptions: React.FC<BulkProcessingOptionsProps> = ({
  licensePlateCount,
  onProcessStandard,
  onProcessBulk,
  isProcessing,
  progress,
  processed,
  total,
  canCancel,
  onCancel,
  error
}) => {
  const [selectedMode, setSelectedMode] = useState<'standard' | 'bulk'>('standard');

  const isLargeRequest = licensePlateCount >= LARGE_REQUEST_THRESHOLD;
  const isHugeRequest = licensePlateCount >= HUGE_REQUEST_THRESHOLD;

  const getModeDescription = (mode: 'standard' | 'bulk') => {
    if (mode === 'standard') {
      return 'Process with live updates in the table. Best for smaller datasets (< 1,000 records).';
    } else {
      return 'Process in background and export directly to Excel. Recommended for large datasets (1,000+ records).';
    }
  };

  const getRecommendedMode = () => {
    return isLargeRequest ? 'bulk' : 'standard';
  };

  if (isProcessing) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Processing License Plates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress: {processed} / {total}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {canCancel && (
            <Button 
              onClick={onCancel}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel Processing
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isLargeRequest ? 'border-orange-200 bg-orange-50' : ''}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Choose Processing Mode
          {isLargeRequest && (
            <Badge variant="outline" className="bg-orange-100 text-orange-800">
              {isHugeRequest ? 'Very Large Dataset' : 'Large Dataset'}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {licensePlateCount.toLocaleString()} license plates detected
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLargeRequest && (
          <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-orange-800">Large Dataset Detected</p>
              <p className="text-orange-700">
                For optimal performance with {licensePlateCount.toLocaleString()} records, we recommend using Bulk Export Mode.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedMode === 'standard'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedMode('standard')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={selectedMode === 'standard'}
                    onChange={() => setSelectedMode('standard')}
                    className="text-blue-600"
                  />
                  <h3 className="font-medium">Standard Mode</h3>
                  {!isLargeRequest && (
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  {getModeDescription('standard')}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedMode === 'bulk'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedMode('bulk')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={selectedMode === 'bulk'}
                    onChange={() => setSelectedMode('bulk')}
                    className="text-blue-600"
                  />
                  <h3 className="font-medium flex items-center gap-2">
                    Bulk Export Mode
                    <Download className="h-4 w-4" />
                  </h3>
                  {isLargeRequest && (
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  {getModeDescription('bulk')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={selectedMode === 'standard' ? onProcessStandard : onProcessBulk}
            className="w-full"
            size="lg"
          >
            {selectedMode === 'standard' ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Processing
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Process & Export to Excel
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
