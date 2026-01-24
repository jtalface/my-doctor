import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import * as api from '@/services/api';
import { FFDDecision, UserRole } from '@ffd/shared';

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryData, assessmentsData] = await Promise.all([
          api.getReportSummary(),
          api.getAssessments({ limit: '5' }),
        ]);
        setSummary(summaryData);
        setRecentAssessments(assessmentsData.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case FFDDecision.FIT:
        return 'bg-green-100 text-green-800';
      case FFDDecision.FIT_WITH_RESTRICTIONS:
        return 'bg-yellow-100 text-yellow-800';
      case FFDDecision.TEMP_UNFIT:
        return 'bg-orange-100 text-orange-800';
      case FFDDecision.UNFIT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        {(user?.role === UserRole.ADMIN || user?.role === UserRole.ASSESSOR) && (
          <Link to="/assessments/new">
            <Button>New Assessment</Button>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalAssessments || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fit for Duty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {summary?.byDecision?.[FFDDecision.FIT] || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fit with Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {summary?.byDecision?.[FFDDecision.FIT_WITH_RESTRICTIONS] || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unfit / Temp Unfit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {(summary?.byDecision?.[FFDDecision.UNFIT] || 0) +
                (summary?.byDecision?.[FFDDecision.TEMP_UNFIT] || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assessments */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Assessments</CardTitle>
            <Link to="/assessments">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentAssessments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No assessments yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentAssessments.map((assessment) => (
                <Link
                  key={assessment.id}
                  to={`/assessments/${assessment.id}`}
                  className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{assessment.employeeName}</div>
                      <div className="text-sm text-muted-foreground">
                        {assessment.employeeId} • {assessment.date}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getDecisionColor(
                        assessment.finalDecision
                      )}`}
                    >
                      {assessment.finalDecision.replace(/_/g, ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
