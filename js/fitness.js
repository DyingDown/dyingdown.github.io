// 健身打卡系统
class FitnessTracker {
    constructor() {
        // 当前选择的日期 (默认为今天)
        this.selectedDate = new Date();
        
        // 云端同步配置
        this.cloudSync = {
            enabled: false, // 是否启用云端同步
            userId: '', // 用户唯一标识
            lastSyncTime: 0
        };
        
        // 个人基本信息
        this.userInfo = {
            weight: 54, // 108斤 = 54公斤
            height: 159, // cm 取中间值
            age: 25,
            gender: 'female' // 女性
        };
        
        // 目标热量缺口（卡路里）
        this.targetCalorieDeficit = 450;
        
        // 活动量系数
        this.activityLevels = {
            'sedentary': { name: '久坐不动', factor: 1.2, description: '办公室工作，很少运动' },
            'lightly': { name: '轻度活动', factor: 1.375, description: '轻度运动，每周1-3次' },
            'moderately': { name: '中度活动', factor: 1.55, description: '中度运动，每周3-5次' },
            'very': { name: '高强度活动', factor: 1.725, description: '高强度运动，每周6-7次' },
            'extremely': { name: '极高强度', factor: 1.9, description: '体力工作+高强度训练' }
        };
        
        this.weeklyPlan = {
            '周一': {
                type: '推力 + 哑铃 + 腹肌 (重度)',
                exercises: [
                    { name: '胸推机', sets: '5×8', weight: '40 lbs', duration: 12, calories: 50 },
                    { name: '上斜推机', sets: '4×10', weight: '10 lbs', duration: 10, calories: 40 },
                    { name: '蝴蝶机夹胸', sets: '4×12', weight: '10-20 lbs', duration: 10, calories: 30 },
                    { name: 'Dip辅助机', sets: '4×8', weight: '辅助45 lbs', duration: 8, calories: 40 },
                    { name: '帕梅拉硬核课', sets: '1套', weight: '10 lbs', duration: 10, calories: 45 },
                    { name: '帕梅拉腹肌课 (重度)', sets: '1套', weight: '自重', duration: 10, calories: 60 }
                ],
                totalTime: 62,
                totalCalories: 265, // 运动消耗
                targetWater: 3.0
            },
            '周二': {
                type: '推力 + 腹肌 (轻度)',
                exercises: [
                    { name: '爬楼机', sets: '-', weight: '速度9', duration: 30, calories: 150 },
                    { name: '跑步机', sets: '-', weight: '2 miles', duration: 30, calories: 150 },
                    { name: '帕梅拉腹肌课 (轻度)', sets: '1套', weight: '自重', duration: 10, calories: 40 }
                ],
                totalTime: 70,
                totalCalories: 340,
                targetWater: 3.0
            },
            '周三': {
                type: '有氧 + 腹肌 (轻度)',
                exercises: [
                    { name: '引体向上辅助', sets: '4×8', weight: '辅助45 lbs', duration: 8, calories: 50 },
                    { name: '坐姿划船', sets: '4×10', weight: '35 lbs', duration: 10, calories: 45 },
                    { name: '后肩飞鸟', sets: '3×12', weight: '10 lbs', duration: 10, calories: 30 },
                    { name: '二头弯举', sets: '3×12', weight: '10 lbs', duration: 10, calories: 30 },
                    { name: '帕梅拉腹肌课 (重度)', sets: '1套', weight: '自重', duration: 10, calories: 60 }
                ],
                totalTime: 50,
                totalCalories: 215,
                targetWater: 3.0
            },
            '周四': {
                type: '拉力 + 腹肌 (重度)',
                exercises: [
                    { name: '爬楼机', sets: '-', weight: '速度8-9', duration: 30, calories: 150 },
                    { name: '跑步机', sets: '-', weight: '2 miles', duration: 30, calories: 150 },
                    { name: '帕梅拉腹肌课 (轻度)', sets: '1套', weight: '自重', duration: 10, calories: 40 }
                ],
                totalTime: 70,
                totalCalories: 340,
                targetWater: 3.0
            },
            '周五': {
                type: '推+拉综合 + 哑铃 + 腹肌 (重度)',
                exercises: [
                    { name: '胸推机', sets: '4×8', weight: '45 lbs', duration: 10, calories: 45 },
                    { name: '坐姿划船', sets: '4×10', weight: '35 lbs', duration: 10, calories: 45 },
                    { name: 'Dip辅助', sets: '4×8', weight: '40 lbs', duration: 10, calories: 40 },
                    { name: '引体向上辅助', sets: '3×6', weight: '40 lbs', duration: 8, calories: 40 },
                    { name: '帕梅拉硬核课', sets: '1套', weight: '10 lbs', duration: 10, calories: 45 },
                    { name: '帕梅拉腹肌课 (重度)', sets: '1套', weight: '自重', duration: 10, calories: 60 }
                ],
                totalTime: 58,
                totalCalories: 275,
                targetWater: 3.2
            },
            '周六': {
                type: '有氧 + 腹肌 (轻度)',
                exercises: [
                    { name: '爬楼机', sets: '-', weight: '速度9', duration: 30, calories: 150 },
                    { name: '跑步机', sets: '-', weight: '2 miles', duration: 30, calories: 150 },
                    { name: '帕梅拉腹肌课 (轻度)', sets: '1套', weight: '自重', duration: 10, calories: 40 }
                ],
                totalTime: 70,
                totalCalories: 340,
                targetWater: 3.0
            },
            '周日': {
                type: '恢复 + 轻活动',
                exercises: [
                    { name: '拉伸+泡脚+轻走', sets: '-', weight: '-', duration: 40, calories: 120 }
                ],
                totalTime: 40,
                totalCalories: 120,
                targetWater: 2.8
            }
        };
        
        this.init();
    }

    // 计算基础代谢率 BMR (使用 Mifflin-St Jeor 公式)
    calculateBMR() {
        const { weight, height, age, gender } = this.userInfo;
        if (gender === 'female') {
            return (10 * weight) + (6.25 * height) - (5 * age) - 161;
        } else {
            return (10 * weight) + (6.25 * height) - (5 * age) + 5;
        }
    }

    // 计算每日总消耗 TDEE
    calculateTDEE(activityLevel = 'moderately') {
        const bmr = this.calculateBMR();
        const activityFactor = this.activityLevels[activityLevel]?.factor || 1.55;
        return Math.round(bmr * activityFactor);
    }

    // 获取今日活动水平
    getTodayActivityLevel() {
        const dateStr = this.getDateString();
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        const todayData = data[dateStr] || {};
        return todayData.activityLevel || 'moderately';
    }

    // 保存今日活动水平
    saveTodayActivityLevel(level) {
        const dateStr = this.getDateString();
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        
        if (!data[dateStr]) {
            data[dateStr] = { exercises: {}, nutrition: {} };
        }
        
        data[dateStr].activityLevel = level;
        // 使用新的同步保存方法
        this.saveDataWithSync('fitness-data', data);
        this.updateExerciseCaloriesDisplay();
        this.updateDailyConsumption();
        this.generateHeatmap(); // 更新热力图
    }

    // 更新基础消耗显示
    updateDailyConsumption() {
        const activityLevel = this.getTodayActivityLevel();
        const bmr = this.calculateBMR();
        const activityFactor = this.activityLevels[activityLevel]?.factor || 1.55;
        const dailyConsumption = Math.round(bmr * activityFactor);
        
        const consumptionElement = document.getElementById('daily-consumption');
        if (consumptionElement) {
            consumptionElement.textContent = `${dailyConsumption} kcal`;
        }
        
        // 更新营养摄入区域的目标摄入显示
        this.updateTargetIntakeDisplay(dailyConsumption);
    }

    // 更新目标摄入显示
    updateTargetIntakeDisplay(dailyConsumption) {
        // 计算实际完成的运动消耗
        const today = this.getTodayWeekday();
        const plan = this.weeklyPlan[today];
        if (!plan) return;

        const dateStr = this.getDateString();
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        const todayData = data[dateStr] || {};
        
        let actualExerciseCalories = 0;
        if (todayData.exercises) {
            Object.keys(todayData.exercises).forEach(index => {
                if (todayData.exercises[index] === true && plan.exercises[index]) {
                    actualExerciseCalories += plan.exercises[index].calories;
                }
            });
        }
        
        // 总消耗 = 基础消耗 + 实际运动消耗
        const totalBurned = dailyConsumption + actualExerciseCalories;
        
        // 目标摄入 = 总消耗 - 目标缺口
        const targetIntake = totalBurned - this.targetCalorieDeficit;
        
        // 更新卡路里输入框的placeholder
        const caloriesInput = document.getElementById('calories-input');
        if (caloriesInput) {
            caloriesInput.placeholder = `目标摄入: ${Math.max(0, targetIntake)} kcal`;
        }
    }

    init() {
        // 首先初始化云端同步
        this.initCloudSync();
        
        this.updateTodayDisplay();
        this.loadTodayPlan();
        this.loadTodayData();
        this.initEventListeners();
        this.initTabs();
        this.generateHeatmap();
        this.updateStatistics();
    }
    
    // 刷新页面数据（日期改变时调用）
    refreshPageData() {
        this.updateTodayDisplay();
        this.loadTodayPlan();
        this.loadTodayData();
        this.generateHeatmap();
        this.updateStatistics();
    }

    // 更新日期显示
    updateTodayDisplay() {
        const weekday = this.getTodayWeekday();
        const dateStr = this.selectedDate.toLocaleDateString('zh-CN');
        const isToday = this.getRawDateString(this.selectedDate) === this.getRawDateString(new Date());
        
        const titleElement = document.getElementById('today-title');
        const dateElement = document.getElementById('today-date');
        const datePicker = document.getElementById('date-picker');
        
        if (titleElement) {
            titleElement.textContent = `${isToday ? '今日' : '选择日期'}训练 - ${weekday}`;
        }
        
        if (dateElement) {
            dateElement.textContent = dateStr;
        }
        
        // 设置日期选择器的值
        if (datePicker) {
            datePicker.value = this.getDateString();
        }
    }

    // 获取选择日期是周几
    getTodayWeekday() {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return days[this.selectedDate.getDay()];
    }

    // 获取日期字符串格式（本地时间）
    getDateString(date = this.selectedDate) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // 获取原始日期字符串（用于热力图等不受日期选择影响的功能）
    getRawDateString(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 加载今日训练计划
    loadTodayPlan() {
        const today = this.getTodayWeekday();
        const plan = this.weeklyPlan[today];
        
        if (!plan) return;

        // 添加活动水平选择器和基础消耗显示
        const planHeader = document.querySelector('.plan-header');
        const existingSelector = planHeader.querySelector('.activity-selector');
        if (!existingSelector) {
            const activityContainer = document.createElement('div');
            activityContainer.className = 'activity-container';
            activityContainer.innerHTML = `
                <div class="activity-selector">
                    <label for="activity-level">今日活动水平:</label>
                    <select id="activity-level">
                        ${Object.entries(this.activityLevels).map(([key, value]) => 
                            `<option value="${key}">${value.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="daily-consumption">
                    <div class="consumption-item">
                        <span class="label">基础消耗:</span>
                        <span class="value" id="daily-consumption">0 kcal</span>
                    </div>
                </div>
            `;
            planHeader.appendChild(activityContainer);
            
            // 设置当前值并添加事件监听
            const select = document.getElementById('activity-level');
            select.value = this.getTodayActivityLevel();
            select.addEventListener('change', (e) => {
                this.saveTodayActivityLevel(e.target.value);
                this.updateDailyConsumption(); // 更新基础消耗显示
                this.updateNutritionDisplay(); // 实时更新热量缺口显示
            });
            
            // 初始化基础消耗显示
            this.updateDailyConsumption();
        }
        
        const exerciseList = document.getElementById('exercise-list');
        exerciseList.innerHTML = '';

        plan.exercises.forEach((exercise, index) => {
            const exerciseItem = document.createElement('div');
            exerciseItem.className = 'exercise-item';
            exerciseItem.innerHTML = `
                <div class="exercise-info">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-details">
                        <span class="sets">${exercise.sets}</span>
                        <span class="weight">${exercise.weight}</span>
                        <span class="duration">${exercise.duration}min</span>
                        <span class="calories">${exercise.calories}kcal</span>
                    </div>
                </div>
                <div class="exercise-controls">
                    <button class="check-btn" data-exercise="${index}" ${this.isExerciseCompleted(index) ? 'data-completed="true"' : ''}>
                        <i class="fas fa-${this.isExerciseCompleted(index) ? 'check-circle' : 'circle'}"></i>
                        ${this.isExerciseCompleted(index) ? '已完成' : '完成'}
                    </button>
                </div>
            `;
            exerciseList.appendChild(exerciseItem);
        });

        this.updateExerciseCaloriesDisplay();
    }

    // 检查运动项目是否已完成
    isExerciseCompleted(exerciseIndex) {
        const dateStr = this.getDateString();
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        const todayData = data[dateStr] || {};
        return todayData.exercises && todayData.exercises[exerciseIndex];
    }

    // 保存运动完成状态
    saveExerciseCompletion(exerciseIndex, completed) {
        const dateStr = this.getDateString();
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        
        if (!data[dateStr]) {
            data[dateStr] = { exercises: {}, nutrition: {} };
        }
        
        if (!data[dateStr].exercises) {
            data[dateStr].exercises = {};
        }
        
        if (completed) {
            data[dateStr].exercises[exerciseIndex] = true;
        } else {
            delete data[dateStr].exercises[exerciseIndex];
        }
        
        // 使用新的同步保存方法
        this.saveDataWithSync('fitness-data', data);
        this.updateExerciseCaloriesDisplay();
        this.updateStatistics();
        this.generateHeatmap(); // 更新热力图
    }

    // 更新实际运动消耗显示
    updateExerciseCaloriesDisplay() {
        const today = this.getTodayWeekday();
        const plan = this.weeklyPlan[today];
        if (!plan) return;

        // 计算实际完成的运动消耗
        let actualExerciseCalories = 0;
        const dateStr = this.getDateString();
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        const todayData = data[dateStr] || {};

        if (todayData.exercises) {
            Object.keys(todayData.exercises).forEach(index => {
                // 只计算已打卡完成的运动
                if (todayData.exercises[index] === true && plan.exercises[index]) {
                    actualExerciseCalories += plan.exercises[index].calories;
                }
            });
        }

        // 更新实际运动消耗显示
        const actualExerciseElement = document.getElementById('actual-exercise-calories');
        if (actualExerciseElement) {
            actualExerciseElement.textContent = actualExerciseCalories + ' kcal';
        }
        
        // 更新目标摄入显示  
        const bmr = this.calculateBMR();
        const activityLevel = this.getTodayActivityLevel();
        const activityFactor = this.activityLevels[activityLevel]?.factor || 1.55;
        const dailyConsumption = Math.round(bmr * activityFactor);
        this.updateTargetIntakeDisplay(dailyConsumption);
        
        // 实时更新热量缺口显示
        this.updateNutritionDisplay();
    }

    // 加载今日营养数据
    loadTodayData() {
        const dateStr = this.getDateString();
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        const todayData = data[dateStr] || {};

        if (todayData.nutrition) {
            const nutrition = todayData.nutrition;
            const caloriesInput = document.getElementById('calories-input');
            const waterInput = document.getElementById('water-input');
            const proteinCheck = document.getElementById('protein-powder-check');
            
            if (caloriesInput) caloriesInput.value = nutrition.calories || '';
            if (waterInput) waterInput.value = nutrition.water || 2.0; // 默认最低值2L
            if (proteinCheck) proteinCheck.checked = nutrition.proteinPowder || false;
            
            this.updateNutritionDisplay();
        } else {
            // 设置默认值
            const waterInput = document.getElementById('water-input');
            if (waterInput) waterInput.value = 2.0;
        }
    }

    // 保存营养数据
    saveNutritionData() {
        const dateStr = this.getDateString();
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        
        if (!data[dateStr]) {
            data[dateStr] = { exercises: {}, nutrition: {} };
        }

        const calories = parseFloat(document.getElementById('calories-input').value) || 0;
        const water = parseFloat(document.getElementById('water-input').value) || 2.0;
        const proteinPowder = document.getElementById('protein-powder-check')?.checked || false;

        data[dateStr].nutrition = { calories, water, proteinPowder };
        
        // 使用新的同步保存方法
        this.saveDataWithSync('fitness-data', data);
        this.updateNutritionDisplay();
        this.updateStatistics();
        this.generateHeatmap(); // 更新热力图
    }

    // 更新营养显示
    updateNutritionDisplay() {
        const today = this.getTodayWeekday();
        const plan = this.weeklyPlan[today];
        if (!plan) return;

        const caloriesInput = document.getElementById('calories-input');
        const waterInput = document.getElementById('water-input');
        const proteinCheck = document.getElementById('protein-powder-check');
        
        const calories = parseFloat(caloriesInput?.value) || 0;
        const water = parseFloat(waterInput?.value) || 2.0;
        const proteinPowder = proteinCheck?.checked || false;

        // 计算实际完成的运动消耗
        const dateStr = this.getDateString();
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        const todayData = data[dateStr] || {};
        
        let actualExerciseCalories = 0;
        if (todayData.exercises) {
            Object.keys(todayData.exercises).forEach(index => {
                // 只计算已完成（打卡）的运动
                if (todayData.exercises[index] === true && plan.exercises[index]) {
                    actualExerciseCalories += plan.exercises[index].calories;
                }
            });
        }

        // 基础代谢（不考虑活动水平，只是基础BMR）
        const bmr = this.calculateBMR();
        
        // 总消耗 = 基础代谢 + 实际完成的运动消耗
        const totalBurned = bmr + actualExerciseCalories;
        
        // 热量缺口 = 总消耗 - 摄入
        // 如果没有摄入数据，缺口为0
        const calorieGap = calories > 0 ? totalBurned - calories : 0;
        
        // 更新显示
        const gapElement = document.getElementById('calorie-gap');
        const proteinStatusElement = document.getElementById('protein-status');
        const waterStatusElement = document.getElementById('water-status');
        
        if (gapElement) {
            gapElement.textContent = `${calorieGap}/${this.targetCalorieDeficit} kcal`;
            gapElement.className = `value ${calorieGap >= this.targetCalorieDeficit ? 'positive' : 
                                              calorieGap > 0 ? 'neutral' : 'negative'}`;
        }
        
        if (proteinStatusElement) {
            proteinStatusElement.textContent = proteinPowder ? '已喝 ✓' : '未喝';
            proteinStatusElement.className = `value ${proteinPowder ? 'positive' : 'negative'}`;
        }
        
        if (waterStatusElement) {
            waterStatusElement.textContent = water + 'L';
            waterStatusElement.className = `value ${water >= 2.5 ? 'positive' : 'neutral'}`;
        }
    }

    // 初始化事件监听
    initEventListeners() {
        // 日期选择器
        const datePicker = document.getElementById('date-picker');
        if (datePicker) {
            datePicker.addEventListener('change', (e) => {
                // 修复时区问题：使用本地时间而不是 UTC
                const dateValue = e.target.value; // "YYYY-MM-DD"
                const [year, month, day] = dateValue.split('-').map(Number);
                this.selectedDate = new Date(year, month - 1, day); // 月份需要减1
                this.refreshPageData();
            });
        }
        
        // 回到今天按钮
        const todayBtn = document.getElementById('today-btn');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.selectedDate = new Date();
                this.refreshPageData();
            });
        }
        
        // 运动完成按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('.check-btn')) {
                const btn = e.target.closest('.check-btn');
                const exerciseIndex = btn.dataset.exercise;
                const isCompleted = btn.dataset.completed === 'true';
                
                this.saveExerciseCompletion(exerciseIndex, !isCompleted);
                
                // 更新按钮状态
                btn.dataset.completed = !isCompleted;
                const icon = btn.querySelector('i');
                icon.className = `fas fa-${!isCompleted ? 'check-circle' : 'circle'}`;
                btn.innerHTML = `<i class="${icon.className}"></i> ${!isCompleted ? '已完成' : '完成'}`;
                
                // 实时更新热量缺口显示
                this.updateNutritionDisplay();
            }
        });

        // 保存营养数据按钮
        document.querySelector('.save-nutrition-btn').addEventListener('click', () => {
            this.saveNutritionData();
        });

        // 营养输入实时更新
        let nutritionUpdateTimeout;
        ['calories-input', 'water-input'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    this.updateNutritionDisplay();
                    // 延迟更新热力图，避免频繁更新
                    clearTimeout(nutritionUpdateTimeout);
                    nutritionUpdateTimeout = setTimeout(() => {
                        // 只有当有卡路里数据时才更新热力图
                        const calories = parseFloat(document.getElementById('calories-input')?.value) || 0;
                        if (calories > 0) {
                            this.saveNutritionData();
                        }
                    }, 1000); // 1秒后更新
                });
            }
        });
        
        // 蛋白粉复选框
        const proteinCheck = document.getElementById('protein-powder-check');
        if (proteinCheck) {
            proteinCheck.addEventListener('change', () => {
                this.updateNutritionDisplay();
                // 蛋白粉状态改变时立即保存并更新热力图
                setTimeout(() => {
                    this.saveNutritionData();
                }, 100);
            });
        }
    }

    // 初始化选项卡
    initTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        const panels = document.querySelectorAll('.tab-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`${targetTab}-panel`).classList.add('active');
                
                if (targetTab === 'nutrition') {
                    this.generateNutritionChart();
                }
            });
        });
    }

    // 生成热力图
    generateHeatmap() {
        const heatmapGrid = document.getElementById('heatmap-grid');
        heatmapGrid.innerHTML = '';
        
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        const currentDate = new Date();
        const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
        
        // 创建一年的日期网格
        for (let week = 0; week < 53; week++) {
            const weekElement = document.createElement('div');
            weekElement.className = 'heatmap-week';
            
            for (let day = 0; day < 7; day++) {
                const date = new Date(oneYearAgo);
                date.setDate(date.getDate() + (week * 7) + day);
                
                if (date > currentDate) continue;
                
                const dayElement = document.createElement('div');
                dayElement.className = 'heatmap-day';
                
                const dateStr = this.getRawDateString(date);
                const dayData = data[dateStr];
                
                let level = 0;
                let calorieGap = 0;
                
                if (dayData && dayData.nutrition && dayData.nutrition.calories > 0) {
                    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
                    const plan = this.weeklyPlan[weekday];
                    
                    if (plan) {
                        // 计算当天实际完成的运动消耗
                        let actualExerciseCalories = 0;
                        if (dayData.exercises) {
                            Object.keys(dayData.exercises).forEach(index => {
                                // 只计算已打卡完成的运动
                                if (dayData.exercises[index] === true && plan.exercises[index]) {
                                    actualExerciseCalories += plan.exercises[index].calories;
                                }
                            });
                        }
                        
                        // 基础代谢
                        const bmr = this.calculateBMR();
                        
                        // 总消耗 = 基础代谢 + 实际运动消耗
                        const totalBurned = bmr + actualExerciseCalories;
                        
                        // 计算热量缺口
                        calorieGap = totalBurned - dayData.nutrition.calories;
                        
                        // 根据热量缺口设置等级 (0-200: 1级, 200-400: 2级, 400-600: 3级, 600+: 4级)
                        if (calorieGap > 0) {
                            level = Math.min(4, Math.floor(calorieGap / 200) + 1);
                        }
                    }
                }
                
                dayElement.className = `heatmap-day level-${level}`;
                dayElement.title = `${date.toLocaleDateString()} - 热量缺口: ${calorieGap}kcal`;
                
                weekElement.appendChild(dayElement);
            }
            
            heatmapGrid.appendChild(weekElement);
        }
    }

    // 更新统计数据
    updateStatistics() {
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        
        // 总训练天数
        const totalDays = Object.keys(data).filter(date => {
            return data[date].exercises && Object.keys(data[date].exercises).length > 0;
        }).length;
        
        // 本周完成率
        const weekCompletion = this.calculateWeekCompletion();
        
        // 连续打卡天数
        const streakDays = this.calculateStreakDays();
        
        // 平均消耗卡路里
        const avgCalories = this.calculateAverageCalories();
        
        document.getElementById('total-days').textContent = totalDays;
        document.getElementById('week-completion').textContent = weekCompletion + '%';
        document.getElementById('streak-days').textContent = streakDays + '天';
        document.getElementById('avg-calories').textContent = avgCalories + ' kcal';

        // 营养趋势
        this.updateNutritionTrends();
    }

    // 计算本周完成率
    calculateWeekCompletion() {
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        
        let totalExercises = 0;
        let completedExercises = 0;
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            
            const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
            const plan = this.weeklyPlan[weekday];
            
            if (plan) {
                totalExercises += plan.exercises.length;
                
                const dateStr = this.getRawDateString(date);
                const dayData = data[dateStr];
                
                if (dayData && dayData.exercises) {
                    completedExercises += Object.values(dayData.exercises).filter(Boolean).length;
                }
            }
        }
        
        return totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;
    }

    // 计算连续打卡天数
    calculateStreakDays() {
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        const today = new Date();
        let streak = 0;
        
        for (let i = 0; i >= -365; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            
            const dateStr = this.getRawDateString(date);
            const dayData = data[dateStr];
            
            const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
            const plan = this.weeklyPlan[weekday];
            
            if (plan && dayData && dayData.exercises) {
                const completedCount = Object.values(dayData.exercises).filter(Boolean).length;
                if (completedCount > 0) {
                    streak++;
                } else {
                    break;
                }
            } else if (plan) {
                break;
            }
        }
        
        return streak;
    }

    // 计算平均消耗卡路里
    calculateAverageCalories() {
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        let totalCalories = 0;
        let daysWithData = 0;
        
        Object.keys(data).forEach(dateStr => {
            const dayData = data[dateStr];
            if (dayData && dayData.exercises) {
                const date = new Date(dateStr);
                const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
                const plan = this.weeklyPlan[weekday];
                
                if (plan) {
                    let dayCalories = 0;
                    Object.keys(dayData.exercises).forEach(index => {
                        if (dayData.exercises[index] && plan.exercises[index]) {
                            dayCalories += plan.exercises[index].calories;
                        }
                    });
                    
                    if (dayCalories > 0) {
                        totalCalories += dayCalories;
                        daysWithData++;
                    }
                }
            }
        });
        
        return daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0;
    }

    // 更新营养趋势
    updateNutritionTrends() {
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        const last30Days = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last30Days.push(this.getDateString(date));
        }
        
        let totalCalorieGap = 0;
        let totalWater = 0;
        let proteinDays = 0;
        let daysWithNutrition = 0;
        
        last30Days.forEach(dateStr => {
            const dayData = data[dateStr];
            if (dayData && dayData.nutrition && dayData.nutrition.calories > 0) {
                const date = new Date(dateStr);
                const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
                const plan = this.weeklyPlan[weekday];
                
                if (plan) {
                    // 计算实际完成的运动消耗
                    let actualExerciseCalories = 0;
                    if (dayData.exercises) {
                        Object.keys(dayData.exercises).forEach(index => {
                            // 只计算已打卡完成的运动
                            if (dayData.exercises[index] === true && plan.exercises[index]) {
                                actualExerciseCalories += plan.exercises[index].calories;
                            }
                        });
                    }
                    
                    // 基础代谢
                    const bmr = this.calculateBMR();
                    
                    // 总消耗 = 基础代谢 + 实际运动消耗
                    const totalBurned = bmr + actualExerciseCalories;
                    
                    const calorieGap = totalBurned - dayData.nutrition.calories;
                    totalCalorieGap += calorieGap;
                    totalWater += dayData.nutrition.water || 0;
                    
                    if (dayData.nutrition.proteinPowder) {
                        proteinDays++;
                    }
                    
                    daysWithNutrition++;
                }
            }
        });
        
        const avgCalorieGap = daysWithNutrition > 0 ? Math.round(totalCalorieGap / daysWithNutrition) : 0;
        const proteinRate = daysWithNutrition > 0 ? Math.round((proteinDays / daysWithNutrition) * 100) : 0;
        const avgWater = daysWithNutrition > 0 ? (totalWater / daysWithNutrition).toFixed(1) : 0;
        
        const avgGapElement = document.getElementById('avg-calorie-gap');
        const avgProteinElement = document.getElementById('avg-protein');
        const avgWaterElement = document.getElementById('avg-water');
        
        if (avgGapElement) avgGapElement.textContent = avgCalorieGap + ' kcal';
        if (avgProteinElement) avgProteinElement.textContent = proteinRate + '%';
        if (avgWaterElement) avgWaterElement.textContent = avgWater + 'L';
    }

    // 生成营养图表
    generateNutritionChart() {
        // 这里可以使用 Chart.js 等图表库来生成更复杂的图表
        // 由于是静态博客，我们使用简单的 Canvas 绘制
        const canvas = document.getElementById('nutrition-chart');
        const ctx = canvas.getContext('2d');
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 简单的营养趋势线图示例
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        const last7Days = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(this.getDateString(date));
        }
        
        let points = [];
        last7Days.forEach((dateStr, index) => {
            const dayData = data[dateStr];
            let calorieGap = 0;
            
            if (dayData && dayData.nutrition && dayData.nutrition.calories > 0) {
                const date = new Date(dateStr);
                const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
                const plan = this.weeklyPlan[weekday];
                
                if (plan) {
                    // 计算实际完成的运动消耗
                    let actualExerciseCalories = 0;
                    if (dayData.exercises) {
                        Object.keys(dayData.exercises).forEach(exIndex => {
                            // 只计算已打卡完成的运动
                            if (dayData.exercises[exIndex] === true && plan.exercises[exIndex]) {
                                actualExerciseCalories += plan.exercises[exIndex].calories;
                            }
                        });
                    }
                    
                    // 基础代谢 + 实际运动消耗
                    const bmr = this.calculateBMR();
                    const totalBurned = bmr + actualExerciseCalories;
                    
                    calorieGap = totalBurned - dayData.nutrition.calories;
                }
            }
            
            const x = (index / 6) * (canvas.width - 40) + 20;
            const y = canvas.height - ((calorieGap + 500) / 1000 * (canvas.height - 40)) - 20;
            points.push({ x, y });
        });
        
        if (points.length > 1) {
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
            
            // 绘制数据点
            points.forEach(point => {
                ctx.beginPath();
                ctx.fillStyle = '#007bff';
                ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // 添加标题
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('近7天卡路里缺口趋势', canvas.width / 2, 20);
    }

    // ==================== 云端同步功能 ====================
    
    // 初始化云端同步（LeanCloud）
    initCloudSync() {
        // 检查是否有 LeanCloud 配置
        if (typeof AV !== 'undefined' && window.LEANCLOUD_CONFIG) {
            try {
                // 使用和 Valine 相同的配置
                AV.init(window.LEANCLOUD_CONFIG);
                this.cloudSync.enabled = true;
                
                // 生成用户唯一标识（基于浏览器指纹）
                this.cloudSync.userId = this.generateUserId();
                
                console.log('云端同步已启用');
                this.updateSyncStatus('syncing');
                this.syncFromCloud();
            } catch (error) {
                console.warn('云端同步初始化失败:', error);
                this.cloudSync.enabled = false;
                this.updateSyncStatus('offline');
            }
        } else {
            console.log('未检测到 LeanCloud 配置，使用本地存储');
            this.updateSyncStatus('offline');
        }
    }
    
    // 更新同步状态指示器
    updateSyncStatus(status) {
        const syncStatusElement = document.getElementById('sync-status');
        if (!syncStatusElement) return;
        
        // 清除所有状态类
        syncStatusElement.className = 'sync-status';
        
        switch (status) {
            case 'syncing':
                syncStatusElement.classList.add('syncing');
                syncStatusElement.innerHTML = '<i class="fas fa-sync-alt" title="正在同步..."></i>';
                break;
            case 'synced':
                syncStatusElement.classList.add('synced');
                syncStatusElement.innerHTML = '<i class="fas fa-cloud-upload-alt" title="已同步到云端"></i>';
                break;
            case 'offline':
                syncStatusElement.classList.add('offline');
                syncStatusElement.innerHTML = '<i class="fas fa-cloud-exclamation" title="仅本地存储"></i>';
                break;
            default:
                syncStatusElement.innerHTML = '<i class="fas fa-cloud" title="数据同步状态"></i>';
        }
    }
    
    // 生成用户唯一标识
    generateUserId() {
        // 尝试从多个来源生成唯一标识
        let userId = localStorage.getItem('fitness-user-id');
        
        if (!userId) {
            // 基于浏览器特征生成简单的唯一标识
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Fitness Tracker', 2, 2);
            
            const fingerprint = canvas.toDataURL().slice(-50) + 
                               navigator.userAgent.slice(-20) + 
                               screen.width + screen.height + 
                               new Date().getTimezoneOffset();
            
            userId = 'user_' + btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
            localStorage.setItem('fitness-user-id', userId);
        }
        
        return userId;
    }
    
    // 从云端同步数据
    async syncFromCloud() {
        if (!this.cloudSync.enabled) return;
        
        try {
            const FitnessData = AV.Object.extend('FitnessData');
            const query = new AV.Query(FitnessData);
            query.equalTo('userId', this.cloudSync.userId);
            query.descending('updatedAt');
            query.limit(1);
            
            const results = await query.find();
            
            if (results.length > 0) {
                const cloudData = results[0].get('data');
                const cloudTimestamp = results[0].updatedAt.getTime();
                
                // 比较本地和云端的时间戳
                const localTimestamp = parseInt(localStorage.getItem('fitness-last-update') || '0');
                
                if (cloudTimestamp > localTimestamp) {
                    // 云端数据更新，覆盖本地数据
                    localStorage.setItem('fitness-data', JSON.stringify(cloudData));
                    localStorage.setItem('fitness-last-update', cloudTimestamp.toString());
                    console.log('已从云端同步数据');
                    this.updateSyncStatus('synced');
                    
                    // 刷新页面显示
                    this.refreshPageData();
                } else if (localTimestamp > cloudTimestamp) {
                    // 本地数据更新，上传到云端
                    this.syncToCloud();
                }
            } else {
                // 云端没有数据，上传本地数据
                const localData = localStorage.getItem('fitness-data');
                if (localData && localData !== '{}') {
                    this.syncToCloud();
                }
            }
        } catch (error) {
            console.warn('从云端同步数据失败:', error);
        }
    }
    
    // 上传数据到云端
    async syncToCloud() {
        if (!this.cloudSync.enabled) return;
        
        try {
            const localData = JSON.parse(localStorage.getItem('fitness-data') || '{}');
            
            const FitnessData = AV.Object.extend('FitnessData');
            const query = new AV.Query(FitnessData);
            query.equalTo('userId', this.cloudSync.userId);
            
            const results = await query.find();
            let fitnessData;
            
            if (results.length > 0) {
                // 更新现有记录
                fitnessData = results[0];
            } else {
                // 创建新记录
                fitnessData = new FitnessData();
                fitnessData.set('userId', this.cloudSync.userId);
            }
            
            fitnessData.set('data', localData);
            await fitnessData.save();
            
            // 更新本地同步时间戳
            localStorage.setItem('fitness-last-update', Date.now().toString());
            
            console.log('数据已上传到云端');
            this.updateSyncStatus('synced');
        } catch (error) {
            console.warn('上传数据到云端失败:', error);
        }
    }
    
    // 修改原有的保存方法，添加云端同步
    saveDataWithSync(key, data) {
        // 先保存到本地
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem('fitness-last-update', Date.now().toString());
        
        // 延迟上传到云端（避免频繁请求）
        clearTimeout(this.syncTimeout);
        if (this.cloudSync.enabled) {
            this.updateSyncStatus('syncing');
            this.syncTimeout = setTimeout(() => {
                this.syncToCloud();
            }, 2000); // 2秒后上传
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 先初始化 LeanCloud 配置（如果存在）
    if (typeof window.LEANCLOUD_CONFIG === 'undefined') {
        // 可以在这里配置你的 LeanCloud 信息
        // window.LEANCLOUD_CONFIG = {
        //     appId: 'your-app-id',
        //     appKey: 'your-app-key',
        //     serverURL: 'your-server-url'
        // };
    }
    
    new FitnessTracker();
});