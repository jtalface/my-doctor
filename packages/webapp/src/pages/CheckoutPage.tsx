/**
 * Checkout Page
 * 
 * Modern checkout flow for payments in Mozambique (eMola) and Angola (Multicaixa).
 * Features:
 * - Country selection via dropdown
 * - Amount input with currency display
 * - Phone number for MZ (eMola)
 * - Status polling after initiation
 * - Resend and check status buttons
 * - Full i18n support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslate } from '../i18n';
import {
  initiatePayment,
  getPayment,
  resendPayment,
  formatAmount,
  isTerminalStatus,
  PROVIDER_NAMES,
  type CountryCode,
  type CurrencyCode,
  type PaymentStatus,
  type PaymentDetails,
  type InitiatePaymentResponse,
} from '../services/paymentsApi';
import styles from './CheckoutPage.module.css';

// Constants
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_DURATION_MS = 120000; // 2 minutes

const COUNTRY_CONFIG: Record<CountryCode, { 
  currency: CurrencyCode; 
  flag: string;
  provider: string;
  providerIcon: string;
}> = {
  'MZ': { 
    currency: 'MZN', 
    flag: '🇲🇿',
    provider: 'eMola',
    providerIcon: '📱',
  },
  'AO': { 
    currency: 'AOA', 
    flag: '🇦🇴',
    provider: 'Multicaixa',
    providerIcon: '🏦',
  },
};

type PageState = 'form' | 'processing' | 'status';

export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const t = useTranslate();
  
  // Form state
  const [country, setCountry] = useState<CountryCode>('MZ');
  const [amount, setAmount] = useState('');
  const [msisdn, setMsisdn] = useState('');
  const [orderId] = useState(() => `ORD-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  
  // Payment state
  const [pageState, setPageState] = useState<PageState>('form');
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [initiateResponse, setInitiateResponse] = useState<InitiatePaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Polling refs
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingStartRef = useRef<number>(0);

  // Pre-fill from query params (for testing)
  useEffect(() => {
    const queryCountry = searchParams.get('country');
    if (queryCountry === 'MZ' || queryCountry === 'AO') {
      setCountry(queryCountry);
    }
    const queryAmount = searchParams.get('amount');
    if (queryAmount) {
      setAmount(queryAmount);
    }
  }, [searchParams]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  // Poll for payment status
  const pollStatus = useCallback(async (paymentId: string) => {
    const elapsed = Date.now() - pollingStartRef.current;
    if (elapsed >= MAX_POLL_DURATION_MS) {
      setIsPolling(false);
      setError(t('checkout_status_expired_desc'));
      return;
    }

    try {
      const paymentDetails = await getPayment(paymentId);
      setPayment(paymentDetails);
      
      if (isTerminalStatus(paymentDetails.status)) {
        setIsPolling(false);
        return;
      }
      
      pollingTimeoutRef.current = setTimeout(() => {
        pollStatus(paymentId);
      }, POLL_INTERVAL_MS);
    } catch (err) {
      console.error('Failed to poll status:', err);
      pollingTimeoutRef.current = setTimeout(() => {
        pollStatus(paymentId);
      }, POLL_INTERVAL_MS);
    }
  }, [t]);

  // Start polling
  const startPolling = useCallback((paymentId: string) => {
    pollingStartRef.current = Date.now();
    setIsPolling(true);
    pollStatus(paymentId);
  }, [pollStatus]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountMinor = Math.round(parseFloat(amount) * 100);
    
    if (isNaN(amountMinor) || amountMinor <= 0) {
      setError(t('checkout_error_amount'));
      return;
    }

    if (country === 'MZ' && !msisdn.trim()) {
      setError(t('checkout_error_phone'));
      return;
    }

    setPageState('processing');

    try {
      const response = await initiatePayment({
        orderId,
        country,
        amount: amountMinor,
        currency: COUNTRY_CONFIG[country].currency,
        method: country === 'MZ' ? 'MOBILE_MONEY' : 'LOCAL_RAIL',
        msisdn: country === 'MZ' ? msisdn.trim() : undefined,
      });

      setInitiateResponse(response);
      setPageState('status');
      
      const paymentDetails = await getPayment(response.paymentId);
      setPayment(paymentDetails);
      
      if (!isTerminalStatus(paymentDetails.status)) {
        startPolling(response.paymentId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('checkout_error_failed'));
      setPageState('form');
    }
  };

  // Handle resend
  const handleResend = async () => {
    if (!payment || isResending) return;
    
    setIsResending(true);
    setError(null);
    
    try {
      await resendPayment(payment.paymentId);
      const paymentDetails = await getPayment(payment.paymentId);
      setPayment(paymentDetails);
      
      if (!isTerminalStatus(paymentDetails.status)) {
        startPolling(payment.paymentId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('wait')) {
        const match = message.match(/(\d+)/);
        if (match) {
          setError(t('checkout_wait_resend', { seconds: match[1] }));
        } else {
          setError(message);
        }
      } else {
        setError(message || t('checkout_error_failed'));
      }
    } finally {
      setIsResending(false);
    }
  };

  // Handle manual status check
  const handleCheckStatus = async () => {
    if (!payment) return;
    
    try {
      const paymentDetails = await getPayment(payment.paymentId);
      setPayment(paymentDetails);
      
      if (isTerminalStatus(paymentDetails.status)) {
        setIsPolling(false);
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('checkout_error_failed'));
    }
  };

  // Handle retry
  const handleRetry = () => {
    setPayment(null);
    setInitiateResponse(null);
    setError(null);
    setIsPolling(false);
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }
    setPageState('form');
  };

  // Get status display info
  const getStatusInfo = (status: PaymentStatus) => {
    switch (status) {
      case 'SUCCESS':
        return { 
          icon: '✓', 
          title: t('checkout_status_success'),
          desc: t('checkout_status_success_desc'),
          className: styles.statusIconSuccess 
        };
      case 'FAILED':
        return { 
          icon: '✕', 
          title: t('checkout_status_failed'),
          desc: payment?.failureReason || t('checkout_status_failed_desc'),
          className: styles.statusIconFailed 
        };
      case 'EXPIRED':
        return { 
          icon: '⏱', 
          title: t('checkout_status_expired'),
          desc: t('checkout_status_expired_desc'),
          className: styles.statusIconFailed 
        };
      default:
        return { 
          icon: '⋯', 
          title: t('checkout_status_pending'),
          desc: country === 'MZ' ? t('checkout_emola_instructions') : t('checkout_multicaixa_instructions'),
          className: styles.statusIconPending 
        };
    }
  };

  // Render form
  const renderForm = () => (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Country Selection */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>{t('checkout_select_country')}</label>
        <div className={styles.inputWrapper}>
          <span className={styles.inputIcon}>🌍</span>
          <select
            className={styles.select}
            value={country}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
          >
            <option value="MZ">{COUNTRY_CONFIG.MZ.flag} {t('checkout_country_mz')} (MZN)</option>
            <option value="AO">{COUNTRY_CONFIG.AO.flag} {t('checkout_country_ao')} (AOA)</option>
          </select>
        </div>
      </div>

      {/* Amount */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>{t('checkout_amount')}</label>
        <div className={styles.amountWrapper}>
          <span className={styles.currencyBadge}>{COUNTRY_CONFIG[country].currency}</span>
          <input
            type="number"
            className={styles.amountInput}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t('checkout_amount_placeholder')}
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      {/* Phone Number (MZ only) */}
      {country === 'MZ' && (
        <div className={styles.inputGroup}>
          <label className={styles.label}>{t('checkout_phone_number')}</label>
          <div className={styles.inputWrapper}>
            <span className={styles.inputIcon}>📱</span>
            <input
              type="tel"
              className={styles.input}
              value={msisdn}
              onChange={(e) => setMsisdn(e.target.value)}
              placeholder={t('checkout_phone_placeholder')}
              required
            />
          </div>
          <span className={styles.hint} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
            {t('checkout_phone_required')}
          </span>
        </div>
      )}

      {/* Provider Badge */}
      <div className={styles.providerBadge}>
        <span className={styles.providerIcon}>{COUNTRY_CONFIG[country].providerIcon}</span>
        <div className={styles.providerInfo}>
          <div className={styles.providerName}>
            {t('checkout_pay_with', { provider: COUNTRY_CONFIG[country].provider })}
          </div>
          <div className={styles.providerDesc}>
            {country === 'MZ' ? t('checkout_emola_instructions').slice(0, 60) + '...' : t('checkout_multicaixa_instructions').slice(0, 60) + '...'}
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <button type="submit" className={styles.submitButton}>
        <span className={styles.buttonIcon}>🔒</span>
        {amount ? `${t('checkout_pay_button')} ${formatAmount(Math.round(parseFloat(amount) * 100) || 0, COUNTRY_CONFIG[country].currency)}` : t('checkout_pay_button')}
      </button>
    </form>
  );

  // Render processing
  const renderProcessing = () => (
    <div className={styles.statusPanel}>
      <div className={`${styles.statusIconWrapper} ${styles.statusIconPending}`}>
        ⏳
      </div>
      <h2 className={styles.statusTitle}>{t('checkout_processing')}</h2>
      <p className={styles.statusDescription}>{t('checkout_processing_desc')}</p>
    </div>
  );

  // Render status
  const renderStatus = () => {
    if (!payment) return renderProcessing();

    const isPending = payment.status === 'PENDING' || payment.status === 'CREATED';
    const isSuccess = payment.status === 'SUCCESS';
    const isFailed = ['FAILED', 'EXPIRED', 'CANCELED'].includes(payment.status);
    const canResend = isPending && payment.provider === 'EMOLA';
    const statusInfo = getStatusInfo(payment.status);

    return (
      <div className={styles.statusPanel}>
        <div className={`${styles.statusIconWrapper} ${statusInfo.className}`}>
          {statusInfo.icon}
        </div>
        
        <h2 className={styles.statusTitle}>{statusInfo.title}</h2>
        <p className={styles.statusDescription}>{statusInfo.desc}</p>

        {/* Reference for Multicaixa */}
        {payment.provider === 'MULTICAIXA' && payment.providerReference && isPending && (
          <div className={styles.referenceCard}>
            <div className={styles.referenceLabel}>{t('checkout_reference_label')}</div>
            <div className={styles.referenceValue}>{payment.providerReference}</div>
          </div>
        )}

        {/* Payment Details */}
        <div className={styles.paymentDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{t('checkout_amount_label')}</span>
            <span className={styles.detailValue}>
              {formatAmount(payment.amount, payment.currency)}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{t('checkout_provider_label')}</span>
            <span className={styles.detailValue}>{PROVIDER_NAMES[payment.provider]}</span>
          </div>
          {payment.msisdnLast4 && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>{t('checkout_phone_label')}</span>
              <span className={styles.detailValue}>***{payment.msisdnLast4}</span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{t('checkout_order_label')}</span>
            <span className={styles.detailValue}>{payment.orderId}</span>
          </div>
        </div>

        <div className={styles.actionButtons}>
          {isPending && (
            <>
              {canResend && (
                <button
                  className={styles.primaryAction}
                  onClick={handleResend}
                  disabled={isResending}
                >
                  {isResending ? '...' : t('checkout_resend_prompt')}
                </button>
              )}
              <button
                className={styles.secondaryAction}
                onClick={handleCheckStatus}
              >
                {t('checkout_check_status')}
              </button>
            </>
          )}
          
          {isFailed && (
            <button
              className={styles.primaryAction}
              onClick={handleRetry}
            >
              {t('checkout_try_again')}
            </button>
          )}
          
          {isSuccess && (
            <Link to="/dashboard" className={styles.primaryAction}>
              {t('checkout_back_dashboard')}
            </Link>
          )}
        </div>

        {isPending && isPolling && (
          <div className={styles.pollingIndicator}>
            <div className={styles.spinner} />
            <span>{t('checkout_checking_status')}</span>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage} style={{ marginTop: 'var(--space-3)' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Link to="/dashboard" className={styles.backButton}>
        {t('common_back')}
      </Link>

      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.secureIcon}>🔐</div>
          <h1 className={styles.title}>{t('checkout_title')}</h1>
          <p className={styles.subtitle}>{t('checkout_subtitle')}</p>
        </header>

        {pageState === 'form' && renderForm()}
        {pageState === 'processing' && renderProcessing()}
        {pageState === 'status' && renderStatus()}

        <footer className={styles.footer}>
          <div className={styles.secureNote}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
            <span>{t('checkout_secure_payment')}</span>
          </div>
          {pageState !== 'form' && (
            <Link to="/dashboard" className={styles.backLink}>
              {t('checkout_back_dashboard')}
            </Link>
          )}
        </footer>
      </div>
    </div>
  );
}

export default CheckoutPage;
