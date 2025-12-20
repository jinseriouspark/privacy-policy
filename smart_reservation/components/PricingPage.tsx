import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

interface PricingPageProps {
  onSelectPlan: (plan: 'free' | 'standard' | 'teams' | 'enterprise') => void;
  onClose: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan, onClose }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const plans = [
    {
      id: 'free',
      name: '무료',
      price: 0,
      yearlyPrice: 0,
      description: '개인 사용자를 위한 기본 예약 기능',
      features: [
        { name: '1:1 예약', included: true, limit: '월 10회' },
        { name: '그룹 수업', included: false },
        { name: '수강권 관리', included: false },
        { name: '출석 체크', included: false },
        { name: '통계 대시보드', included: false },
        { name: '이메일 알림', included: true },
        { name: 'Google 캘린더 동기화', included: true },
        { name: '광고 제거', included: false },
      ],
      buttonText: '무료로 시작',
      popular: false
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 5000,
      yearlyPrice: 50000,
      description: '개인 강사를 위한 필수 기능',
      features: [
        { name: '1:1 예약', included: true, limit: '무제한' },
        { name: '그룹 수업', included: true },
        { name: '수강권 관리', included: true },
        { name: '출석 체크', included: true },
        { name: '통계 대시보드', included: true },
        { name: '이메일 알림', included: true },
        { name: 'Google 캘린더 동기화', included: true },
        { name: '광고 제거', included: true },
      ],
      buttonText: 'Standard 선택',
      popular: false
    },
    {
      id: 'teams',
      name: 'Teams',
      price: 8000,
      yearlyPrice: 80000,
      description: '팀 협업을 위한 고급 기능',
      features: [
        { name: '1:1 예약', included: true, limit: '무제한' },
        { name: '그룹 수업', included: true },
        { name: '수강권 관리', included: true },
        { name: '출석 체크', included: true },
        { name: '통계 대시보드', included: true },
        { name: '이메일 알림', included: true },
        { name: 'Google 캘린더 동기화', included: true },
        { name: '광고 제거', included: true },
        { name: '멀티 강사 관리', included: true },
        { name: '고급 리포팅', included: true },
        { name: 'SMS 알림', included: true },
      ],
      buttonText: 'Teams 선택',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: null,
      yearlyPrice: null,
      description: '대규모 스튜디오를 위한 맞춤 솔루션',
      features: [
        { name: '모든 Teams 기능', included: true },
        { name: '무제한 강사', included: true },
        { name: '전용 계정 관리자', included: true },
        { name: '우선 지원', included: true },
        { name: 'API 접근', included: true },
        { name: '커스텀 도메인', included: true },
        { name: 'SSO (Single Sign-On)', included: true },
        { name: '맞춤 계약', included: true },
      ],
      buttonText: '영업팀 문의',
      popular: false
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.price === null) return null;
    return billingCycle === 'yearly' ? plan.yearlyPrice : plan.price;
  };

  const getPriceLabel = (plan: typeof plans[0]) => {
    if (plan.price === null) return '';
    return billingCycle === 'yearly' ? '/년' : '/월';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-2">
            나에게 맞는 플랜 선택
          </h2>
          <p className="text-slate-600 text-center">
            모든 플랜 50% 할인 적용 중 🎉
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="p-6 flex justify-center">
          <div className="inline-flex items-center bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              연간 결제 (20% 할인)
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              월간 결제
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const discountedPrice = price !== null ? Math.floor(price * 0.5) : null;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-6 flex flex-col ${
                  plan.popular
                    ? 'border-orange-400 shadow-xl relative'
                    : 'border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-400 text-white text-xs font-bold px-4 py-1 rounded-full">
                    인기
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="mb-3">
                    {price !== null ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-slate-400 line-through text-lg">
                            ₩{(price || 0).toLocaleString()}
                          </span>
                          <span className="text-3xl font-bold text-slate-900">
                            ₩{(discountedPrice || 0).toLocaleString()}
                          </span>
                        </div>
                        <span className="text-slate-500 text-sm">{getPriceLabel(plan)}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-slate-900">맞춤 견적</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{plan.description}</p>
                </div>

                {/* Features */}
                <div className="flex-1 space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X size={16} className="text-slate-300 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-slate-700' : 'text-slate-400'}`}>
                        {feature.name}
                        {feature.limit && (
                          <span className="text-slate-500"> ({feature.limit})</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan(plan.id as any)}
                  className={`w-full py-3 rounded-full font-semibold transition-all ${
                    plan.popular
                      ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="p-6 border-t border-slate-200">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">기능 비교</h3>
            <p className="text-slate-600">모든 플랜의 상세 기능을 확인하세요</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">핵심 기능</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">무료</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Standard</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900 bg-orange-50">Teams</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-slate-700">1:1 예약</td>
                  <td className="text-center py-3 px-4 text-slate-500">월 10회</td>
                  <td className="text-center py-3 px-4"><Check size={16} className="inline text-orange-500" /></td>
                  <td className="text-center py-3 px-4 bg-orange-50"><Check size={16} className="inline text-orange-500" /></td>
                  <td className="text-center py-3 px-4"><Check size={16} className="inline text-orange-500" /></td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-slate-700">그룹 수업</td>
                  <td className="text-center py-3 px-4"><X size={16} className="inline text-slate-300" /></td>
                  <td className="text-center py-3 px-4"><Check size={16} className="inline text-orange-500" /></td>
                  <td className="text-center py-3 px-4 bg-orange-50"><Check size={16} className="inline text-orange-500" /></td>
                  <td className="text-center py-3 px-4"><Check size={16} className="inline text-orange-500" /></td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-slate-700">수강권 관리</td>
                  <td className="text-center py-3 px-4"><X size={16} className="inline text-slate-300" /></td>
                  <td className="text-center py-3 px-4"><Check size={16} className="inline text-orange-500" /></td>
                  <td className="text-center py-3 px-4 bg-orange-50"><Check size={16} className="inline text-orange-500" /></td>
                  <td className="text-center py-3 px-4"><Check size={16} className="inline text-orange-500" /></td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-slate-700">멀티 강사</td>
                  <td className="text-center py-3 px-4"><X size={16} className="inline text-slate-300" /></td>
                  <td className="text-center py-3 px-4"><X size={16} className="inline text-slate-300" /></td>
                  <td className="text-center py-3 px-4 bg-orange-50"><Check size={16} className="inline text-orange-500" /></td>
                  <td className="text-center py-3 px-4 text-slate-700">무제한</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
