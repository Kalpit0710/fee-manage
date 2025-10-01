import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useNotification } from './NotificationSystem';

interface CSVColumn {
  key: string;
  label: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'phone' | 'date';
  validate?: (value: any) => boolean | string;
}

interface CSVManagerProps {
  title: string;
  columns: CSVColumn[];
  data: any[];
  onImport: (data: any[]) => Promise<{ success: number; errors: string[] }>;
  onExport?: () => void;
  templateData?: any[];
  className?: string;
}

export const CSVManager: React.FC<CSVManagerProps> = ({
  title,
  columns,
  data,
  onImport,
  onExport,
  templateData,
  className = ''
}) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const validateRow = (row: any, rowIndex: number): string[] => {
    const errors: string[] = [];

    columns.forEach(column => {
      const value = row[column.key];

      // Check required fields
      if (column.required && (!value || value.toString().trim() === '')) {
        errors.push(`Row ${rowIndex + 1}: ${column.label} is required`);
        return;
      }

      if (value && value.toString().trim() !== '') {
        // Type validation
        switch (column.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`Row ${rowIndex + 1}: ${column.label} must be a number`);
            }
            break;
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors.push(`Row ${rowIndex + 1}: ${column.label} must be a valid email`);
            }
            break;
          case 'phone':
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.toString().replace(/\s/g, ''))) {
              errors.push(`Row ${rowIndex + 1}: ${column.label} must be a valid phone number`);
            }
            break;
          case 'date':
            if (isNaN(Date.parse(value))) {
              errors.push(`Row ${rowIndex + 1}: ${column.label} must be a valid date`);
            }
            break;
        }

        // Custom validation
        if (column.validate) {
          const result = column.validate(value);
          if (result !== true) {
            errors.push(`Row ${rowIndex + 1}: ${typeof result === 'string' ? result : `Invalid ${column.label}`}`);
          }
        }
      }
    });

    return errors;
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1);

    return rows.map(row => {
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showError('Invalid File', 'Please select a CSV file');
      return;
    }

    setUploading(true);

    try {
      const text = await file.text();
      const parsedData = parseCSV(text);

      if (parsedData.length === 0) {
        showError('Empty File', 'The CSV file appears to be empty or invalid');
        setUploading(false);
        return;
      }

      // Validate all rows
      const allErrors: string[] = [];
      parsedData.forEach((row, index) => {
        const rowErrors = validateRow(row, index);
        allErrors.push(...rowErrors);
      });

      if (allErrors.length > 0) {
        showError(
          'Validation Errors',
          `Found ${allErrors.length} validation errors. Please check your CSV file.`,
          10000
        );
        console.error('CSV Validation Errors:', allErrors);
        setUploading(false);
        return;
      }

      // Process import
      const result = await onImport(parsedData);

      if (result.errors.length > 0) {
        showWarning(
          'Import Completed with Warnings',
          `Successfully imported ${result.success} records. ${result.errors.length} records had issues.`,
          8000
        );
        console.warn('Import warnings:', result.errors);
      } else {
        showSuccess(
          'Import Successful',
          `Successfully imported ${result.success} records from CSV file`
        );
      }

    } catch (error) {
      console.error('CSV import error:', error);
      showError(
        'Import Failed',
        'An error occurred while processing the CSV file. Please check the file format.'
      );
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      if (onExport) {
        await onExport();
      } else {
        // Default export functionality
        const headers = columns.map(col => col.label);
        const csvContent = [
          headers.join(','),
          ...data.map(row => 
            columns.map(col => {
              const value = row[col.key] || '';
              // Escape commas and quotes
              return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                ? `"${value.replace(/"/g, '""')}"`
                : value;
            }).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccess(
          'Export Successful',
          `Successfully exported ${data.length} records to CSV file`
        );
      }
    } catch (error) {
      console.error('CSV export error:', error);
      showError('Export Failed', 'An error occurred while exporting data to CSV');
    } finally {
      setExporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = columns.map(col => col.label);
    const sampleData = templateData || [
      columns.reduce((obj, col) => {
        obj[col.label] = `Sample ${col.label}`;
        return obj;
      }, {} as any)
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
        columns.map(col => row[col.label] || '').join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess('Template Downloaded', 'CSV template downloaded successfully');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Upload Button */}
        <div className="relative">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <button
            disabled={uploading}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{uploading ? 'Uploading...' : 'Import CSV'}</span>
          </button>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exporting || data.length === 0}
          className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {exporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
        </button>

        {/* Template Download */}
        <button
          onClick={downloadTemplate}
          className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <FileText className="w-4 h-4" />
          <span>Download Template</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <h4 className="font-medium mb-2">CSV Import Instructions:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Download the template to see the required format</li>
              <li>Required fields: {columns.filter(c => c.required).map(c => c.label).join(', ')}</li>
              <li>Make sure all data is properly formatted</li>
              <li>Save your file as CSV format before uploading</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};