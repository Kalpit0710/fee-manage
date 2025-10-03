import React, { useRef, useEffect, useState } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

interface ReceiptData {
  transaction: any;
  student: any;
  quarter: any;
  breakdown: {
    baseFee: number;
    extraCharges: number;
    lateFee: number;
    concession: number;
    total: number;
  };
  paymentId?: string;
}

interface ReceiptGeneratorProps {
  receiptData: ReceiptData;
  onClose: () => void;
  isParentView?: boolean;
}

export const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  receiptData,
  onClose,
  isParentView = false
}) => {
  const fullReceiptRef = useRef<HTMLDivElement>(null);
  const halfReceiptRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, [receiptData]);

  const generateQRCode = async () => {
    try {
      const verificationData = {
        receiptNo: receiptData.transaction.receipt_no,
        studentId: receiptData.student.id,
        amount: receiptData.transaction.amount_paid,
        date: receiptData.transaction.payment_date,
        paymentId: receiptData.paymentId
      };

      const qrData = JSON.stringify(verificationData);
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadPDF = async () => {
    if (!fullReceiptRef.current) return;

    setLoading(true);

    try {
      const canvas = await html2canvas(fullReceiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      pdf.save(`Receipt_${receiptData.transaction.receipt_no}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = async () => {
    const receiptToPrint = isParentView ? fullReceiptRef.current : halfReceiptRef.current;
    if (!receiptToPrint) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pageHeight = isParentView ? '297mm' : '148.5mm';

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${receiptData.transaction.receipt_no}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            @page {
              size: A4 ${isParentView ? 'portrait' : ''};
              margin: 0;
            }
            .receipt-container {
              width: 210mm;
              height: ${pageHeight};
              padding: ${isParentView ? '20mm' : '10mm'};
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: ${isParentView ? '15px' : '10px'};
              margin-bottom: ${isParentView ? '15px' : '10px'};
            }
            .logo {
              width: ${isParentView ? '60px' : '40px'};
              height: ${isParentView ? '60px' : '40px'};
              margin: 0 auto ${isParentView ? '10px' : '5px'};
            }
            .school-name {
              font-size: ${isParentView ? '24px' : '18px'};
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            .school-address {
              font-size: ${isParentView ? '12px' : '9px'};
              color: #666;
              line-height: 1.4;
            }
            .receipt-title {
              font-size: ${isParentView ? '18px' : '14px'};
              font-weight: bold;
              margin: ${isParentView ? '15px' : '10px'} 0;
              text-align: center;
              background: #f3f4f6;
              padding: ${isParentView ? '10px' : '6px'};
              border-radius: 4px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: ${isParentView ? '15px' : '10px'};
              margin: ${isParentView ? '15px' : '10px'} 0;
              font-size: ${isParentView ? '12px' : '10px'};
            }
            .info-item { margin-bottom: ${isParentView ? '8px' : '5px'}; }
            .label { font-weight: bold; color: #333; }
            .value { color: #666; margin-left: 5px; }
            .breakdown {
              margin: ${isParentView ? '15px' : '10px'} 0;
              border: 1px solid #ddd;
              border-radius: 4px;
              padding: ${isParentView ? '12px' : '8px'};
              font-size: ${isParentView ? '12px' : '10px'};
            }
            .breakdown-title {
              font-weight: bold;
              text-align: center;
              background: #f9fafb;
              padding: ${isParentView ? '8px' : '5px'};
              margin: -${isParentView ? '12px' : '8px'} -${isParentView ? '12px' : '8px'} ${isParentView ? '10px' : '8px'};
              border-radius: 4px 4px 0 0;
            }
            .breakdown-item {
              display: flex;
              justify-content: space-between;
              padding: ${isParentView ? '4px' : '3px'} 0;
            }
            .total {
              border-top: 2px solid #333;
              padding-top: ${isParentView ? '8px' : '5px'};
              margin-top: ${isParentView ? '8px' : '5px'};
              font-weight: bold;
              font-size: ${isParentView ? '16px' : '12px'};
            }
            .qr-code {
              text-align: center;
              margin: ${isParentView ? '15px' : '10px'} 0;
            }
            .qr-code img {
              width: ${isParentView ? '100px' : '70px'};
              height: ${isParentView ? '100px' : '70px'};
            }
            .qr-text {
              font-size: ${isParentView ? '11px' : '8px'};
              color: #666;
              margin-bottom: 5px;
            }
            .footer {
              text-align: center;
              margin-top: ${isParentView ? '20px' : '10px'};
              padding-top: ${isParentView ? '15px' : '10px'};
              border-top: 1px solid #ccc;
              font-size: ${isParentView ? '11px' : '8px'};
              color: #666;
            }
            .footer p { margin-bottom: ${isParentView ? '5px' : '3px'}; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${receiptToPrint.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const ReceiptContent = ({ isFullSize }: { isFullSize: boolean }) => (
    <div className={`receipt-container bg-white ${isFullSize ? 'p-8' : 'p-4'}`}>
      <div className={`header text-center border-b-2 border-gray-800 ${isFullSize ? 'pb-4 mb-4' : 'pb-2 mb-3'}`}>
        <img
          src="/Colorful Fun Illustration Kids Summer Camp Activity Flyer.png"
          alt="School Logo"
          className={`logo mx-auto ${isFullSize ? 'w-16 h-16 mb-3' : 'w-10 h-10 mb-2'} object-contain`}
        />
        <h1 className={`school-name font-bold text-blue-600 ${isFullSize ? 'text-2xl mb-2' : 'text-lg mb-1'}`}>
          J.R. Preparatory School
        </h1>
        <div className={`school-address text-gray-600 ${isFullSize ? 'text-xs' : 'text-[10px]'} leading-tight`}>
          <p>Puranpur, Uttar Pradesh - 262122</p>
          <p>Phone: +91 98765 43210 | Email: office@jrprep.edu</p>
          {isFullSize && <p>Website: www.jrprep.edu</p>}
        </div>
      </div>

      <div className={`receipt-title font-bold text-center bg-gray-100 rounded ${isFullSize ? 'text-lg py-2 mb-4' : 'text-sm py-1 mb-3'}`}>
        FEE PAYMENT RECEIPT
      </div>

      <div className={`info-grid grid grid-cols-2 ${isFullSize ? 'gap-4 mb-4 text-xs' : 'gap-3 mb-3 text-[10px]'}`}>
        <div>
          <div className={`info-item ${isFullSize ? 'mb-2' : 'mb-1'}`}>
            <span className="label font-semibold">Receipt No:</span>
            <span className="value text-blue-600 font-mono">
              {receiptData.transaction.receipt_no}
            </span>
          </div>
          <div className={`info-item ${isFullSize ? 'mb-2' : 'mb-1'}`}>
            <span className="label font-semibold">Payment Date:</span>
            <span className="value">
              {format(new Date(receiptData.transaction.payment_date), 'dd MMM yyyy')}
            </span>
          </div>
          <div className={`info-item ${isFullSize ? 'mb-2' : 'mb-1'}`}>
            <span className="label font-semibold">Payment Mode:</span>
            <span className="value capitalize">
              {receiptData.transaction.payment_mode}
            </span>
          </div>
          {receiptData.transaction.payment_reference && (
            <div className={`info-item ${isFullSize ? 'mb-2' : 'mb-1'}`}>
              <span className="label font-semibold">Reference:</span>
              <span className="value font-mono text-[9px]">
                {receiptData.transaction.payment_reference}
              </span>
            </div>
          )}
        </div>

        <div>
          <div className={`info-item ${isFullSize ? 'mb-2' : 'mb-1'}`}>
            <span className="label font-semibold">Student:</span>
            <span className="value">{receiptData.student.name}</span>
          </div>
          <div className={`info-item ${isFullSize ? 'mb-2' : 'mb-1'}`}>
            <span className="label font-semibold">Adm No:</span>
            <span className="value">{receiptData.student.admission_no}</span>
          </div>
          <div className={`info-item ${isFullSize ? 'mb-2' : 'mb-1'}`}>
            <span className="label font-semibold">Class:</span>
            <span className="value">
              {receiptData.student.class?.class_name}
              {receiptData.student.section && ` - ${receiptData.student.section}`}
            </span>
          </div>
          <div className={`info-item ${isFullSize ? 'mb-2' : 'mb-1'}`}>
            <span className="label font-semibold">Quarter:</span>
            <span className="value">{receiptData.quarter.quarter_name}</span>
          </div>
        </div>
      </div>

      <div className={`breakdown border border-gray-300 rounded ${isFullSize ? 'p-3 mb-4 text-xs' : 'p-2 mb-3 text-[10px]'}`}>
        <h4 className={`breakdown-title font-semibold text-center bg-gray-50 rounded ${isFullSize ? 'py-2 mb-2' : 'py-1 mb-1'}`}>
          FEE BREAKDOWN
        </h4>
        <div className="space-y-1">
          <div className="breakdown-item flex justify-between">
            <span>Base Fee:</span>
            <span>₹{receiptData.breakdown.baseFee.toLocaleString()}</span>
          </div>
          {receiptData.breakdown.extraCharges > 0 && (
            <div className="breakdown-item flex justify-between">
              <span>Extra Charges:</span>
              <span>₹{receiptData.breakdown.extraCharges.toLocaleString()}</span>
            </div>
          )}
          {receiptData.breakdown.lateFee > 0 && (
            <div className="breakdown-item flex justify-between text-red-600">
              <span>Late Fee:</span>
              <span>₹{receiptData.breakdown.lateFee.toLocaleString()}</span>
            </div>
          )}
          {receiptData.breakdown.concession > 0 && (
            <div className="breakdown-item flex justify-between text-green-600">
              <span>Concession:</span>
              <span>-₹{receiptData.breakdown.concession.toLocaleString()}</span>
            </div>
          )}
          <div className={`total flex justify-between border-t-2 border-gray-800 font-bold ${isFullSize ? 'pt-2 mt-2 text-base' : 'pt-1 mt-1 text-xs'}`}>
            <span>Total Paid:</span>
            <span className="text-blue-600">₹{receiptData.transaction.amount_paid.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {qrCodeUrl && (
        <div className={`qr-code text-center ${isFullSize ? 'mb-4' : 'mb-2'}`}>
          <p className={`qr-text text-gray-600 ${isFullSize ? 'text-[11px] mb-1' : 'text-[8px] mb-1'}`}>
            Scan to verify
          </p>
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className={`mx-auto ${isFullSize ? 'w-20 h-20' : 'w-14 h-14'}`}
          />
        </div>
      )}

      <div className={`footer text-center border-t border-gray-300 text-gray-600 ${isFullSize ? 'mt-4 pt-3 text-[11px]' : 'mt-2 pt-2 text-[8px]'}`}>
        <p className={isFullSize ? 'mb-1' : 'mb-0.5'}>
          This is a computer-generated receipt and does not require a signature.
        </p>
        {isFullSize && (
          <p className="mb-1">
            For any queries, please contact the school office.
          </p>
        )}
        <p className={isFullSize ? 'text-[10px] text-gray-500' : 'text-[7px] text-gray-500'}>
          Generated on {format(new Date(), 'dd MMM yyyy, hh:mm a')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Payment Receipt</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadPDF}
              disabled={loading}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
              title="Download Full A4 PDF"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={printReceipt}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
              title={isParentView ? "Print Full Size" : "Print Half Size"}
            >
              <Printer className="w-4 h-4" />
              <span>Print {isParentView ? 'Full' : 'Half'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-gray-100">
          <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm' }}>
            <div ref={fullReceiptRef}>
              <ReceiptContent isFullSize={true} />
            </div>
          </div>

          <div className="hidden">
            <div ref={halfReceiptRef} style={{ width: '210mm', height: '148.5mm' }}>
              <ReceiptContent isFullSize={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
