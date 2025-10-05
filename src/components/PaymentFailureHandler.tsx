import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface PaymentFailureHandlerProps {
  error: any;
  onRetry: () => void;
  onCancel: () => void;
  retryCount?: number;
  maxRetries?: number;
}

export const PaymentFailureHandler: React.FC<PaymentFailureHandlerProps> = ({
  error,
  onRetry,
  onCancel,
  retryCount = 0,
  maxRetries = 3
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorMessage = () => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'Payment processing failed. Please try again.';
  };

  const canRetry = retryCount < maxRetries;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Failed</h3>
              <p className="text-sm text-gray-600">
                {retryCount > 0 && `Attempt ${retryCount + 1} of ${maxRetries + 1}`}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{getErrorMessage()}</p>
          </div>

          {!canRetry && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                Maximum retry attempts reached. Please contact support if the issue persists.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">Possible solutions:</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Check your internet connection</li>
              <li>Verify payment details are correct</li>
              <li>Ensure sufficient balance/funds</li>
              <li>Try a different payment method</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel Payment
          </button>
          {canRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isRetrying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Retrying...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Payment</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export interface PaymentRetryConfig {
  maxRetries: number;
  retryDelay: number;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: () => void;
}

export const usePaymentRetry = (config: PaymentRetryConfig) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<any>(null);

  const attemptPayment = async (paymentFn: () => Promise<void>) => {
    setIsRetrying(true);
    setError(null);

    try {
      await paymentFn();
      setRetryCount(0);
      return { success: true };
    } catch (err) {
      setError(err);

      if (retryCount < config.maxRetries) {
        config.onRetry?.(retryCount + 1);
        setRetryCount(prev => prev + 1);

        await new Promise(resolve => setTimeout(resolve, config.retryDelay));

        return attemptPayment(paymentFn);
      } else {
        config.onMaxRetriesReached?.();
        return { success: false, error: err };
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const reset = () => {
    setRetryCount(0);
    setError(null);
    setIsRetrying(false);
  };

  return {
    attemptPayment,
    retryCount,
    isRetrying,
    error,
    reset
  };
};
