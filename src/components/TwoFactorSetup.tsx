import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, X, AlertCircle, CheckCircle, Key } from 'lucide-react';
import { useNotification } from './NotificationSystem';

interface TwoFactorSetupProps {
  onClose: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onClose }) => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'enroll' | 'verify'>('initial');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [hasMFA, setHasMFA] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasActiveFactor = factors?.totp?.some(f => f.status === 'verified');
      setHasMFA(!!hasActiveFactor);
    } catch (error) {
      console.error('Error checking MFA status:', error);
    }
  };

  const handleEnrollMFA = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'School Admin 2FA'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep('enroll');
    } catch (error: any) {
      showError('Enrollment Failed', error.message || 'Failed to enroll in 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      showError('Invalid Code', 'Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode
      });

      if (error) throw error;

      showSuccess('2FA Enabled', 'Two-factor authentication has been successfully enabled');
      setStep('verify');
      setHasMFA(true);
      setTimeout(() => onClose(), 2000);
    } catch (error: any) {
      showError('Verification Failed', error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will reduce account security.')) {
      return;
    }

    setLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const activeFactor = factors?.totp?.find(f => f.status === 'verified');

      if (activeFactor) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: activeFactor.id
        });

        if (error) throw error;

        showSuccess('2FA Disabled', 'Two-factor authentication has been disabled');
        setHasMFA(false);
        onClose();
      }
    } catch (error: any) {
      showError('Disable Failed', error.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 'initial' && (
            <div className="space-y-4">
              {hasMFA ? (
                <>
                  <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">2FA is currently enabled</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Two-factor authentication adds an extra layer of security to your account.
                  </p>
                  <button
                    onClick={handleDisableMFA}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Secure your account with two-factor authentication using an authenticator app.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Recommended Apps:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Google Authenticator</li>
                      <li>• Microsoft Authenticator</li>
                      <li>• Authy</li>
                    </ul>
                  </div>
                  <button
                    onClick={handleEnrollMFA}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Setting up...' : 'Enable 2FA'}
                  </button>
                </>
              )}
            </div>
          )}

          {step === 'enroll' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with your authenticator app:
                </p>
                {qrCode && (
                  <img
                    src={qrCode}
                    alt="QR Code"
                    className="mx-auto mb-4 border rounded-lg"
                  />
                )}
                <div className="bg-gray-50 border rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600 mb-1">Or enter this code manually:</p>
                  <code className="text-sm font-mono text-gray-800">{secret}</code>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit code from your app:
                </label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleVerifyMFA}
                disabled={loading || verifyCode.length !== 6}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify and Enable'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
