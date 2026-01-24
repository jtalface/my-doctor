import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Label } from '@/components/ui';
import * as api from '@/services/api';
import { Shift, FFDDecision, type SectionResult, type ItemResult } from '@ffd/shared';

export function NewAssessmentPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Reference data
  const [template, setTemplate] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [jobRoles, setJobRoles] = useState<any[]>([]);

  // Form state
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [jobRoleId, setJobRoleId] = useState('');
  const [shift, setShift] = useState<string>(Shift.DAY);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Section results
  const [sectionResults, setSectionResults] = useState<SectionResult[]>([]);

  // Vitals
  const [vitals, setVitals] = useState({
    bpSystolic: '',
    bpDiastolic: '',
    heartRate: '',
    spo2: '',
  });

  // Final
  const [finalDecision, setFinalDecision] = useState<string>(FFDDecision.FIT);
  const [restrictionsText, setRestrictionsText] = useState('');
  const [notes, setNotes] = useState('');
  const [employeeSignature, setEmployeeSignature] = useState('');
  const [assessorSignature, setAssessorSignature] = useState('');

  // Warnings
  const [warnings, setWarnings] = useState<string[]>([]);
  const [suggestedDecision, setSuggestedDecision] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [templateData, locationsData, jobRolesData] = await Promise.all([
        api.getActiveTemplate(),
        api.getLocations(),
        api.getJobRoles(),
      ]);

      setTemplate(templateData);
      setLocations(locationsData);
      setJobRoles(jobRolesData);

      // Initialize section results
      const initialResults: SectionResult[] = templateData.sections.map((section: any) => ({
        sectionId: section.id,
        sectionName: section.name,
        items: section.items.map((item: any) => ({
          itemId: item.id,
          passed: true,
          comment: '',
        })),
        passed: true,
      }));
      setSectionResults(initialResults);
    } catch (err) {
      setError('Failed to load form data');
    } finally {
      setIsLoading(false);
    }
  }

  const updateItemResult = (sectionIndex: number, itemIndex: number, passed: boolean) => {
    const updated = [...sectionResults];
    updated[sectionIndex].items[itemIndex].passed = passed;
    // Update section passed status
    updated[sectionIndex].passed = updated[sectionIndex].items.every((i) => i.passed);
    setSectionResults(updated);
    checkDecision(updated);
  };

  const updateSectionField = (sectionIndex: number, field: string, value: any) => {
    const updated = [...sectionResults];
    (updated[sectionIndex] as any)[field] = value;
    setSectionResults(updated);
    checkDecision(updated);
  };

  const checkDecision = async (sections: SectionResult[]) => {
    if (!template) return;
    try {
      const result = await api.previewDecision({
        sections,
        templateId: template.id,
        jobRoleId,
      });
      setWarnings(result.warnings);
      setSuggestedDecision(result.decision);
    } catch {
      // Ignore
    }
  };

  const handleSaveDraft = async () => {
    setError('');
    setIsSaving(true);
    try {
      const data = {
        templateId: template.id,
        employeeName,
        employeeId,
        locationId,
        jobRoleId,
        shift,
        date,
        sections: sectionResults,
        vitals: {
          bpSystolic: vitals.bpSystolic ? parseInt(vitals.bpSystolic) : undefined,
          bpDiastolic: vitals.bpDiastolic ? parseInt(vitals.bpDiastolic) : undefined,
          heartRate: vitals.heartRate ? parseInt(vitals.heartRate) : undefined,
          spo2: vitals.spo2 ? parseInt(vitals.spo2) : undefined,
        },
        finalDecision,
        restrictionsText: finalDecision === FFDDecision.FIT_WITH_RESTRICTIONS ? restrictionsText : undefined,
        notes,
      };

      const result = await api.createAssessment(data);
      navigate(`/assessments/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!employeeSignature || !assessorSignature) {
      setError('Both signatures are required to submit');
      return;
    }

    setIsSaving(true);
    try {
      // First create, then submit
      const createData = {
        templateId: template.id,
        employeeName,
        employeeId,
        locationId,
        jobRoleId,
        shift,
        date,
      };

      const created = await api.createAssessment(createData);

      const submitData = {
        sections: sectionResults,
        vitals: {
          bpSystolic: vitals.bpSystolic ? parseInt(vitals.bpSystolic) : undefined,
          bpDiastolic: vitals.bpDiastolic ? parseInt(vitals.bpDiastolic) : undefined,
          heartRate: vitals.heartRate ? parseInt(vitals.heartRate) : undefined,
          spo2: vitals.spo2 ? parseInt(vitals.spo2) : undefined,
        },
        finalDecision,
        restrictionsText: finalDecision === FFDDecision.FIT_WITH_RESTRICTIONS ? restrictionsText : undefined,
        notes,
        actionsTaken: [],
        signatures: {
          employeeName: employeeSignature,
          employeeSignedAt: new Date().toISOString(),
          assessorName: assessorSignature,
          assessorSignedAt: new Date().toISOString(),
        },
      };

      await api.submitAssessment(created.id, submitData);
      navigate(`/assessments/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading form...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">No active template found. Please contact administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">New FFD Assessment</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Employee Info */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeName">Employee Name *</Label>
              <Input
                id="employeeName"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <select
                id="location"
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                required
              >
                <option value="">Select location...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobRole">Job Role *</Label>
              <select
                id="jobRole"
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={jobRoleId}
                onChange={(e) => setJobRoleId(e.target.value)}
                required
              >
                <option value="">Select job role...</option>
                {jobRoles.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name} {j.safetyCritical ? '⚠️' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift">Shift *</Label>
              <select
                id="shift"
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={shift}
                onChange={(e) => setShift(e.target.value)}
              >
                <option value={Shift.DAY}>Day</option>
                <option value={Shift.NIGHT}>Night</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Sections */}
      {template.sections.map((section: any, sectionIndex: number) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle className="text-lg">{section.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.items.map((item: any, itemIndex: number) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 p-3 rounded-md ${
                  item.isRedFlag ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {item.isRedFlag && <span className="text-red-600 text-sm font-bold">⚠️</span>}
                    <span className={item.isRedFlag ? 'text-red-800' : ''}>
                      {item.text}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={sectionResults[sectionIndex]?.items[itemIndex]?.passed ? 'success' : 'outline'}
                    onClick={() => updateItemResult(sectionIndex, itemIndex, true)}
                  >
                    Pass
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!sectionResults[sectionIndex]?.items[itemIndex]?.passed ? 'destructive' : 'outline'}
                    onClick={() => updateItemResult(sectionIndex, itemIndex, false)}
                  >
                    Fail
                  </Button>
                </div>
              </div>
            ))}

            {/* Section-specific fields */}
            {section.hasVitals && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>BP Systolic</Label>
                  <Input
                    type="number"
                    placeholder="120"
                    value={vitals.bpSystolic}
                    onChange={(e) => setVitals({ ...vitals, bpSystolic: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>BP Diastolic</Label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={vitals.bpDiastolic}
                    onChange={(e) => setVitals({ ...vitals, bpDiastolic: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heart Rate</Label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={vitals.heartRate}
                    onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SpO2 %</Label>
                  <Input
                    type="number"
                    placeholder="98"
                    value={vitals.spo2}
                    onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  />
                </div>
              </div>
            )}

            {section.hasSleepHours && (
              <div className="pt-4 border-t">
                <div className="space-y-2 max-w-xs">
                  <Label>Hours of Sleep (last 24h)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    placeholder="8"
                    value={sectionResults[sectionIndex]?.sleepHours || ''}
                    onChange={(e) => updateSectionField(sectionIndex, 'sleepHours', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            )}

            {section.hasFatigueScore && (
              <div className="pt-4 border-t">
                <div className="space-y-2 max-w-xs">
                  <Label>Fatigue Score (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="3"
                    value={sectionResults[sectionIndex]?.fatigueScore || ''}
                    onChange={(e) => updateSectionField(sectionIndex, 'fatigueScore', parseInt(e.target.value))}
                  />
                  {(sectionResults[sectionIndex]?.fatigueScore || 0) > 4 && (
                    <p className="text-yellow-600 text-sm">⚠️ Fatigue score above threshold</p>
                  )}
                </div>
              </div>
            )}

            {section.hasBACTest && (
              <div className="pt-4 border-t">
                <div className="space-y-2 max-w-xs">
                  <Label>BAC Reading %</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0.000"
                    value={sectionResults[sectionIndex]?.bacReading || ''}
                    onChange={(e) => updateSectionField(sectionIndex, 'bacReading', parseFloat(e.target.value))}
                  />
                  {(sectionResults[sectionIndex]?.bacReading || 0) > 0 && (
                    <p className="text-red-600 text-sm">⚠️ BAC must be 0.00%</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Decision Preview */}
      <Card className={warnings.length > 0 ? 'border-yellow-400' : ''}>
        <CardHeader>
          <CardTitle>FFD Status Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
              <h4 className="font-medium text-yellow-800 mb-2">Warnings</h4>
              <ul className="list-disc list-inside text-sm text-yellow-700">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {suggestedDecision && (
            <p className="text-sm">
              Suggested decision: <strong>{suggestedDecision.replace(/_/g, ' ')}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Final Determination */}
      <Card>
        <CardHeader>
          <CardTitle>Final Determination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Decision *</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3"
              value={finalDecision}
              onChange={(e) => setFinalDecision(e.target.value)}
            >
              <option value={FFDDecision.FIT}>FIT</option>
              <option value={FFDDecision.FIT_WITH_RESTRICTIONS}>FIT WITH RESTRICTIONS</option>
              <option value={FFDDecision.TEMP_UNFIT}>TEMPORARILY UNFIT</option>
              <option value={FFDDecision.UNFIT}>UNFIT FOR DUTY</option>
            </select>
          </div>

          {finalDecision === FFDDecision.FIT_WITH_RESTRICTIONS && (
            <div className="space-y-2">
              <Label>Restrictions *</Label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                placeholder="Describe restrictions..."
                value={restrictionsText}
                onChange={(e) => setRestrictionsText(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2"
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee Signature (type name) *</Label>
              <Input
                value={employeeSignature}
                onChange={(e) => setEmployeeSignature(e.target.value)}
                placeholder="Employee name"
              />
            </div>
            <div className="space-y-2">
              <Label>Assessor Signature (type name) *</Label>
              <Input
                value={assessorSignature}
                onChange={(e) => setAssessorSignature(e.target.value)}
                placeholder="Assessor name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate('/assessments')}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={handleSaveDraft} disabled={isSaving}>
          Save Draft
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? 'Submitting...' : 'Submit Assessment'}
        </Button>
      </div>
    </div>
  );
}
