import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ArrowRight, Check } from 'lucide-react';

const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const { user, setUser, goal, setGoal, completeOnboarding } = useStore();

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else completeOnboarding();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else useStore.getState().resetProfile();
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-up">
            <h2 className="text-3xl font-bold tracking-tight">Chào bạn! Đầu tiên, hãy cho mình biết về bạn.</h2>
            <div className="space-y-4">
              <div>
                <label>Tuổi của bạn</label>
                <input 
                  type="number" 
                  value={user.age} 
                  onChange={(e) => setUser({ age: e.target.value })}
                  className="text-2xl font-bold py-4"
                  placeholder="0"
                />
              </div>
              <div>
                <label>Giới tính</label>
                <div className="grid grid-cols-2 gap-4">
                  {['male', 'female'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setUser({ gender: g })}
                      className={`p-4 rounded-2xl border transition-all ${
                        user.gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-white/5 text-dim'
                      }`}
                    >
                      {g === 'male' ? 'Nam' : 'Nữ'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-up">
            <h2 className="text-3xl font-bold tracking-tight">Chỉ số cơ thể hiện tại của bạn?</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Cân nặng (kg)</label>
                <input 
                  type="number" 
                  value={user.weight} 
                  onChange={(e) => setUser({ weight: Number(e.target.value) })}
                  className="text-2xl font-bold py-4"
                  placeholder="0"
                />
              </div>
              <div>
                <label>Chiều cao (cm)</label>
                <input 
                  type="number" 
                  value={user.height} 
                  onChange={(e) => setUser({ height: Number(e.target.value) })}
                  className="text-2xl font-bold py-4"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-up">
            <h2 className="text-3xl font-bold tracking-tight">Bạn vận động như thế nào?</h2>
            <div className="space-y-3">
              {[
                { id: 'sedentary', label: 'Ít vận động', desc: 'Làm việc văn phòng, ít tập' },
                { id: 'light', label: 'Nhẹ nhàng', desc: 'Tập 1-3 buổi/tuần' },
                { id: 'moderate', label: 'Vừa phải', desc: 'Tập 3-5 buổi/tuần' },
                { id: 'active', label: 'Năng động', desc: 'Tập 6-7 buổi/tuần' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setUser({ activityLevel: item.id })}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    user.activityLevel === item.id ? 'border-primary bg-primary/10' : 'border-white/5 bg-white/5'
                  }`}
                >
                  <div className={`font-bold ${user.activityLevel === item.id ? 'text-primary' : ''}`}>{item.label}</div>
                  <div className="text-xs text-dim">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-up">
            <h2 className="text-3xl font-bold tracking-tight">Mục tiêu cuối cùng của bạn?</h2>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'maintain', label: 'Duy trì vóc dáng', desc: 'Giữ cân nặng hiện tại' },
                { id: 'cutting', label: 'Giảm mỡ', desc: 'Siết cân, lộ cơ' },
                { id: 'bulking', label: 'Tăng cơ', desc: 'Tăng cân, to người' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setGoal(item.id)}
                  className={`p-6 rounded-2xl border text-left transition-all ${
                    goal === item.id ? 'border-secondary bg-secondary/10' : 'border-white/5 bg-white/5'
                  }`}
                >
                  <div className={`text-xl font-bold ${goal === item.id ? 'text-secondary' : ''}`}>{item.label}</div>
                  <div className="text-sm text-dim">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-xl w-full">
        <div className="step-indicator">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`step-dot ${s <= step ? 'active' : ''}`} />
          ))}
        </div>
        
        <div className="glass-card p-10 min-h-[500px] flex flex-col justify-between">
          <div>
            {renderStep()}
          </div>
          
          <div className="flex gap-4 mt-10">
            <button 
              onClick={handleBack}
              className="glow-btn bg-white/5 text-white hover:bg-white/10 flex-1"
            >
              Quay lại
            </button>
            <button 
              onClick={handleNext}
              disabled={step === 1 && !user.age || step === 2 && (!user.weight || !user.height)}
              className={`glow-btn flex-[2] flex items-center justify-center gap-2 ${
                step === 4 ? 'glow-btn-secondary' : ''
              } disabled:opacity-20 disabled:cursor-not-allowed`}
            >
              {step === 4 ? 'Xem kết quả' : 'Tiếp theo'}
              {step === 4 ? <Check size={20} /> : <ArrowRight size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
