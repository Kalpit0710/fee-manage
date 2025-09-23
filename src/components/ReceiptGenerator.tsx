import React, { useRef, useEffect, useState } from 'react';
import { X, Download, Printer, Share } from 'lucide-react';
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
}

export const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  receiptData,
  onClose
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
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
    if (!receiptRef.current) return;
    
    setLoading(true);
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Receipt_${receiptData.transaction.receipt_no}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    if (!receiptRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${receiptData.transaction.receipt_no}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .receipt { max-width: 600px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .school-name { font-size: 24px; font-weight: bold; color: #2563eb; }
            .school-address { font-size: 14px; color: #666; margin-top: 5px; }
            .receipt-title { font-size: 20px; font-weight: bold; margin: 20px 0; text-align: center; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #333; }
            .value { color: #666; }
            .breakdown { margin: 20px 0; }
            .breakdown-item { display: flex; justify-content: space-between; padding: 5px 0; }
            .total { border-top: 2px solid #333; padding-top: 10px; font-weight: bold; font-size: 18px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; }
            .qr-code { text-align: center; margin: 20px 0; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${receiptRef.current.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Payment Receipt</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadPDF}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={printReceipt}
              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
              title="Print Receipt"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div ref={receiptRef} className="receipt bg-white">
            {/* Header */}
            <div className="header text-center border-b-2 border-gray-800 pb-6 mb-6">
              <h1 className="school-name text-3xl font-bold text-blue-600 mb-2">
                J.R. Preparatory School
              </h1>
              <div className="school-address text-gray-600">
                <p>123 Education Street, Knowledge City - 560001</p>
                <p>Phone: +91 98765 43210 | Email: office@jrprep.edu</p>
                <p>Website: www.jrprep.edu</p>
              </div>
            </div>

            {/* Receipt Title */}
            <div className="receipt-title text-xl font-bold text-center mb-6 bg-gray-100 py-3 rounded">
              FEE PAYMENT RECEIPT
            </div>

            {/* Receipt Info */}
            <div className="info-grid grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="info-item mb-3">
                  <span className="label font-semibold">Receipt No:</span>
                  <span className="value ml-2 text-blue-600 font-mono">
                    {receiptData.transaction.receipt_no}
                  </span>
                </div>
                <div className="info-item mb-3">
                  <span className="label font-semibold">Payment Date:</span>
                  <span className="value ml-2">
                    {format(new Date(receiptData.transaction.payment_date), 'dd MMM yyyy, hh:mm a')}
                  </span>
                </div>
                <div className="info-item mb-3">
                  <span className="label font-semibold">Payment Mode:</span>
                  <span className="value ml-2 capitalize">
                    {receiptData.transaction.payment_mode}
                  </span>
                </div>
                {receiptData.paymentId && (
                  <div className="info-item mb-3">
                    <span className="label font-semibold">Payment ID:</span>
                    <span className="value ml-2 font-mono text-sm">
                      {receiptData.paymentId}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <div className="info-item mb-3">
                  <span className="label font-semibold">Student Name:</span>
                  <span className="value ml-2">{receiptData.student.name}</span>
                </div>
                <div className="info-item mb-3">
                  <span className="label font-semibold">Admission No:</span>
                  <span className="value ml-2">{receiptData.student.admission_no}</span>
                </div>
                <div className="info-item mb-3">
                  <span className="label font-semibold">Class:</span>
                  <span className="value ml-2">
                    {receiptData.student.class?.class_name}
                    {receiptData.student.section && ` - ${receiptData.student.section}`}
                  </span>
                </div>
                <div className="info-item mb-3">
                  <span className="label font-semibold">Quarter:</span>
                  <span className="value ml-2">{receiptData.quarter.quarter_name}</span>
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="breakdown border border-gray-300 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-800 mb-4 text-center bg-gray-50 py-2 rounded">
                FEE BREAKDOWN
              </h4>
              <div className="space-y-2">
                <div className="breakdown-item flex justify-between py-1">
                  <span>Base Fee:</span>
                  <span>₹{receiptData.breakdown.baseFee.toLocaleString()}</span>
                </div>
                {receiptData.breakdown.extraCharges > 0 && (
                  <div className="breakdown-item flex justify-between py-1">
                    <span>Extra Charges:</span>
                    <span>₹{receiptData.breakdown.extraCharges.toLocaleString()}</span>
                  </div>
                )}
                {receiptData.breakdown.lateFee > 0 && (
                  <div className="breakdown-item flex justify-between py-1 text-red-600">
                    <span>Late Fee:</span>
                    <span>₹{receiptData.breakdown.lateFee.toLocaleString()}</span>
                  </div>
                )}
                {receiptData.breakdown.concession > 0 && (
                  <div className="breakdown-item flex justify-between py-1 text-green-600">
                    <span>Concession:</span>
                    <span>-₹{receiptData.breakdown.concession.toLocaleString()}</span>
                  </div>
                )}
                <div className="total flex justify-between pt-3 border-t-2 border-gray-800 font-bold text-lg">
                  <span>Total Paid:</span>
                  <span className="text-blue-600">₹{receiptData.transaction.amount_paid.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="qr-code text-center mb-6">
                <p className="text-sm text-gray-600 mb-2">Scan to verify receipt</p>
                <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
              </div>
            )}

            {/* Footer */}
            <div className="footer text-center mt-8 pt-6 border-t border-gray-300">
              <p className="text-sm text-gray-600 mb-2">
                This is a computer-generated receipt and does not require a signature.
              </p>
              <p className="text-sm text-gray-600 mb-2">
                For any queries, please contact the school office.
              </p>
              <p className="text-xs text-gray-500">
                Generated on {format(new Date(), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};