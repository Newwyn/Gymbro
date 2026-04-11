import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacros } from '../utils/formulas';
import { translations } from '../utils/translations';

export const useStore = create(
  persist(
    (set, get) => ({
      // Navigation
      screen: 'landing', // 'landing' | 'input' | 'dashboard'

      // User Data
      user: {
        age: '',
        gender: 'male',
        weight: '',
        height: '',
        activityLevel: 'moderate',
      },
      goal: 'maintain',
      targetWeightChange: '', // kg
      weeksToGoal: '', // weeks

      language: 'vi', // 'en' | 'vi'
      
      // Tracking
      caloriesEaten: 0,
      macrosEaten: { protein: 0, carb: 0, fat: 0 },
      foodLogs: [], // { id, name, calories, macros }
      lastLogDate: new Date().toDateString(),
      history: [], // { date, eaten, target }
      weightHistory: [],

      // Navigation Actions
      goTo: (screen) => set({ screen }),

      // Data Actions
      setUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),
      setGoal: (goal) => set({ goal }),
      setLanguage: (language) => set({ language }),

      t: (key) => {
        const { language } = get();
        return translations[language][key] || key;
      },

      addFood: (name, calories, macros = {}) => {
        const today = new Date().toDateString();
        const { lastLogDate, checkDateReset } = get();
        
        checkDateReset();

        const newLog = {
          id: Date.now(),
          name,
          calories: Number(calories),
          macros: {
            protein: macros.protein || 0,
            carb: macros.carb || 0,
            fat: macros.fat || 0,
          }
        };

        set((state) => ({
          foodLogs: [newLog, ...state.foodLogs],
          caloriesEaten: state.caloriesEaten + newLog.calories,
          macrosEaten: {
            protein: state.macrosEaten.protein + newLog.macros.protein,
            carb: state.macrosEaten.carb + newLog.macros.carb,
            fat: state.macrosEaten.fat + newLog.macros.fat,
          },
          lastLogDate: today,
        }));
      },

      deleteFoodEntry: (id) => set((state) => {
        const entry = state.foodLogs.find(f => f.id === id);
        if (!entry) return state;
        return {
          foodLogs: state.foodLogs.filter(f => f.id !== id),
          caloriesEaten: state.caloriesEaten - entry.calories,
          macrosEaten: {
            protein: state.macrosEaten.protein - entry.macros.protein,
            carb: state.macrosEaten.carb - entry.macros.carb,
            fat: state.macrosEaten.fat - entry.macros.fat,
          }
        };
      }),

      checkDateReset: () => {
        const today = new Date().toDateString();
        const { lastLogDate, caloriesEaten, getCalculations } = get();

        if (lastLogDate !== today) {
          const { targetCalories } = getCalculations();
          // Save to history before resetting
          set((state) => ({
            history: [
              { date: lastLogDate, eaten: caloriesEaten, target: targetCalories },
              ...state.history.slice(0, 6) // Keep last 7 days
            ],
            foodLogs: [], 
            caloriesEaten: 0,
            macrosEaten: { protein: 0, carb: 0, fat: 0 },
            lastLogDate: today,
          }));
        }
      },

      resetDay: () => set({ 
        foodLogs: [],
        caloriesEaten: 0, 
        macrosEaten: { protein: 0, carb: 0, fat: 0 }, 
        lastLogDate: new Date().toDateString() 
      }),

      deleteWeightEntry: (date) => set((state) => ({
        weightHistory: state.weightHistory.filter(w => w.date !== date)
      })),

      addWeightEntry: (weight) => set((state) => ({
        weightHistory: [
          ...state.weightHistory.slice(-29),
          { date: new Date().toISOString().split('T')[0], weight }
        ]
      })),

      resetAll: () => set({
        screen: 'landing',
        user: { age: '', gender: 'male', weight: '', height: '', activityLevel: 'moderate' },
        goal: 'maintain',
        targetWeightChange: '',
        weeksToGoal: '',
        caloriesEaten: 0,
        macrosEaten: { protein: 0, carb: 0, fat: 0 },
        foodLogs: [],
        history: [],
        weightHistory: [],
      }),

      // Computed
      getCalculations: () => {
        const { user, goal } = get();
        const age = Number(user.age);
        const weight = Number(user.weight);
        const height = Number(user.height);

        if (!age || !weight || !height) {
          return { bmr: 0, tdee: 0, targetCalories: 0, targetMacros: { protein: 0, carb: 0, fat: 0 } };
        }

        const bmr = calculateBMR(age, user.gender, weight, height);
        const tdee = calculateTDEE(bmr, user.activityLevel);

        const kgGoal = Number(get().targetWeightChange) || 0;
        const weeks = Number(get().weeksToGoal) || 1;

        const rawTarget = calculateTargetCalories(bmr, tdee, goal, kgGoal, weeks);
        
        // Calculate adjustment for status feedback
        const dailyAdjustment = Math.abs(rawTarget - tdee);
        let goalStatus = 'safe';
        if (goal !== 'maintain') {
          if (dailyAdjustment > 1000) goalStatus = 'dangerous';
          else if (dailyAdjustment > 700) goalStatus = 'aggressive';
        }

        const targetCalories = Math.round(rawTarget);
        const targetMacros = calculateMacros(weight, targetCalories);

        return {
          bmr: Math.round(bmr),
          tdee: Math.round(tdee),
          targetCalories,
          targetMacros,
          dailyAdjustment: Math.round(dailyAdjustment),
          goalStatus,
          kgPerWeek: (kgGoal / weeks).toFixed(2),
        };
      }
    }),
    { 
      name: 'gymbro-storage',
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => key !== 'screen')
      ),
    }
  )
);
