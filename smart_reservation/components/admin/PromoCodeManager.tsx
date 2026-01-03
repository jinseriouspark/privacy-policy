import React, { useState, useEffect } from 'react';
import { Gift, Mail, Copy, Check, Trash2, Download, Upload, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { generateUniquePromoCode } from '../../lib/email/resend';

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  plan_id: string;
  max_uses: number | null;
  current_uses: number;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

interface PromoCodeManagerProps {
  onBack: () => void;
}

const PromoCodeManager: React.FC<PromoCodeManagerProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'stats'>('create');
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 생성 폼
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('fixed_amount');
  const [discountValue, setDiscountValue] = useState('9000');
  const [description, setDescription] = useState('');
  const [maxUses, setMaxUses] = useState('1');
  const [validUntil, setValidUntil] = useState('2025-12-31');
  const [emailList, setEmailList] = useState('');

  // 통계
  const [stats, setStats] = useState({
    total: 0,
    used: 0,
    unused: 0,
    totalDiscount: 0
  });

  useEffect(() => {
    loadPromoCodes();
    loadStats();
  }, []);

  const loadPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Failed to load promo codes:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Total codes
      const { count: total } = await supabase
        .from('promo_codes')
        .select('*', { count: 'exact', head: true });

      // Used codes
      const { data: usageData } = await supabase
        .from('promo_code_usage')
        .select('promo_code_id');

      const uniqueUsed = new Set(usageData?.map(u => u.promo_code_id) || []).size;

      // Total discount amount
      const { data: usedCodes } = await supabase
        .from('promo_codes')
        .select('discount_value, current_uses')
        .gt('current_uses', 0);

      const totalDiscount = usedCodes?.reduce((sum, code) =>
        sum + (code.discount_value * code.current_uses), 0
      ) || 0;

      setStats({
        total: total || 0,
        used: uniqueUsed,
        unused: (total || 0) - uniqueUsed,
        totalDiscount
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const generateCode = async () => {
    setLoading(true);
    try {
      const code = generateUniquePromoCode('PROMO');
      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          code,
          description: description || '일반 프로모션 코드',
          discount_type: discountType,
          discount_value: parseInt(discountValue),
          plan_id: 'standard',
          max_uses: maxUses ? parseInt(maxUses) : null,
          valid_until: validUntil ? `${validUntil} 23:59:59+09` : null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // 이메일 화이트리스트 추가
      if (emailList.trim()) {
        const emails = emailList.split('\n').map(e => e.trim()).filter(e => e);

        for (const email of emails) {
          await supabase
            .from('promo_email_whitelist')
            .insert({
              email,
              promo_code_id: data.id,
              note: description || '프로모션 코드'
            });
        }
      }

      alert(`✅ 코드 생성 완료!\n\n${code}\n\n이 코드를 복사해서 이메일로 보내세요.`);

      // 폼 초기화
      setDescription('');
      setEmailList('');

      // 목록 새로고침
      loadPromoCodes();
      loadStats();

      // 목록 탭으로 이동
      setActiveTab('list');
    } catch (error: any) {
      console.error('Failed to generate code:', error);
      alert('코드 생성 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const deleteCode = async (id: string, code: string) => {
    if (!confirm(`"${code}" 코드를 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadPromoCodes();
      loadStats();
      alert('삭제되었습니다.');
    } catch (error: any) {
      alert('삭제 실패: ' + error.message);
    }
  };

  const exportCodes = () => {
    const csv = [
      ['코드', '설명', '할인 금액', '사용/최대', '생성일'].join(','),
      ...promoCodes.map(code => [
        code.code,
        code.description,
        code.discount_value,
        `${code.current_uses}/${code.max_uses || '무제한'}`,
        new Date(code.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promo-codes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2"
          >
            ← 뒤로가기
          </button>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Gift className="text-orange-500" size={32} />
            프로모션 코드 관리
          </h1>
          <p className="text-slate-600 mt-2">쿠폰 코드를 생성하고 이메일로 발송하세요</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-slate-200 flex">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'create'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus size={20} className="inline mr-2" />
              코드 생성
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'list'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              발급 내역 ({promoCodes.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              통계
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">새 프로모션 코드 생성</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    할인 타입
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="fixed_amount">고정 금액 (원)</option>
                    <option value="percentage">퍼센트 (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    할인 금액 {discountType === 'percentage' ? '(%)' : '(원)'}
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={discountType === 'percentage' ? '50' : '9000'}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    {discountType === 'fixed_amount'
                      ? `₩19,000 → ₩${19000 - parseInt(discountValue || '0')}`
                      : `₩19,000 → ₩${Math.round(19000 * (1 - parseInt(discountValue || '0') / 100))}`
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    설명 (메모)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="예: 마스터마인드 멤버 - 홍길동"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    최대 사용 횟수
                  </label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="1"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    비워두면 무제한
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    유효 기간
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    이메일 화이트리스트 (선택)
                  </label>
                  <textarea
                    value={emailList}
                    onChange={(e) => setEmailList(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-64"
                    placeholder="hong@example.com&#10;kim@example.com&#10;lee@example.com&#10;&#10;한 줄에 하나씩 입력하세요"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    이메일을 등록하면 해당 사용자 로그인 시 자동으로 쿠폰 안내
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-medium text-orange-900 mb-2">💡 사용 방법</h3>
                  <ol className="text-sm text-orange-800 space-y-1">
                    <li>1. 코드 생성 버튼 클릭</li>
                    <li>2. 생성된 코드 복사</li>
                    <li>3. Gmail (contact@traff-engine.com)로 발송</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={generateCode}
                disabled={loading}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? '생성 중...' : (
                  <>
                    <Gift size={20} />
                    코드 생성
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">발급 내역</h2>
              <button
                onClick={exportCodes}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
              >
                <Download size={16} />
                CSV 다운로드
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-700">코드</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">설명</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">할인</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">사용</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">유효기간</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">생성일</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((code) => (
                    <tr key={code.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                            {code.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {copiedCode === code.code ? (
                              <Check size={16} className="text-orange-500" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{code.description}</td>
                      <td className="py-3 px-4 text-sm">
                        {code.discount_type === 'fixed_amount'
                          ? `₩${code.discount_value.toLocaleString()}`
                          : `${code.discount_value}%`
                        }
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={code.current_uses > 0 ? 'text-orange-600 font-medium' : 'text-slate-400'}>
                          {code.current_uses}
                        </span>
                        <span className="text-slate-400">
                          /{code.max_uses || '∞'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {code.valid_until ? new Date(code.valid_until).toLocaleDateString() : '무제한'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(code.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => deleteCode(code.id, code.code)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">전체 코드</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
                </div>
                <Gift className="text-slate-300" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">사용됨</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.used}</p>
                </div>
                <Check className="text-green-300" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">미사용</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.unused}</p>
                </div>
                <Mail className="text-orange-300" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">총 할인액</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    ₩{stats.totalDiscount.toLocaleString()}
                  </p>
                </div>
                <Download className="text-slate-300" size={40} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoCodeManager;
