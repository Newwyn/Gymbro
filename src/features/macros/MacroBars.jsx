import React from 'react';

const MacroProgressBar = ({ label, current, target, color }) => {
  const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-dim">{label}</span>
        <span>{Math.round(current)}g / {target}g</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const MacroBars = ({ eaten, target }) => {
  return (
    <div className="space-y-4">
      <MacroProgressBar 
        label="Protein" 
        current={eaten.protein} 
        target={target.protein} 
        color="bg-blue-400" 
      />
      <MacroProgressBar 
        label="Carbs" 
        current={eaten.carb} 
        target={target.carb} 
        color="bg-green-400" 
      />
      <MacroProgressBar 
        label="Fats" 
        current={eaten.fat} 
        target={target.fat} 
        color="bg-yellow-400" 
      />
    </div>
  );
};

export default MacroBars;
