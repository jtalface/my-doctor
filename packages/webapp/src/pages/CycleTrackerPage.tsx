import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveProfile } from '../contexts';
import { useCycleData } from '../hooks/useCycleData';
import { useCycleCalendar } from '../hooks/useCycleCalendar';
import { Calendar } from '../components/cycle/Calendar';
import { PredictionBanner } from '../components/cycle/PredictionBanner';
import { MonthNavigation } from '../components/cycle/MonthNavigation';
import styles from './CycleTrackerPage.module.css';

export function CycleTrackerPage() {
  const navigate = useNavigate();
  const { activeProfile, isViewingDependent } = useActiveProfile();
  
  // Get cycle data
  const {
    settings,
    dailyLogs,
    predictions,
    isLoading,
    error,
    loadDailyLogs,
  } = useCycleData({
    userId: activeProfile?.id,
    autoLoad: true,
  });
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Load daily logs for current month (and adjacent months for complete calendar view)
  useEffect(() => {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    // Extend to include previous and next month days shown in calendar
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - 7);
    
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + 7);
    
    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    
    loadDailyLogs(formatDate(startDate), formatDate(endDate));
  }, [year, month, loadDailyLogs]);
  
  // Generate calendar data
  const calendarMonth = useCycleCalendar({
    year,
    month,
    dailyLogs,
    predictions,
  });
  
  // Navigation handlers
  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);
  
  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);
  
  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);
  
  const handleDayClick = useCallback((date: string) => {
    setSelectedDate(date);
    navigate(`/cycle/log/${date}`);
  }, [navigate]);
  
  const handleGoToInsights = useCallback(() => {
    navigate('/cycle/insights');
  }, [navigate]);
  
  const handleGoToSettings = useCallback(() => {
    navigate('/cycle/settings');
  }, [navigate]);
  
  // If no settings, show onboarding
  if (!settings && !isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.onboarding}>
          <div className={styles.onboardingContent}>
            <span className={styles.onboardingIcon}>🌸</span>
            <h2>Welcome to Cycle Tracking</h2>
            <p>
              Track your period, predict fertile windows, and understand your cycle better.
            </p>
            <button
              className={styles.primaryButton}
              onClick={() => navigate('/cycle/onboarding')}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (error && !settings) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <h3>Error Loading Cycle Data</h3>
          <p>{error}</p>
          <button className={styles.primaryButton} onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {isViewingDependent ? `${activeProfile?.name}'s ` : ''}Cycle Tracker
        </h1>
        <div className={styles.headerActions}>
          <button
            className={styles.iconButton}
            onClick={handleGoToInsights}
            aria-label="View insights"
            title="Insights"
          >
            📊
          </button>
          <button
            className={styles.iconButton}
            onClick={handleGoToSettings}
            aria-label="Settings"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>
      
      <main className={styles.main}>
        {predictions && (
          <PredictionBanner predictions={predictions} />
        )}
        
        <MonthNavigation
          year={year}
          month={month}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
        />
        
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading calendar...</p>
          </div>
        ) : (
          <Calendar
            calendarMonth={calendarMonth}
            onDayClick={handleDayClick}
            selectedDate={selectedDate}
          />
        )}
        
        <div className={styles.quickActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              navigate(`/cycle/log/${today}`);
            }}
          >
            Log Today
          </button>
          <button
            className={styles.secondaryButton}
            onClick={handleGoToInsights}
          >
            View Insights
          </button>
        </div>
      </main>
    </div>
  );
}

