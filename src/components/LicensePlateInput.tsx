
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface LicensePlateInputProps {
  onSubmit: (licensePlates: string[]) => void;
  isLoading: boolean;
}

export const LicensePlateInput: React.FC<LicensePlateInputProps> = ({
  onSubmit,
  isLoading
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = () => {
    const licensePlates = inputText
      .split('\n')
      .map(plate => plate.trim())
      .filter(plate => plate.length > 0);
    
    if (licensePlates.length === 0) {
      return;
    }
    
    onSubmit(licensePlates);
  };

  const examplePlates = ['1-ABC-23', '12-AB-34', 'AB-123-C'].join('\n');

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="licensePlates" className="text-lg font-medium">
          Enter License Plates (one per line)
        </Label>
        <Textarea
          id="licensePlates"
          placeholder={`Enter license plates, one per line:\n\nExample:\n${examplePlates}`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="mt-2 min-h-[200px] font-mono"
          disabled={isLoading}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {inputText.split('\n').filter(line => line.trim()).length} license plates entered
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || inputText.trim().length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Processing...' : 'Verify License Plates'}
        </Button>
      </div>
    </div>
  );
};
