import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import * as api from '@/services/api';
import { FFDDecision, AssessmentStatus, UserRole } from '@ffd/shared';
import { useAuth } from '@/contexts/AuthContext';

export function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [showVoidModal, setShowVoidModal] = useState(false);

  useEffect(() => {
    loadAssessment();
  }, [id]);

  async function loadAssessment() {
    if (!id) return;
    try {
      const data = await api.getAssessment(id);
      setAssessment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setIsLoading(false);
    }
  }

  const handleVoid = async () => {
    if (!id || !voidReason.trim()) return;
    try {
      await api.voidAssessment(id, voidReason);
      loadAssessment();
      setShowVoidModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to void assessment');
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case FFDDecision.FIT:
        return 'bg-green-100 text-green-800 border-green-200';
      case FFDDecision.FIT_WITH_RESTRICTIONS:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case FFDDecision.TEMP_UNFIT:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case FFDDecision.UNFIT:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error || 'Assessment not found'}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/assessments')}>
          Back to Assessments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">FFD Assessment</h1>
          <p className="text-muted-foreground">
            {assessment.date} • {assessment.shift} Shift
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role === UserRole.ADMIN && 
           assessment.status === AssessmentStatus.SUBMITTED && (
            <Button variant="destructive" onClick={() => setShowVoidModal(true)}>
              Void Assessment
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/assessments')}>
            Back
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {assessment.status === AssessmentStatus.VOIDED && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <h3 className="font-bold text-red-800">Assessment Voided</h3>
          <p className="text-red-700 text-sm">{assessment.voidReason}</p>
        </div>
      )}

      {/* Decision Card */}
      <Card className={`border-2 ${getDecisionColor(assessment.finalDecision)}`}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {assessment.finalDecision.replace(/_/g, ' ')}
            </div>
            {assessment.restrictionsText && (
              <p className="mt-2 text-sm">{assessment.restrictionsText}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employee Info */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-medium">{assessment.employeeName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Employee ID</div>
              <div className="font-medium">{assessment.employeeId}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Location</div>
              <div className="font-medium">
                {assessment.locationId?.name || assessment.locationId}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Job Role</div>
              <div className="font-medium">
                {assessment.jobRoleId?.name || assessment.jobRoleId}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Shift</div>
              <div className="font-medium">{assessment.shift}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Date</div>
              <div className="font-medium">{assessment.date}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assessment.sections?.map((section: any) => (
              <div
                key={section.sectionId}
                className={`flex justify-between items-center p-3 rounded-md ${
                  section.passed ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <span>{section.sectionName}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    section.passed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {section.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vitals (if visible) */}
      {assessment.vitals && (
        <Card>
          <CardHeader>
            <CardTitle>Vitals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {assessment.vitals.bpSystolic && (
                <div>
                  <div className="text-sm text-muted-foreground">BP Systolic</div>
                  <div className="font-medium">{assessment.vitals.bpSystolic}</div>
                </div>
              )}
              {assessment.vitals.bpDiastolic && (
                <div>
                  <div className="text-sm text-muted-foreground">BP Diastolic</div>
                  <div className="font-medium">{assessment.vitals.bpDiastolic}</div>
                </div>
              )}
              {assessment.vitals.heartRate && (
                <div>
                  <div className="text-sm text-muted-foreground">Heart Rate</div>
                  <div className="font-medium">{assessment.vitals.heartRate}</div>
                </div>
              )}
              {assessment.vitals.spo2 && (
                <div>
                  <div className="text-sm text-muted-foreground">SpO2</div>
                  <div className="font-medium">{assessment.vitals.spo2}%</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {assessment.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{assessment.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Signatures */}
      {assessment.signatures && (
        <Card>
          <CardHeader>
            <CardTitle>Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Employee</div>
                <div className="font-medium">{assessment.signatures.employeeName}</div>
                {assessment.signatures.employeeSignedAt && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(assessment.signatures.employeeSignedAt).toLocaleString()}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Assessor</div>
                <div className="font-medium">{assessment.signatures.assessorName}</div>
                {assessment.signatures.assessorSignedAt && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(assessment.signatures.assessorSignedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Void Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>Void Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Please provide a reason for voiding this assessment.
              </p>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                placeholder="Reason for voiding (min 10 characters)..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowVoidModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleVoid}
                  disabled={voidReason.length < 10}
                >
                  Void Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
