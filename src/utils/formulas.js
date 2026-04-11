/**
 * Mifflin-St Jeor BMR Calculation
 * Male: BMR = 10 * weight + 6.25 * height - 5 * age + 5
 * Female: BMR = 10 * weight + 6.25 * height - 5 * age - 161
 */
export const calculateBMR = (age, gender, weight, height) => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
};

/**
 * TDEE Calculation based on activity level
 */
export const calculateTDEE = (bmr, activityLevel) => {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  };
  return bmr * (multipliers[activityLevel] || 1.2);
};

/**
 * Dynamic Goal Adjustment
 * Logic: 1kg ≈ 7700 kcal
 * Formula: Daily Adjustment = (kg * 7700) / (weeks * 7)
 */
export const calculateTargetCalories = (bmr, tdee, goal, kgGoal = 0, weeks = 0) => {
  if (goal === 'maintain') return tdee;
  
  // Safe defaults to avoid division by zero or invalid logic
  const validKg = Math.max(0, Number(kgGoal));
  const validWeeks = Math.max(1, Number(weeks));
  
  const dailyAdjustment = (validKg * 7700) / (validWeeks * 7);
  
  let target;
  if (goal === 'cutting') {
    target = tdee - dailyAdjustment;
    // Safety check: Don't go below BMR
    return Math.max(bmr, target);
  } else if (goal === 'bulking') {
    return tdee + dailyAdjustment;
  }
  
  return tdee;
};

/**
 * Macro Breakdown
 * Protein: 2g / kg
 * Fat: 0.8g / kg
 * Carb: remaining
 */
export const calculateMacros = (weight, targetCalories) => {
  const proteinGrams = weight * 2;
  const fatGrams = weight * 0.8;
  
  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;
  
  const remainingCalories = targetCalories - (proteinCalories + fatCalories);
  const carbGrams = Math.max(0, remainingCalories / 4);

  return {
    protein: Math.round(proteinGrams),
    fat: Math.round(fatGrams),
    carb: Math.round(carbGrams),
    calories: {
      protein: Math.round(proteinCalories),
      fat: Math.round(fatCalories),
      carb: Math.round(carbGrams * 4),
    }
  };
};
