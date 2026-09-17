import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Upload,
  BookOpen,
  Calendar,
  Sparkles,
  Check,
  Clock,
  Plus,
  ArrowRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { api } from '../../api/client';
import { Course, Assignment, Assessment, StudyPlan } from '../../types';

export const AcademicsPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'assignments' | 'assessments' | 'plans'>('courses');
  const [isLoading, setIsLoading] = useState(true);

  // Upload & Extraction States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Confirmation Preview Modal State
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Study Plan Generator Modal State
  const [isStudyPlanModalOpen, setIsStudyPlanModalOpen] = useState(false);
  const [planCourseId, setPlanCourseId] = useState('');
  const [planExamDate, setPlanExamDate] = useState('');
  const [planAvailableMinutes, setPlanAvailableMinutes] = useState('60');
  const [planStudyTime, setPlanStudyTime] = useState<'morning' | 'evening'>('evening');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const fetchAcademicData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, assignmentsRes, assessmentsRes, plansRes] = await Promise.all([
        api.get<{ success: boolean; courses: Course[] }>('/courses'),
        api.get<{ success: boolean; assignments: Assignment[] }>('/academics/assignments'),
        api.get<{ success: boolean; assessments: Assessment[] }>('/academics/assessments'),
        api.get<{ success: boolean; plans: StudyPlan[] }>('/study-plans')
      ]);

      if (coursesRes.success) setCourses(coursesRes.courses);
      if (assignmentsRes.success) setAssignments(assignmentsRes.assignments);
      if (assessmentsRes.success) setAssessments(assessmentsRes.assessments);
      if (plansRes.success) setStudyPlans(plansRes.plans);
    } catch (err) {
      console.error('Failed to load academic data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      setUploadError(null);

      const res = await api.upload<{
        success: boolean;
        message: string;
        documentId: string;
        preview: any;
      }>('/documents/upload', formData);

      if (res.success) {
        setIsUploadModalOpen(false);
        setPreviewDocId(res.documentId);
        setPreviewData(res.preview);
      }
    } catch (err: any) {
      setUploadError(err.message || 'File processing failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmExtraction = async () => {
    if (!previewDocId || !previewData) return;

    try {
      setIsConfirming(true);
      const res = await api.post<{ success: boolean; message: string }>(
        `/documents/${previewDocId}/confirm`,
        previewData
      );

      if (res.success) {
        alert(res.message);
        setPreviewDocId(null);
        setPreviewData(null);
        fetchAcademicData();
      }
    } catch (err: any) {
      alert(err.message || 'Confirmation failed');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleGenerateStudyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planCourseId || !planExamDate) return;

    try {
      setIsGeneratingPlan(true);
      const res = await api.post<{ success: boolean; message: string }>('/study-plans/generate', {
        courseId: planCourseId,
        examDate: planExamDate,
        dailyAvailableMinutes: parseInt(planAvailableMinutes, 10) || 60,
        preferredStudyTime: planStudyTime
      });

      if (res.success) {
        alert(res.message);
        setIsStudyPlanModalOpen(false);
        fetchAcademicData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate study plan');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-100">College Academics</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Syllabus analysis, course handouts, assignment tracker, and AI study planning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsStudyPlanModalOpen(true)}>
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Plan Study Schedule
          </Button>
          <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="w-3.5 h-3.5 mr-1" /> Upload Handout
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 w-fit text-xs">
        {(['courses', 'assignments', 'assessments', 'plans'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md capitalize font-medium transition-colors ${
              activeTab === tab ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab === 'plans' ? 'Study Plans' : tab}
          </button>
        ))}
      </div>

      {/* Tab: Courses */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              description="Upload your college course handout (PDF, DOCX, TXT) and NEXUS will extract units, assignments, and exam dates automatically."
              actionLabel="Upload Handout"
              onAction={() => setIsUploadModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <Card key={course._id} className="p-5 flex flex-col justify-between hover:border-zinc-700">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {course.code}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{course.credits} Credits</span>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-zinc-100">{course.name}</h3>
                      {course.instructor && (
                        <p className="text-xs text-zinc-400 mt-0.5">Prof. {course.instructor}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Units / Modules:</span>
                        <span className="font-mono text-zinc-200">{course.units?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Pending Assignments:</span>
                        <span className="font-mono text-amber-400">
                          {course.pendingAssignmentsCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setPlanCourseId(course._id);
                        setIsStudyPlanModalOpen(true);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Create Study Plan
                    </button>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {course.nextAssessment
                        ? `CAT: ${course.nextAssessment.daysRemaining}d`
                        : 'No exam'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Assignments */}
      {activeTab === 'assignments' && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 mb-4">
            Course Assignments & Deadlines
          </h2>
          {assignments.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">No assignments registered.</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((a) => (
                <div
                  key={a._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800/80 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-indigo-400 font-semibold">
                        {a.courseId?.code}
                      </span>
                      <p className="text-xs font-medium text-zinc-200 truncate">{a.title}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-zinc-500">
                      <span>Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>Weight: {a.weight}%</span>
                      <span>·</span>
                      <span>Est: {a.estimatedMinutes}m</span>
                    </div>
                  </div>

                  <Badge variant={a.status === 'completed' ? 'success' : 'warning'} size="sm">
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Assessments */}
      {activeTab === 'assessments' && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 mb-4">
            College Assessments & CAT Exams
          </h2>
          {assessments.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">No upcoming assessments scheduled.</p>
          ) : (
            <div className="space-y-2">
              {assessments.map((exam) => (
                <div
                  key={exam._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800/80 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-rose-400 font-bold uppercase">
                        [{exam.type}]
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        {exam.courseId?.code}
                      </span>
                      <p className="text-xs font-medium text-zinc-100 truncate">{exam.title}</p>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">
                      Date: {new Date(exam.date).toLocaleDateString()} · Weight: {exam.weight}%
                      {exam.syllabus && ` · Syllabus: ${exam.syllabus}`}
                    </p>
                  </div>

                  <Badge
                    variant={exam.preparationStatus === 'ready' ? 'success' : 'danger'}
                    size="sm"
                  >
                    {exam.preparationStatus}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Study Plans */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {studyPlans.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No study plans generated"
              description="Select a course and exam date to let AI generate a non-conflicting study plan that fits around your calendar."
              actionLabel="Generate Study Plan"
              onAction={() => setIsStudyPlanModalOpen(true)}
            />
          ) : (
            studyPlans.map((plan) => (
              <Card key={plan._id} className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Study Plan: {(plan as any).courseId?.name} ({(plan as any).courseId?.code})
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Exam Date: {new Date(plan.examDate).toLocaleDateString()} · Target: {plan.targetHours} hours
                    </p>
                  </div>
                  <Badge variant="primary">Active</Badge>
                </div>

                <div className="space-y-1.5">
                  {(plan.days || []).map((day: any) => (
                    <div
                      key={day.dayNumber}
                      className="flex items-center justify-between p-2.5 rounded bg-zinc-900/60 border border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-zinc-400 w-12">Day {day.dayNumber}</span>
                        <span className="font-mono text-indigo-400">Unit {day.unitNumber}</span>
                        <span className="text-zinc-200">{day.topicTitle}</span>
                      </div>
                      <span className="font-mono text-zinc-500">{day.durationMinutes}m</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Upload Handout Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Course Handout"
        description="Supported: PDF, DOCX, PPTX, TXT, Images. AI extracts units, assignments, and exam schedules."
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center bg-zinc-950/40">
            <input
              type="file"
              id="handout-file-input"
              className="hidden"
              accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <label
              htmlFor="handout-file-input"
              className="flex flex-col items-center cursor-pointer select-none"
            >
              <FileText className="w-8 h-8 text-zinc-500 mb-2" />
              <span className="text-xs font-medium text-zinc-200 mb-1">
                {isUploading ? 'Analyzing syllabus with AI...' : 'Click to select or drag document'}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                PDF, DOCX, PPTX, TXT up to 25MB
              </span>
            </label>
          </div>

          {uploadError && <p className="text-xs text-rose-400 text-center">{uploadError}</p>}
        </div>
      </Modal>

      {/* Confirmation Preview Modal (Section 9 Requirement: Preview -> Confirm -> Save) */}
      {previewData && (
        <Modal
          isOpen={Boolean(previewData)}
          onClose={() => setPreviewData(null)}
          title="Review AI Extracted Syllabus"
          description="Confirm or adjust details before adding to your academic database."
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Course Name"
                value={previewData.courseName || ''}
                onChange={(e) => setPreviewData({ ...previewData, courseName: e.target.value })}
              />
              <Input
                label="Course Code"
                value={previewData.courseCode || ''}
                onChange={(e) => setPreviewData({ ...previewData, courseCode: e.target.value })}
              />
            </div>

            {/* Units Preview */}
            <div className="space-y-1.5">
              <span className="font-semibold text-zinc-300 block">Extracted Units:</span>
              <div className="max-h-32 overflow-y-auto space-y-1 p-2 rounded bg-zinc-900 border border-zinc-800">
                {(previewData.units || []).map((u: any, idx: number) => (
                  <div key={idx} className="text-zinc-300 font-mono">
                    Unit {u.unitNumber}: {u.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Assignments Preview */}
            <div className="space-y-1.5">
              <span className="font-semibold text-zinc-300 block">Extracted Assignments:</span>
              <div className="max-h-28 overflow-y-auto space-y-1 p-2 rounded bg-zinc-900 border border-zinc-800">
                {(previewData.assignments || []).map((a: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-zinc-300 font-mono">
                    <span>{a.title}</span>
                    <span className="text-amber-400">Due: {a.dueDate || 'Estimated'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessments Preview */}
            <div className="space-y-1.5">
              <span className="font-semibold text-zinc-300 block">Extracted Exams / Assessments:</span>
              <div className="max-h-28 overflow-y-auto space-y-1 p-2 rounded bg-zinc-900 border border-zinc-800">
                {(previewData.assessments || []).map((exam: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-zinc-300 font-mono">
                    <span>{exam.title}</span>
                    <span className="text-rose-400">{exam.date || 'Estimated date'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewData(null)}
                disabled={isConfirming}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmExtraction} isLoading={isConfirming}>
                <Check className="w-3.5 h-3.5 mr-1" /> Confirm & Build Calendar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* AI Study Plan Generator Modal */}
      <Modal
        isOpen={isStudyPlanModalOpen}
        onClose={() => setIsStudyPlanModalOpen(false)}
        title="AI Study Plan Generator"
        description="Generates conflict-free daily study blocks based on your exam date and calendar."
      >
        <form onSubmit={handleGenerateStudyPlan} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Target Course</label>
            <select
              value={planCourseId}
              onChange={(e) => setPlanCourseId(e.target.value)}
              className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
              required
            >
              <option value="">Select course...</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            type="date"
            label="Exam Date"
            value={planExamDate}
            onChange={(e) => setPlanExamDate(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Daily Available Minutes"
              value={planAvailableMinutes}
              onChange={(e) => setPlanAvailableMinutes(e.target.value)}
              min={30}
              max={240}
            />

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Preferred Time</label>
              <select
                value={planStudyTime}
                onChange={(e) => setPlanStudyTime(e.target.value as any)}
                className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="evening">Evening (6:30 PM)</option>
                <option value="morning">Morning (8:30 AM)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsStudyPlanModalOpen(false)}
              disabled={isGeneratingPlan}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isGeneratingPlan}>
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Generate Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
