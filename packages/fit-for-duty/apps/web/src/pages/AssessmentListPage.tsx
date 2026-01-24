import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import * as api from '@/services/api';
import { FFDDecision, AssessmentStatus, UserRole } from '@ffd/shared';
import { useAuth } from '@/contexts/AuthContext';

export function AssessmentListPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    employeeId: '',
  });

  useEffect(() => {
    loadAssessments();
  }, [page]);

  async function loadAssessments() {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '20',
      };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.employeeId) params.employeeId = filters.employeeId;

      const result = await api.getAssessments(params);
      setAssessments(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadAssessments();
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case AssessmentStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case AssessmentStatus.SUBMITTED:
        return 'bg-blue-100 text-blue-800';
      case AssessmentStatus.VOIDED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Assessments</h1>
        {(user?.role === UserRole.ADMIN || user?.role === UserRole.ASSESSOR) && (
          <Link to="/assessments/new">
            <Button>New Assessment</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                type="date"
                placeholder="Start Date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                type="date"
                placeholder="End Date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                type="text"
                placeholder="Employee ID"
                value={filters.employeeId}
                onChange={(e) =>
                  setFilters({ ...filters, employeeId: e.target.value })
                }
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assessments found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Employee</th>
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">Shift</th>
                    <th className="text-left py-3 px-4">Decision</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => (
                    <tr key={a.id} className="border-b hover:bg-accent/50">
                      <td className="py-3 px-4">{a.date}</td>
                      <td className="py-3 px-4">{a.employeeName}</td>
                      <td className="py-3 px-4">{a.employeeId}</td>
                      <td className="py-3 px-4">{a.shift}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getDecisionColor(
                            a.finalDecision
                          )}`}
                        >
                          {a.finalDecision.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            a.status
                          )}`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/assessments/${a.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="py-2 px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
