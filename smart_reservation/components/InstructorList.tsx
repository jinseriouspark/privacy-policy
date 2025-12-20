import React, { useEffect, useState } from 'react';
import { Instructor } from '../types';
import { postToGAS } from '../services/api';
import { ArrowLeft, User as UserIcon, Loader2 } from 'lucide-react';

interface InstructorListProps {
  onSelect: (instructor: Instructor) => void;
  onBack: () => void;
}

const InstructorList: React.FC<InstructorListProps> = ({ onSelect, onBack }) => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const data = await postToGAS<Instructor[]>({ action: 'getInstructors' });
        setInstructors(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInstructors();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-900">코치 선택</h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 mb-2" />
          <p className="text-slate-400">코치 목록을 불러오는 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {instructors.map((inst) => (
            <button
              key={inst.id}
              onClick={() => onSelect(inst)}
              className="flex items-center p-4 bg-white border border-slate-200 rounded-2xl hover:border-orange-400 hover:shadow-md transition-all text-left group"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden mr-4 group-hover:border-orange-200">
                {inst.avatarUrl ? (
                  <img src={inst.avatarUrl} alt={inst.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="text-slate-400" size={32} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-500 transition-colors">
                  {inst.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{inst.bio}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorList;
