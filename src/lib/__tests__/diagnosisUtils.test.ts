import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadDiagnosisReport } from '../diagnosisUtils';
import jsPDF from 'jspdf';

vi.mock('jspdf', () => {
  const MockPDF = vi.fn().mockImplementation(function() {
    return {
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 }, getNumberOfPages: () => 1 },
      setFillColor: vi.fn(),
      rect: vi.fn(),
      setTextColor: vi.fn(),
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      splitTextToSize: vi.fn().mockReturnValue(['line 1', 'line 2']),
      addPage: vi.fn(),
      save: vi.fn(),
      setPage: vi.fn(),
    };
  });
  return {
    default: MockPDF,
    jsPDF: MockPDF
  };
});

vi.mock('jspdf-autotable', () => {
  return {
    default: vi.fn().mockImplementation((doc) => {
      doc.lastAutoTable = { finalY: 100 };
    }),
  };
});

describe('diagnosisUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockReport = {
    cropType: 'Tomato',
    diseaseName: 'Late Blight',
    scientificName: 'Phytophthora infestans',
    confidence: 0.95,
    status: 'Infected',
    description: 'A serious disease for tomatoes',
    symptoms: ['Brown spots', 'Wilt'],
    recommendations: 'Use fungicide',
    treatmentSteps: [{ title: 'Step 1', desc: 'Prune' }],
    environmentalContext: [{ label: 'Humidity', value: '80%', status: 'High' }]
  };

  it('should generate a PDF report', () => {
    downloadDiagnosisReport(mockReport);
    expect(jsPDF).toHaveBeenCalled();
  });

  it('should handle supabase record format', () => {
    const supabaseRecord = {
      report_data: mockReport,
      crop_type: 'Tomato'
    };
    downloadDiagnosisReport(supabaseRecord);
    expect(jsPDF).toHaveBeenCalled();
  });

  it('should return safely if report is null', () => {
    expect(downloadDiagnosisReport(null)).toBeUndefined();
  });
});
