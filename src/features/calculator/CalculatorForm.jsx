import React from 'react';
import { useForm } from 'react-hook-form';
import { useStore } from '../../store/useStore';
import Card from '../../components/ui/Card';

const CalculatorForm = () => {
  const { user, setUser, goal, setGoal } = useStore();
  const { register, handleSubmit } = useForm({
    defaultValues: { ...user }
  });

  const onSubmit = (data) => {
    setUser({
      ...data,
      age: parseInt(data.age),
      weight: parseFloat(data.weight),
      height: parseFloat(data.height),
    });
  };

  return (
    <Card title="Chỉ số cơ tạng">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Tuổi</label>
            <input type="number" {...register('age')} />
          </div>
          <div>
            <label>Giới tính</label>
            <select {...register('gender')}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Cân nặng (kg)</label>
            <input type="number" step="0.1" {...register('weight')} />
          </div>
          <div>
            <label>Chiều cao (cm)</label>
            <input type="number" {...register('height')} />
          </div>
        </div>

        <div>
          <label>Cường độ vận động</label>
          <select {...register('activityLevel')}>
            <option value="sedentary">Ít vận động (Văn phòng, ít tập)</option>
            <option value="light">Nhẹ (Tập 1-3 buổi/tuần)</option>
            <option value="moderate">Vừa (Tập 3-5 buổi/tuần)</option>
            <option value="active">Nặng (Tập 6-7 buổi/tuần)</option>
            <option value="athlete">Rất nặng (Vận động viên, lao động nặng)</option>
          </select>
        </div>

        <button type="submit" className="glow-btn w-full mt-2">Cập nhật chỉ số</button>
      </form>

      <div className="mt-8">
        <label className="mb-4 block">Mục tiêu hiện tại</label>
        <div className="grid grid-cols-3 gap-2">
          {['maintain', 'cutting', 'bulking'].map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={`p-2 rounded-lg border text-sm transition-all ${
                goal === g 
                ? 'border-secondary text-secondary bg-secondary/10' 
                : 'border-white/10 text-dim hover:border-white/30'
              }`}
            >
              {g === 'maintain' ? 'Duy trì' : g === 'cutting' ? 'Giảm mỡ' : 'Tăng cơ'}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default CalculatorForm;
