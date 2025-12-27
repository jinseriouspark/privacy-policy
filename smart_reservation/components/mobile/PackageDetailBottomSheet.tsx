import React from 'react';
import { Drawer } from 'vaul';
import { Calendar, Clock, CreditCard, X } from 'lucide-react';

interface Package {
  id: string;
  name?: string;
  total_sessions: number;
  remaining_sessions: number;
  start_date: string;
  expires_at: string;
  status: string;
  created_at: string;
  package_template?: {
    name: string;
    type: string;
  };
  coaching?: {
    title: string;
  };
  instructor?: {
    id: number;
    name: string;
    email: string;
  };
}

interface PackageDetailBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  packages: Package[];
}

export const PackageDetailBottomSheet: React.FC<PackageDetailBottomSheetProps> = ({
  isOpen,
  onClose,
  packages
}) => {
  const getDaysRemaining = (validUntil: string) => {
    const today = new Date();
    const endDate = new Date(validUntil);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-3xl h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50">
          <div className="p-4 bg-white rounded-t-3xl flex-1 overflow-auto">
            {/* Handle bar */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 mb-6" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Drawer.Title className="text-xl font-bold text-slate-900">
                내 수강권 상세
              </Drawer.Title>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Package List */}
            <div className="space-y-4">
              {packages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">보유 중인 수강권이 없습니다</p>
                </div>
              ) : (
                packages.map((pkg) => {
                  const daysRemaining = getDaysRemaining(pkg.expires_at);
                  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
                  const isExpired = daysRemaining <= 0;
                  const creditsTotal = pkg.total_sessions || 0;
                  const creditsRemaining = pkg.remaining_sessions || 0;
                  const usagePercentage = creditsTotal > 0
                    ? ((creditsTotal - creditsRemaining) / creditsTotal * 100)
                    : 0;

                  return (
                    <div
                      key={pkg.id}
                      className={`border-2 rounded-2xl p-5 ${
                        isExpired
                          ? 'border-slate-200 bg-slate-50'
                          : isExpiringSoon
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-orange-300 bg-gradient-to-br from-orange-50 to-white'
                      }`}
                    >
                      {/* Package Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 mb-1">
                            {pkg.name || pkg.coaching?.title || '수강권'}
                          </h3>
                          {pkg.instructor && (
                            <div className="text-sm text-slate-600 space-y-0.5">
                              <p>강사: {pkg.instructor.name}</p>
                              <p className="text-xs text-slate-500">{pkg.instructor.email}</p>
                              <p className="text-xs text-slate-500">ID: {pkg.instructor.id}</p>
                            </div>
                          )}
                        </div>
                        {isExpired ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                            만료됨
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                            곧 만료
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            사용 가능
                          </span>
                        )}
                      </div>

                      {/* Credits Info */}
                      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CreditCard size={20} className="text-orange-600" />
                            <span className="text-sm font-medium text-slate-700">
                              잔여 횟수
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-orange-600">
                              {creditsRemaining}
                            </span>
                            <span className="text-slate-500 text-sm ml-1">
                              / {creditsTotal}회
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-full transition-all duration-300"
                            style={{ width: `${usagePercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-right">
                          {Math.round(usagePercentage)}% 사용
                        </p>
                      </div>

                      {/* Validity Period */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-slate-100">
                          <Calendar size={18} className="text-slate-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 mb-1">사용 기간</p>
                            <p className="text-sm font-medium text-slate-900">
                              {formatDate(pkg.start_date)} ~ {formatDate(pkg.expires_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Warning for expiring packages */}
                      {isExpiringSoon && !isExpired && (
                        <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-xl">
                          <p className="text-xs text-orange-900 font-medium">
                            💡 수강권이 {daysRemaining}일 후 만료됩니다. 빠른 예약을 권장합니다!
                          </p>
                        </div>
                      )}

                      {/* Creation Date */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500">
                          구매일: {formatDate(pkg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
