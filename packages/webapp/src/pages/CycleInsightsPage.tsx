import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useActiveProfile } from '../contexts';
import { useCycleData } from '../hooks/useCycleData';
import { useCycleStats } from '../hooks/useCycleStats';
import { useTranslate } from '../i18n';
import styles from './CycleInsightsPage.module.css';

export function CycleInsightsPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { activeProfile, isViewingDependent } = useActiveProfile();
  
  const {
    cycles,
    settings,
    isLoading,
    error,
  } = useCycleData({
    userId: activeProfile?.id,
    autoLoad: true,
  });
  
  const stats = useCycleStats(cycles);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    return cycles
      .filter(c => c.cycleLength > 0)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map(cycle => ({
        date: new Date(cycle.startDate).toLocaleDateString('en-US', { 
          month: 'short',
          day: 'numeric'
        }),
        cycleLength: cycle.cycleLength,
        periodLength: cycle.periodLength,
      }));
  }, [cycles]);
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading insights...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <h3>{t('cycle_error_loading')}</h3>
          <p>{error}</p>
          <button className={styles.primaryButton} onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (cycles.length === 0) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/cycle')}>
            ←
          </button>
          <h1 className={styles.title}>{t('cycle_insights_title')}</h1>
          <div className={styles.headerRight} />
        </header>
        
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📊</span>
          <h2>No Data Yet</h2>
          <p>Start logging your periods to see insights and trends.</p>
          <button className={styles.primaryButton} onClick={() => navigate('/cycle')}>
            Go to Calendar
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/cycle')}>
          ←
        </button>
        <h1 className={styles.title}>
          {isViewingDependent ? `${activeProfile?.name}'s ` : ''}{t('cycle_insights_title')}
        </h1>
        <div className={styles.headerRight} />
      </header>
      
      <main className={styles.main}>
        {/* Stats Overview */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('cycle_overview_section')}</h2>
          
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📅</div>
              <div className={styles.statValue}>{stats.averageCycleLength}</div>
              <div className={styles.statLabel}>{t('cycle_stat_avg_cycle')}</div>
              <div className={styles.statUnit}>{t('cycle_stat_days')}</div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🩸</div>
              <div className={styles.statValue}>{stats.averagePeriodLength}</div>
              <div className={styles.statLabel}>{t('cycle_stat_avg_period')}</div>
              <div className={styles.statUnit}>{t('cycle_stat_days')}</div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📊</div>
              <div className={styles.statValue}>{stats.totalCycles}</div>
              <div className={styles.statLabel}>{t('cycle_stat_total_cycles')}</div>
              <div className={styles.statUnit}>{t('cycle_stat_logged')}</div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                {stats.cycleRegularity === 'regular' ? '✅' : '⚠️'}
              </div>
              <div className={styles.statValue}>
                {stats.cycleRegularity === 'regular' ? t('cycle_pattern_regular') : t('cycle_pattern_irregular')}
              </div>
              <div className={styles.statLabel}>Cycle Pattern</div>
              <div className={styles.statUnit}>
                ±{stats.cycleLengthStdDev} days
              </div>
            </div>
          </div>
        </section>
        
        {/* Cycle Length Chart */}
        {chartData.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('cycle_chart_cycle_length')}</h2>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    style={{ fontSize: '12px' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="cycleLength" 
                    stroke="#e91e63" 
                    strokeWidth={2}
                    name="Cycle Length"
                    dot={{ fill: '#e91e63', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className={styles.chartNote}>
              Your average cycle length is {stats.averageCycleLength} days with a standard deviation of ±{stats.cycleLengthStdDev} days.
            </p>
          </section>
        )}
        
        {/* Period Length Chart */}
        {chartData.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('cycle_chart_period_length')}</h2>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    style={{ fontSize: '12px' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="periodLength" 
                    stroke="#f48fb1" 
                    strokeWidth={2}
                    name="Period Length"
                    dot={{ fill: '#f48fb1', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className={styles.chartNote}>
              Your average period lasts {stats.averagePeriodLength} days.
            </p>
          </section>
        )}
        
        {/* History */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('cycle_history_section')}</h2>
          
          {stats.oldestCycleDate && (
            <p className={styles.trackingSince}>
              Tracking since {formatDate(stats.oldestCycleDate)}
            </p>
          )}
          
          <div className={styles.historyList}>
            {cycles.slice(0, 10).map(cycle => (
              <div key={cycle._id} className={styles.historyItem}>
                <div className={styles.historyDate}>
                  {formatDate(cycle.startDate)}
                </div>
                <div className={styles.historyDetails}>
                  <span className={styles.historyBadge}>
                    Period: {cycle.periodLength} days
                  </span>
                  {cycle.cycleLength > 0 && (
                    <span className={styles.historyBadge}>
                      Cycle: {cycle.cycleLength} days
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {cycles.length > 10 && (
            <p className={styles.moreInfo}>
              Showing 10 most recent cycles out of {cycles.length} total
            </p>
          )}
        </section>
        
        {/* Settings Info */}
        {settings && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Prediction Settings</h2>
            <div className={styles.settingsInfo}>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>Cycle Type:</span>
                <span className={styles.settingValue}>
                  {settings.irregularCycle ? t('cycle_pattern_irregular') : t('cycle_pattern_regular')}
                </span>
              </div>
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>Last Period:</span>
                <span className={styles.settingValue}>
                  {formatDate(settings.lastPeriodStart)}
                </span>
              </div>
            </div>
            <button 
              className={styles.secondaryButton}
              onClick={() => navigate('/cycle/settings')}
            >
              Adjust Settings
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

