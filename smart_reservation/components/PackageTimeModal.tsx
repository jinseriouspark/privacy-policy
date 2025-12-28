import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, Save } from 'lucide-react';
import { TimeBlockSelector } from './TimeBlockSelector';
import { supabase } from '../lib/supabase/client';

interface PackageTimeModalProps {
  packageId: string;
  currentPackage: any;
  onClose: () => void;
  onSave: () => void;
}

export const PackageTimeModal: React.FC<PackageTimeModalProps> = ({
  packageId,
  currentPackage,
  onClose,
  onSave
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState<any>(null);
  const [coachingWorkingHours, setCoachingWorkingHours] = useState<any>(null);
  const [useCustomHours, setUseCustomHours] = useState(false);

  // 기본 working_hours 구조
  const defaultWorkingHours = {
    monday: { enabled: true, blocks: [{ start: '09:00', end: '18:00' }] },
    tuesday: { enabled: true, blocks: [{ start: '09:00', end: '18:00' }] },
    wednesday: { enabled: true, blocks: [{ start: '09:00', end: '18:00' }] },
    thursday: { enabled: true, blocks: [{ start: '09:00', end: '18:00' }] },
    friday: { enabled: true, blocks: [{ start: '09:00', end: '18:00' }] },
    saturday: { enabled: true, blocks: [{ start: '09:00', end: '18:00' }] },
    sunday: { enabled: false, blocks: [] }
  };

  useEffect(() => {
    // 모바일 감지
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadData();
  }, [packageId]);

  // 레거시 포맷 감지 및 정규화 헬퍼
  const normalizeWorkingHours = (hours: any) => {
    if (!hours || typeof hours !== 'object') {
      return defaultWorkingHours;
    }

    // 이미 정규화된 포맷인지 확인 (monday, tuesday 등의 키가 있는지)
    const hasNamedDays = 'monday' in hours || 'tuesday' in hours;

    // 레거시 숫자 키가 있는지 확인 (0, 1, 2, 3, 4, 5, 6)
    const hasNumericDays = Object.keys(hours).some(key => /^[0-6]$/.test(key));

    if (hasNumericDays) {
      console.warn('[PackageTimeModal] ⚠️ Legacy numeric format detected, converting...');

      // 숫자 키를 요일 이름으로 변환
      const dayMap: Record<string, string> = {
        '0': 'sunday', '1': 'monday', '2': 'tuesday', '3': 'wednesday',
        '4': 'thursday', '5': 'friday', '6': 'saturday'
      };

      const normalized: any = {};

      // 레거시 데이터 변환
      Object.entries(hours).forEach(([key, value]: [string, any]) => {
        const dayName = dayMap[key] || key; // 숫자면 변환, 아니면 그대로

        if (value && typeof value === 'object') {
          // isWorking/start/end 포맷을 enabled/blocks로 변환
          if ('isWorking' in value || 'start' in value) {
            normalized[dayName] = {
              enabled: value.isWorking ?? value.enabled ?? true,
              blocks: value.isWorking || value.enabled
                ? [{ start: value.start || '09:00', end: value.end || '18:00' }]
                : []
            };
          } else {
            // 이미 새 포맷
            normalized[dayName] = value;
          }
        }
      });

      // 누락된 요일 채우기
      Object.keys(defaultWorkingHours).forEach(day => {
        if (!normalized[day]) {
          normalized[day] = defaultWorkingHours[day];
        }
      });

      return normalized;
    }

    // 정규화된 포맷이지만 일부 요일이 누락된 경우
    if (hasNamedDays) {
      const complete = { ...defaultWorkingHours };
      Object.keys(defaultWorkingHours).forEach(day => {
        if (hours[day]) {
          complete[day] = hours[day];
        }
      });
      return complete;
    }

    // 알 수 없는 포맷
    return defaultWorkingHours;
  };

  const loadData = async () => {
    try {
      // 패키지의 현재 working_hours와 코칭의 working_hours 가져오기
      const { data: pkg, error: pkgError } = await supabase
        .from('packages')
        .select('working_hours, coaching:coaching_id(working_hours)')
        .eq('id', packageId)
        .single();

      if (pkgError) throw pkgError;

      console.log('[PackageTimeModal] Raw package data:', pkg);

      // 코칭 working_hours 정규화 및 저장
      const normalizedCoachingHours = normalizeWorkingHours(pkg.coaching?.working_hours);
      setCoachingWorkingHours(normalizedCoachingHours);

      // 패키지에 커스텀 시간이 있으면 사용 (정규화 후)
      if (pkg.working_hours) {
        const normalizedPackageHours = normalizeWorkingHours(pkg.working_hours);
        setWorkingHours(normalizedPackageHours);
        setUseCustomHours(true);
        console.log('[PackageTimeModal] ✅ Using normalized package hours:', normalizedPackageHours);
      } else {
        // 없으면 코칭 시간을 복사해서 시작
        setWorkingHours(normalizedCoachingHours);
        setUseCustomHours(false);
        console.log('[PackageTimeModal] ✅ Using normalized coaching hours:', normalizedCoachingHours);
      }
    } catch (error) {
      console.error('Failed to load package data:', error);
      setWorkingHours(defaultWorkingHours);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const dataToSave = useCustomHours ? workingHours : null;

      const { error } = await supabase
        .from('packages')
        .update({ working_hours: dataToSave })
        .eq('id', packageId);

      if (error) throw error;

      console.log('[PackageTimeModal] Saved:', { useCustomHours, workingHours: dataToSave });
      onSave();
    } catch (error) {
      console.error('Failed to save working hours:', error);
      alert('시간 설정 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCustomHours = (enabled: boolean) => {
    setUseCustomHours(enabled);
    if (!enabled) {
      // 코칭 시간으로 리셋
      setWorkingHours(coachingWorkingHours);
    }
  };

  if (!workingHours) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Clock size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">수강권별 시간 설정</h2>
                <p className="text-sm text-blue-100 mt-1">
                  {currentPackage?.name || '수강권'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-900 mb-1">시간 설정 우선순위</p>
                <p className="text-xs text-slate-600 mb-2">
                  • 기본: 코칭 시간 사용 (모든 수강권에 적용)
                </p>
                <p className="text-xs text-slate-600">
                  • 커스텀: 이 수강권만의 특별 시간 (VIP 주말반, 점심시간 전용 등)
                </p>
              </div>
            </div>
          </div>

          {/* Toggle Custom Hours */}
          <div className="flex items-center justify-between p-4 bg-white border-2 border-slate-200 rounded-xl">
            <div>
              <p className="font-bold text-slate-900">특별 시간 사용</p>
              <p className="text-xs text-slate-500 mt-1">
                {useCustomHours
                  ? '이 수강권만의 예약 가능 시간을 설정합니다'
                  : '코칭의 기본 시간을 사용합니다'}
              </p>
            </div>
            <button
              onClick={() => handleToggleCustomHours(!useCustomHours)}
              className={`w-14 h-8 rounded-full transition-all ${
                useCustomHours ? 'bg-blue-500' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  useCustomHours ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Time Block Selector */}
          {useCustomHours && (
            <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">예약 가능 시간 설정</h3>
              <p className="text-xs text-slate-600 mb-4">
                {isMobile
                  ? '요일을 선택하고 시간대를 탭하여 설정하세요 (30분 단위)'
                  : '드래그로 시간대를 선택하고, 더블클릭으로 요일을 활성화/비활성화하세요 (30분 단위)'}
              </p>
              <TimeBlockSelector
                workingHours={workingHours}
                onChange={setWorkingHours}
                isMobile={isMobile}
              />
            </div>
          )}

          {/* Preview of Current Settings */}
          {!useCustomHours && coachingWorkingHours && (
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">현재 적용 중인 시간 (코칭 기본값)</h3>
              <div className="space-y-2">
                {Object.entries(coachingWorkingHours).map(([day, hours]: [string, any]) => {
                  const dayLabels: Record<string, string> = {
                    monday: '월요일',
                    tuesday: '화요일',
                    wednesday: '수요일',
                    thursday: '목요일',
                    friday: '금요일',
                    saturday: '토요일',
                    sunday: '일요일'
                  };

                  if (!hours.enabled) return null;

                  const blocks = hours.blocks || [];
                  if (blocks.length === 0) return null;

                  return (
                    <div key={day} className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-700 w-16">{dayLabels[day]}</span>
                      <div className="flex flex-wrap gap-1">
                        {blocks.map((block: any, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs">
                            {block.start} - {block.end}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl font-bold transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={18} />
                  저장
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
