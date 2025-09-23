import React, { useEffect, useState } from 'react';
import { X, CreditCard, Shield, Lock } from 'lucide-react';

interface PaymentDetails {
  student: any;
  quarter: any;
  amount: number;
  breakdown: {
    baseFee: number;
    extraCharges: number;
    lateFee: number;
    concession: number;
    total: number;
  };
}

interface PaymentGatewayProps {
  paymentDetails: PaymentDetails;
  onSuccess: (paymentData: any) => void;
  onFailure: (error: any) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  paymentDetails,
  onSuccess,
  onFailure,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      alert('Payment gateway is currently unavailable. Please try again later.');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!razorpayLoaded || !window.Razorpay) {
      alert('Payment gateway is loading. Please wait a moment and try again.');
      return;
    }

    setLoading(true);

    try {
      // In a real implementation, you would create an order on your backend
      // For demo purposes, we'll simulate this
      const orderData = {
        id: `order_${Date.now()}`,
        amount: paymentDetails.amount * 100, // Razorpay expects amount in paise
        currency: 'INR'
      };

      const options = {
        key: 'rzp_test_1234567890', // Replace with your Razorpay key
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'J.R. Preparatory School',
        description: `Fee payment for ${paymentDetails.quarter.quarter_name}`,
        order_id: orderData.id,
        prefill: {
          name: paymentDetails.student.name,
          email: paymentDetails.student.parent_email || '',
          contact: paymentDetails.student.parent_contact || ''
        },
        theme: {
          color: '#2563eb'
        },
        handler: function (response: any) {
          // Payment successful
          const paymentData = {
            student_id: paymentDetails.student.id,
            quarter_id: paymentDetails.quarter.id,
            amount: paymentDetails.amount,
            late_fee: paymentDetails.breakdown.lateFee,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          };
          onSuccess(paymentData);
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response: any) {
        onFailure(response.error);
        setLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      onFailure(error);
      setLoading(false);
    }
  };

  // Demo payment for testing (remove in production)
  const handleDemoPayment = () => {
    setLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const demoPaymentData = {
        student_id: paymentDetails.student.id,
        quarter_id: paymentDetails.quarter.id,
        amount: paymentDetails.amount,
        late_fee: paymentDetails.breakdown.lateFee,
        razorpay_payment_id: `demo_${Date.now()}`,
        razorpay_order_id: `order_demo_${Date.now()}`,
        razorpay_signature: 'demo_signature'
      };
      onSuccess(demoPaymentData);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Student Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Student Details</h4>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-600">Name:</span> {paymentDetails.student.name}</p>
              <p><span className="text-gray-600">Admission No:</span> {paymentDetails.student.admission_no}</p>
              <p><span className="text-gray-600">Class:</span> {paymentDetails.student.class?.class_name}</p>
              <p><span className="text-gray-600">Quarter:</span> {paymentDetails.quarter.quarter_name}</p>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Fee Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Fee:</span>
                <span>₹{paymentDetails.breakdown.baseFee.toLocaleString()}</span>
              </div>
              {paymentDetails.breakdown.extraCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Extra Charges:</span>
                  <span>₹{paymentDetails.breakdown.extraCharges.toLocaleString()}</span>
                </div>
              )}
              {paymentDetails.breakdown.lateFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Late Fee:</span>
                  <span className="text-red-600">₹{paymentDetails.breakdown.lateFee.toLocaleString()}</span>
                </div>
              )}
              {paymentDetails.breakdown.concession > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Concession:</span>
                  <span className="text-green-600">-₹{paymentDetails.breakdown.concession.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">₹{paymentDetails.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Secure Payment</span>
            </div>
            <p className="text-xs text-blue-700">
              Your payment is secured with 256-bit SSL encryption. We don't store your card details.
            </p>
          </div>

          {/* Payment Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePayment}
              disabled={loading || !razorpayLoaded}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Pay with Razorpay</span>
                </>
              )}
            </button>

            {/* Demo Payment Button (remove in production) */}
            <button
              onClick={handleDemoPayment}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Demo Payment (Testing)</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By proceeding, you agree to our terms and conditions
          </p>
        </div>
      </div>
    </div>
  );
};