// 健身打卡系统
(function() {
    // 防止重复声明
    if (typeof window.FitnessTracker !== 'undefined') {
        console.warn('⚠️ FitnessTracker 已存在，跳过重新声明');
        return;
    }

class FitnessTracker {
    constructor() {
        // 当前选择的日期 (默认为今天)
        this.selectedDate = new Date();
        
        // 云端同步配置
        this.cloudSync = {
            enabled: false, // 是否启用云端同步
            username: '', // 用户名
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
        
        // 训练计划存储（支持多套计划和版本管理）
        this.trainingPlans = {};  // 存储所有训练计划
        this.currentPlanId = null; // 当前使用的计划ID
        
        // 活动量系数
        this.activityLevels = {
            'sedentary': { name: '久坐不动', factor: 1.2, description: '办公室工作，很少运动' },
            'lightly': { name: '轻度活动', factor: 1.375, description: '轻度运动，每周1-3次' },
            'moderately': { name: '中度活动', factor: 1.55, description: '中度运动，每周3-5次' },
            'very': { name: '高强度活动', factor: 1.725, description: '高强度运动，每周6-7次' },
            'extremely': { name: '极高强度', factor: 1.9, description: '体力工作+高强度训练' }
        };
        
        // 初始化默认训练计划（兼容旧数据）
        this.initDefaultPlan();
        
        this.init();
    }
    
    // ==================== 训练计划管理 ====================
    
    // 初始化默认训练计划
    initDefaultPlan() {
        // 检查是否已有计划数据
        const savedPlans = this.loadTrainingPlans();
        
        if (Object.keys(savedPlans).length === 0) {
            // 创建默认计划（使用之前的硬编码数据）
            const defaultPlan = this.createDefaultTrainingPlan();
            this.saveTrainingPlan(defaultPlan);
            this.currentPlanId = defaultPlan.id;
            this.saveCurrentPlanId();
        } else {
            // 加载现有计划
            this.trainingPlans = savedPlans;
            this.currentPlanId = this.loadCurrentPlanId();
        }
    }
    
    // 创建默认训练计划
    createDefaultTrainingPlan() {
        return {
            id: this.generatePlanId(),
            name: '默认健身计划',
            description: '适合初中级训练者的全身训练计划',
            startDate: this.getDateString(new Date()),
            isActive: true,
            createdAt: new Date().toISOString(),
            weeklySchedule: {
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
                    targetWater: 3.0
                },
                '周二': {
                    type: '推力 + 腹肌 (轻度)',
                    exercises: [
                        { name: '爬楼机', sets: '-', weight: '速度9', duration: 30, calories: 150 },
                        { name: '跑步机', sets: '-', weight: '2 miles', duration: 30, calories: 150 },
                        { name: '帕梅拉腹肌课 (轻度)', sets: '1套', weight: '自重', duration: 10, calories: 40 }
                    ],
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
                    targetWater: 3.0
                },
                '周四': {
                    type: '拉力 + 腹肌 (重度)',
                    exercises: [
                        { name: '爬楼机', sets: '-', weight: '速度8-9', duration: 30, calories: 150 },
                        { name: '跑步机', sets: '-', weight: '2 miles', duration: 30, calories: 150 },
                        { name: '帕梅拉腹肌课 (轻度)', sets: '1套', weight: '自重', duration: 10, calories: 40 }
                    ],
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
                    targetWater: 3.2
                },
                '周六': {
                    type: '有氧 + 腹肌 (轻度)',
                    exercises: [
                        { name: '爬楼机', sets: '-', weight: '速度9', duration: 30, calories: 150 },
                        { name: '跑步机', sets: '-', weight: '2 miles', duration: 30, calories: 150 },
                        { name: '帕梅拉腹肌课 (轻度)', sets: '1套', weight: '自重', duration: 10, calories: 40 }
                    ],
                    targetWater: 3.0
                },
                '周日': {
                    type: '恢复 + 轻活动',
                    exercises: [
                        { name: '拉伸+泡脚+轻走', sets: '-', weight: '-', duration: 40, calories: 120 }
                    ],
                    targetWater: 2.8
                }
            }
        };
    }
    
    // 生成计划ID
    generatePlanId() {
        return 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // 获取当前日期的训练计划
    getCurrentWeeklyPlan() {
        let currentPlan = this.getActivePlanForDate(this.selectedDate);
        
        if (!currentPlan) {
            console.warn('⚠️ 未找到有效的训练计划，尝试初始化默认计划');
            this.initDefaultPlan();
            currentPlan = this.getActivePlanForDate(this.selectedDate);
        }
        
        // 如果还是没有计划，尝试获取任何一个活跃的计划
        if (!currentPlan) {
            console.warn('⚠️ 仍未找到计划，尝试使用任何活跃计划');
            currentPlan = Object.values(this.trainingPlans).find(plan => plan.isActive);
        }
        
        return currentPlan ? currentPlan.weeklySchedule || {} : {};
    }
    
    // 根据日期获取有效的训练计划
    getActivePlanForDate(date) {
        const dateStr = this.getDateString(date);
        let activePlan = null;
        let latestStartDate = null;
        
        // 查找在指定日期生效的最新计划
        Object.values(this.trainingPlans).forEach(plan => {
            if (plan.isActive) {
                // 如果计划开始日期在指定日期之前或当天，则该计划在指定日期生效
                if (plan.startDate <= dateStr) {
                    if (!latestStartDate || plan.startDate > latestStartDate) {
                        latestStartDate = plan.startDate;
                        activePlan = plan;
                    }
                }
            }
        });
        
        // 如果没找到符合条件的计划，尝试使用最新的活跃计划（向前兼容）
        if (!activePlan) {
            console.warn('⚠️ 未找到在指定日期生效的计划，使用最新的活跃计划');
            Object.values(this.trainingPlans).forEach(plan => {
                if (plan.isActive) {
                    if (!latestStartDate || plan.startDate > latestStartDate) {
                        latestStartDate = plan.startDate;
                        activePlan = plan;
                    }
                }
            });
        }
        
        return activePlan;
    }
    
    // 保存训练计划
    async saveTrainingPlan(plan) {
        this.trainingPlans[plan.id] = plan;
        this.saveTrainingPlansToStorage();
        
        // 如果启用了云端同步，同步到云端
        if (this.cloudSync.enabled) {
            try {
                await this.syncTrainingPlansToCloud();
            } catch (error) {
                console.warn('⚠️ 云端同步失败，数据已保存到本地:', error.message);
            }
        }
    }
    
    // 保存训练计划到本地存储
    saveTrainingPlansToStorage() {
        localStorage.setItem('fitness-training-plans', JSON.stringify(this.trainingPlans));
        localStorage.setItem('fitness-training-plans-timestamp', Date.now().toString());
    }
    
    // 从本地存储加载训练计划
    loadTrainingPlans() {
        const saved = localStorage.getItem('fitness-training-plans');
        return saved ? JSON.parse(saved) : {};
    }
    
    // 保存当前计划ID
    saveCurrentPlanId() {
        localStorage.setItem('fitness-current-plan-id', this.currentPlanId);
    }
    
    // 加载当前计划ID
    loadCurrentPlanId() {
        const saved = localStorage.getItem('fitness-current-plan-id');
        if (saved && this.trainingPlans[saved]) {
            return saved;
        }
        
        // 如果没有保存的ID或计划不存在，找到第一个活跃的计划
        const activePlans = Object.values(this.trainingPlans).filter(plan => plan.isActive);
        return activePlans.length > 0 ? activePlans[0].id : null;
    }
    
    // 创建新的训练计划
    async createNewTrainingPlan(planData) {
        const newPlan = {
            id: this.generatePlanId(),
            name: planData.name || '新训练计划',
            description: planData.description || '',
            startDate: planData.startDate || this.getDateString(new Date()),
            isActive: planData.isActive !== undefined ? planData.isActive : true,
            createdAt: new Date().toISOString(),
            weeklySchedule: planData.weeklySchedule || this.createEmptyWeeklySchedule()
        };
        
        await this.saveTrainingPlan(newPlan);
        return newPlan;
    }
    
    // 创建空的周计划模板
    createEmptyWeeklySchedule() {
        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const schedule = {};
        
        days.forEach(day => {
            schedule[day] = {
                type: '休息日',
                exercises: [],
                targetWater: 2.5
            };
        });
        
        return schedule;
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
        // 异步更新热力图，不阻塞当前操作
        this.generateHeatmap().catch(console.error);
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
        const weeklyPlan = this.getCurrentWeeklyPlan();
        const plan = weeklyPlan[today];
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

    async init() {
        // 首先初始化LeanCloud（如果可用）
        await this.checkLeanCloudConfig();
        
        // 然后检查并设置用户ID
        this.initUsername();
        
        // 接着初始化云端同步
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
    async refreshPageData() {
        this.updateTodayDisplay();
        this.loadTodayPlan();
        this.loadTodayData();
        await this.generateHeatmap();
        this.updateStatistics();
        
        // 如果计划管理界面正在显示，也刷新它
        const planTab = document.getElementById('plans-tab');
        if (planTab && planTab.classList.contains('active')) {
            this.loadPlansManagement();
        }
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

    // ========== 用户认证相关方法 ==========
    
    // 检查和初始化LeanCloud
    async checkLeanCloudConfig() {
        if (typeof AV === 'undefined') {
            console.warn('⚠️ LeanCloud SDK 未加载，将使用离线模式');
            return false;
        }
        
        if (!window.LEANCLOUD_CONFIG) {
            console.warn('⚠️ LeanCloud 配置未找到，将使用离线模式');
            return false;
        }
        
        const config = window.LEANCLOUD_CONFIG;
        if (!config.appId || !config.appKey) {
            console.warn('⚠️ LeanCloud 配置不完整，将使用离线模式');
            return false;
        }
        
        // 确保LeanCloud已初始化
        try {
            if (!AV.applicationId || AV.applicationId !== config.appId) {
                console.log('🔧 正在初始化云端同步服务...');
                AV.init({
                    appId: config.appId,
                    appKey: config.appKey,
                    serverURL: config.serverURL
                });
                console.log('✅ 云端同步服务初始化成功');
                
                // 测试基本连接
                const connected = await this.testLeanCloudConnection();
                if (!connected) {
                    console.warn('⚠️ LeanCloud 连接测试失败，可能存在网络或配置问题');
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.warn('⚠️ 云端同步服务初始化失败，将使用离线模式:', error.message);
            return false;
        }
    }
    
    // 测试基本的LeanCloud连接
    async testLeanCloudConnection() {
        try {
            console.log('🧪 测试 LeanCloud 基本连接...');
            
            // 尝试创建一个测试对象
            const TestObject = AV.Object.extend('TestConnection');
            const testObj = new TestObject();
            testObj.set('message', 'connection test');
            testObj.set('timestamp', new Date());
            
            const result = await testObj.save();
            console.log('✅ LeanCloud 连接测试成功:', result.id);
            
            // 立即删除测试对象
            await result.destroy();
            console.log('🗑️ 测试对象已清理');
            
            return true;
        } catch (error) {
            console.error('❌ LeanCloud 连接测试失败:', error);
            return false;
        }
    }

    // 友好的错误处理
    handleAuthError(error, operation) {
        let message = '';
        
        if (error.code === 101 || error.message.includes("doesn't exist")) {
            if (operation === 'login') {
                message = '该用户名还没有注册，请先注册账户';
            } else {
                message = '这是第一个用户，系统将自动创建用户表';
            }
        } else if (error.message.includes('reserved')) {
            message = '系统字段冲突，正在修复...';
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
            message = '云端服务暂时不可用，建议使用离线模式';
        } else {
            message = error.message;
        }
        
        console.log(`🔧 错误处理 [${operation}]:`, message);
        return message;
    }
    
    // 简单的哈希函数（用于密码加密）
    async hashPassword(password, username) {
        const encoder = new TextEncoder();
        const data = encoder.encode(username + ':' + password + ':fitness_tracker_salt_2025');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    

    
    // 验证用户凭据
    async verifyCredentials(username, password, storedPasswordHash) {
        const inputPasswordHash = await this.hashPassword(password, username);
        return inputPasswordHash === storedPasswordHash;
    }
    
    // 检查用户是否已注册（在LeanCloud中查询）
    async checkUserExists(username) {
        try {
            const query = new AV.Query('FitnessUsers');
            query.equalTo('username', username.toLowerCase());
            const result = await query.find();
            return result.length > 0;
        } catch (error) {
            console.error('检查用户是否存在时出错:', error);
            
            // 如果是类不存在的错误，说明还没有用户注册过
            if (error.code === 101 || error.message.includes("doesn't exist")) {
                console.log('📝 FitnessUsers 类不存在，这是第一个用户注册');
                return false; // 第一个用户，类还不存在
            }
            
            // 其他错误也返回false，让注册继续进行
            return false;
        }
    }
    
    // 注册新用户到LeanCloud
    async registerUser(username, password) {
        try {
            const passwordHash = await this.hashPassword(password, username);
            
            // 创建用户记录
            const FitnessUser = AV.Object.extend('FitnessUsers');
            const user = new FitnessUser();
            user.set('username', username.toLowerCase());
            user.set('passwordHash', passwordHash);
            user.set('lastLoginAt', new Date());
            
            await user.save();
            console.log('✅ 用户注册成功:', username);
            return username.toLowerCase();
        } catch (error) {
            console.error('❌ 用户注册失败:', error);
            throw error;
        }
    }
    
    // 用户登录验证
    async loginUser(username, password) {
        try {
            const query = new AV.Query('FitnessUsers');
            query.equalTo('username', username.toLowerCase());
            const users = await query.find();
            
            if (users.length === 0) {
                throw new Error('用户不存在，请先注册账户');
            }
            
            const user = users[0];
            const storedPasswordHash = user.get('passwordHash');
            const isValid = await this.verifyCredentials(username, password, storedPasswordHash);
            
            if (!isValid) {
                throw new Error('密码错误');
            }
            
            // 更新最后登录时间
            user.set('lastLoginAt', new Date());
            await user.save();
            
            console.log('✅ 用户登录成功:', username);
            return username.toLowerCase();
        } catch (error) {
            console.error('❌ 用户登录失败:', error);
            
            // 如果是类不存在的错误，说明还没有用户注册过
            if (error.code === 101 || error.message.includes("doesn't exist")) {
                throw new Error('还没有注册用户，请先注册账户');
            }
            
            throw error;
        }
    }

    // ========== 日期和工具方法 ==========

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
    
    // 格式化日期为 YYYY-MM-DD 格式
    formatDate(date) {
        return this.getDateString(date);
    }
    
    // 获取本地数据
    getLocalData() {
        return JSON.parse(localStorage.getItem('fitness-data') || '{}');
    }
    
    // 初始化用户（在页面加载时主动提示）
    initUsername() {
        const savedUsername = localStorage.getItem('fitness-username');
        
        if (!savedUsername) {
            // 首次访问，友好地提示用户注册或登录
            setTimeout(() => {
                this.promptForUsername();
            }, 1000); // 延迟1秒，让页面完全加载
        } else {
            console.log('🙋‍♀️ 欢迎回来！当前用户:', savedUsername);
            // 更新用户按钮状态和云端同步
            this.setUsername(savedUsername);
        }
    }
    
    // 提示用户注册或登录
    async promptForUsername() {
        try {
            // 检查LeanCloud配置
            const cloudAvailable = await this.checkLeanCloudConfig();
            if (!cloudAvailable) {
                throw new Error('云端同步服务暂时不可用，建议使用离线模式');
            }
            
            // 先显示欢迎信息
            const welcomeInfo = `🎉 欢迎使用健身打卡系统！

✨ 主要功能：
• 📅 按周计划安排训练
• ✅ 每日运动打卡记录  
• 🔥 热量缺口计算追踪
• 📊 数据统计与可视化
• ☁️ 多设备云端数据同步

🔐 为了数据安全，现在需要注册或登录账户。`;

            alert(welcomeInfo);
            
            // 询问是注册还是登录
            const isNewUser = confirm('请选择操作：\n\n确定 = 注册新账户\n取消 = 已有账户登录');
            
            if (isNewUser) {
                // 注册新账户
                await this.handleUserRegistration();
            } else {
                // 登录现有账户  
                await this.handleUserLogin();
            }
            
        } catch (error) {
            console.error('❌ 用户认证过程出错:', error);
            
            // 提供备用选项
            if (confirm(`认证过程出现问题：${error.message}\n\n是否使用离线模式？（数据仅保存在本设备）`)) {
                const offlineUsername = prompt('离线模式需要一个本地用户名：') || 'offline_user';
                this.setUsername(offlineUsername);
                console.log('� 使用离线模式');
            } else {
                // 重新尝试
                setTimeout(() => this.promptForUsername(), 1000);
            }
        }
    }
    
    // 处理用户注册
    async handleUserRegistration() {
        try {
            const username = prompt(`📝 注册新账户

请输入用户名：
• 支持英文、数字、下划线
• 建议使用易记的名称
• 示例：zhangsan, user123`);
            
            if (!username || !username.trim()) {
                throw new Error('用户名不能为空');
            }
            
            // 显示加载状态
            this.setUserButtonLoading(true);
            
            // 检查用户名是否已存在
            const exists = await this.checkUserExists(username.trim());
            if (exists) {
                if (confirm(`用户名 "${username}" 已被使用。\n\n确定 = 尝试登录\n取消 = 重新注册`)) {
                    await this.handleUserLogin(username.trim());
                    return;
                } else {
                    await this.handleUserRegistration();
                    return;
                }
            }
            
            const password = prompt(`🔐 设置密码

用户名：${username}

请输入密码：
• 至少6位字符
• 建议包含字母和数字
• 请妥善保管密码`);
            
            if (!password || password.length < 6) {
                throw new Error('密码至少需要6位字符');
            }
            
            // 简单的密码强度检查
            const hasLetter = /[a-zA-Z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            
            if (!hasLetter || !hasNumber) {
                const continueWeakPassword = confirm(`⚠️ 密码强度提醒

当前密码较简单，建议：
• 同时包含字母和数字
• 使用特殊字符增加安全性

是否继续使用当前密码？`);
                
                if (!continueWeakPassword) {
                    await this.handleUserRegistration();
                    return;
                }
            }
            
            const confirmPassword = prompt(`🔐 确认密码

请再次输入密码确认：`);
            
            if (password !== confirmPassword) {
                throw new Error('两次输入的密码不一致');
            }
            
            // 注册用户
            await this.registerUser(username.trim(), password);
            
            // 保存登录状态
            this.setUsername(username.trim());
            
            alert(`✅ 注册成功！

👤 用户名：${username}

📱 多设备同步：
在其他设备使用相同的用户名和密码即可同步数据。

🎯 开始使用健身打卡系统吧！`);
            
        } catch (error) {
            console.error('❌ 注册失败:', error);
            
            // 如果是404错误，说明第一次使用，尝试离线模式
            if (error.code === 101 || error.message.includes("doesn't exist") || error.message.includes("404")) {
                const useOffline = confirm(`这是第一次使用云端同步功能，服务器还在初始化中。\n\n是否暂时使用离线模式？\n\n注意：离线模式下数据只保存在本设备，无法多设备同步。`);
                
                if (useOffline) {
                    // 直接使用用户名
                    this.setUsername(username.trim());
                    
                    alert(`✅ 离线模式设置成功！\n\n👤 用户名：${username}\n\n📝 注意：当前为离线模式，稍后可以尝试重新启用云端同步。`);
                    return; // 成功退出，不抛出错误
                }
            }
            
            const friendlyMessage = this.handleAuthError(error, 'register');
            alert(`注册失败：${friendlyMessage}`);
            throw new Error(friendlyMessage);
        } finally {
            // 清除加载状态
            this.setUserButtonLoading(false);
        }
    }
    
    // 处理用户登录
    async handleUserLogin(prefilledUsername = '') {
        try {
            const username = prefilledUsername || prompt(`🔑 用户登录

请输入用户名：`);
            
            if (!username || !username.trim()) {
                throw new Error('用户名不能为空');
            }
            
            // 显示加载状态
            this.setUserButtonLoading(true);
            
            const password = prompt(`🔐 输入密码

用户名：${username}
请输入密码：`);
            
            if (!password) {
                throw new Error('密码不能为空');
            }
            
            // 验证登录
            await this.loginUser(username.trim(), password);
            
            // 保存登录状态
            this.setUsername(username.trim());
            
            alert(`✅ 登录成功！

👤 欢迎回来，${username}！

📊 您的数据正在同步中...`);
            
            // 立即同步数据
            if (this.cloudSync.enabled) {
                this.syncFromCloud();
            }
            
        } catch (error) {
            console.error('❌ 登录失败:', error);
            
            // 如果是404错误，说明用户表不存在，建议先注册
            if (error.code === 101 || error.message.includes("doesn't exist") || error.message.includes("404")) {
                const tryRegister = confirm(`云端服务正在初始化中，没有找到用户记录。\n\n是否尝试注册新账户？`);
                
                if (tryRegister) {
                    await this.handleUserRegistration();
                    return; // 转到注册流程
                }
            }
            
            const friendlyMessage = this.handleAuthError(error, 'login');
            alert(`登录失败：${friendlyMessage}`);
            throw new Error(friendlyMessage);
        } finally {
            // 清除加载状态
            this.setUserButtonLoading(false);
        }
    }
    
    // 设置用户名（统一使用用户名）
    setUsername(username) {
        const cleanUsername = username.toLowerCase();
        localStorage.setItem('fitness-username', cleanUsername);
        console.log('✅ 用户已设置:', cleanUsername);
        
        // 更新用户按钮状态
        this.updateUserButtonStatus(cleanUsername);
        
        // 设置云端同步的用户名
        this.cloudSync.username = cleanUsername;
        
        // 如果云端同步已启用，立即同步数据
        if (this.cloudSync.enabled) {
            this.syncFromCloud();
            this.syncTrainingPlansFromCloud();
        }
    }
    
    // 设置用户按钮加载状态
    setUserButtonLoading(isLoading) {
        const userBtn = document.getElementById('user-info-btn');
        if (!userBtn) return;
        
        if (isLoading) {
            userBtn.classList.remove('user-need-setup', 'user-ready');
            userBtn.classList.add('user-loading');
            userBtn.title = '正在处理，请稍候...';
            userBtn.innerHTML = '<i class="fas fa-spinner"></i>';
        } else {
            userBtn.classList.remove('user-loading');
            // 恢复到之前的状态将由其他方法处理
        }
    }

    // 更新用户按钮的状态和提示
    updateUserButtonStatus(username) {
        const userBtn = document.getElementById('user-info-btn');
        if (!userBtn) return;
        
        // 清除加载状态
        userBtn.classList.remove('user-loading');
        
        if (!username) {
            // 未登录，显示提醒状态
            userBtn.classList.remove('user-ready');
            userBtn.classList.add('user-need-setup');
            userBtn.title = '🔐 点击注册或登录账户 - 启用云端数据同步';
            userBtn.innerHTML = '<i class="fas fa-user-plus"></i>';
        } else {
            // 已登录用户，显示正常状态
            userBtn.classList.remove('user-need-setup');
            userBtn.classList.add('user-ready');
            userBtn.title = `👤 ${username} - 点击管理账户`;
            userBtn.innerHTML = '<i class="fas fa-user-check"></i>';
        }
    }

    // 加载今日训练计划
    loadTodayPlan() {
        const today = this.getTodayWeekday();
        const weeklyPlan = this.getCurrentWeeklyPlan();
        const plan = weeklyPlan[today];
        
        if (!plan) {
            console.warn('⚠️ 未找到今日计划:', today, '可用计划:', Object.keys(weeklyPlan));
            return;
        }

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
                        <span class="btn-text" style="min-width: 60px; display: inline-block;">${this.isExerciseCompleted(index) ? '已完成' : '完成'}</span>
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
        
        // 批量更新界面，减少重复渲染
        requestAnimationFrame(() => {
            this.updateExerciseCaloriesDisplay();
            this.updateNutritionDisplay(); // 更新营养显示（包含热量缺口）
            this.updateStatistics();
        });
        
        // 异步更新热力图，不阻塞当前操作
        this.generateHeatmap().catch(console.error);
    }

    // 更新实际运动消耗显示
    updateExerciseCaloriesDisplay() {
        const today = this.getTodayWeekday();
        const weeklyPlan = this.getCurrentWeeklyPlan();
        const plan = weeklyPlan[today];
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
            if (waterInput) waterInput.value = nutrition.water !== undefined ? nutrition.water : ''; // 只在有记录时显示
            if (proteinCheck) proteinCheck.checked = nutrition.proteinPowder || false;
            
            this.updateNutritionDisplay();
        } else {
            // 清空所有输入框，不设置默认值
            const caloriesInput = document.getElementById('calories-input');
            const waterInput = document.getElementById('water-input');
            const proteinCheck = document.getElementById('protein-powder-check');
            
            if (caloriesInput) caloriesInput.value = '';
            if (waterInput) waterInput.value = '';
            if (proteinCheck) proteinCheck.checked = false;
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
        const waterValue = document.getElementById('water-input').value;
        const water = waterValue ? parseFloat(waterValue) : undefined; // 只有输入了才保存
        const proteinPowder = document.getElementById('protein-powder-check')?.checked || false;

        // 构建营养数据对象，只保存有值的字段
        const nutritionData = { calories, proteinPowder };
        if (water !== undefined) {
            nutritionData.water = water;
        }

        data[dateStr].nutrition = nutritionData;
        
        // 使用新的同步保存方法
        this.saveDataWithSync('fitness-data', data);
        this.updateNutritionDisplay();
        this.updateStatistics();
        // 异步更新热力图，不阻塞当前操作
        this.generateHeatmap().catch(console.error);
    }

    // 更新营养显示
    updateNutritionDisplay() {
        const today = this.getTodayWeekday();
        const weeklyPlan = this.getCurrentWeeklyPlan();
        const plan = weeklyPlan[today];
        if (!plan) return;

        const caloriesInput = document.getElementById('calories-input');
        const waterInput = document.getElementById('water-input');
        const proteinCheck = document.getElementById('protein-powder-check');
        
        const calories = parseFloat(caloriesInput?.value) || 0;
        const waterValue = waterInput?.value;
        const water = waterValue ? parseFloat(waterValue) : null; // 没有输入时为null
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

        // 获取当天的活动水平并计算 TDEE（考虑活动水平的基础消耗）
        const activityLevel = this.getTodayActivityLevel();
        const tdee = this.calculateTDEE(activityLevel);
        
        // 总消耗 = TDEE + 额外运动消耗
        // TDEE 包含了基础代谢和日常活动，额外运动需要单独加上
        const totalBurned = tdee + actualExerciseCalories;
        
        // 热量缺口 = 总消耗 - 摄入
        // 如果没有摄入数据，缺口为0  
        const calorieGap = calories > 0 ? totalBurned - calories : 0;
        
        // 调试信息
        console.log('🔍 热量缺口计算调试:', {
            activityLevel,
            tdee,
            actualExerciseCalories,
            totalBurned,
            calories,
            calorieGap
        });
        
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
            if (water !== null) {
                waterStatusElement.textContent = water + 'L';
                waterStatusElement.className = `value ${water >= 2.5 ? 'positive' : 'neutral'}`;
            } else {
                waterStatusElement.textContent = '未记录';
                waterStatusElement.className = 'value neutral';
            }
        }
    }

    // 初始化事件监听
    initEventListeners() {
        // 日期选择器
        const datePicker = document.getElementById('date-picker');
        if (datePicker) {
            datePicker.addEventListener('change', async (e) => {
                // 修复时区问题：使用本地时间而不是 UTC
                const dateValue = e.target.value; // "YYYY-MM-DD"
                const [year, month, day] = dateValue.split('-').map(Number);
                this.selectedDate = new Date(year, month - 1, day); // 月份需要减1
                
                // 先同步新日期的数据，再刷新页面
                await this.syncOnDateChange();
                await this.refreshPageData();
            });
        }
        
        // 回到今天按钮
        const todayBtn = document.getElementById('today-btn');
        if (todayBtn) {
            todayBtn.addEventListener('click', async () => {
                this.selectedDate = new Date();
                
                // 先同步今天的数据，再刷新页面
                await this.syncOnDateChange();
                await this.refreshPageData();
            });
        }
        
        // 运动完成按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('.check-btn')) {
                const btn = e.target.closest('.check-btn');
                const exerciseIndex = btn.dataset.exercise;
                const isCompleted = btn.dataset.completed === 'true';
                
                // 防止重复点击
                if (btn.disabled) {
                    return;
                }
                
                // 先禁用按钮，防止重复点击
                btn.disabled = true;
                btn.classList.add('updating');
                
                // 立即更新按钮UI状态，提供即时反馈
                const newCompleted = !isCompleted;
                btn.dataset.completed = newCompleted;
                
                const icon = btn.querySelector('i');
                icon.className = `fas fa-${newCompleted ? 'check-circle' : 'circle'}`;
                
                // 使用requestAnimationFrame优化DOM更新
                requestAnimationFrame(() => {
                    btn.innerHTML = `<i class="${icon.className}"></i> <span class="btn-text">${newCompleted ? '已完成' : '完成'}</span>`;
                    
                    // 延迟恢复按钮状态
                    setTimeout(() => {
                        btn.classList.remove('updating');
                        btn.disabled = false;
                    }, 200);
                });
                
                // 保存运动完成状态（已包含必要的界面更新）
                this.saveExerciseCompletion(exerciseIndex, newCompleted);
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
                    // 延迟保存和更新热力图，避免频繁更新
                    clearTimeout(nutritionUpdateTimeout);
                    nutritionUpdateTimeout = setTimeout(() => {
                        // 保存营养数据并更新热力图
                        this.saveNutritionData();
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
        
        // 用户信息按钮
        const userInfoBtn = document.getElementById('user-info-btn');
        if (userInfoBtn) {
            userInfoBtn.addEventListener('click', () => {
                this.showUserInfo();
            });
        }
        
        // 训练计划管理按钮
        this.initPlanManagementListeners();
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
                } else if (targetTab === 'plans') {
                    this.loadPlansManagement();
                }
            });
        });
    }
    
    // ==================== 训练计划管理界面方法 ====================
    
    // 初始化训练计划管理事件监听
    initPlanManagementListeners() {
        // 创建新计划按钮
        const createPlanBtn = document.getElementById('create-plan-btn');
        if (createPlanBtn) {
            createPlanBtn.addEventListener('click', () => this.showCreatePlanEditor());
        }
        
        // 编辑当前计划按钮
        const editCurrentPlanBtn = document.getElementById('edit-current-plan-btn');
        if (editCurrentPlanBtn) {
            editCurrentPlanBtn.addEventListener('click', () => this.editCurrentPlan());
        }
        
        // 复制计划按钮
        const duplicatePlanBtn = document.getElementById('duplicate-plan-btn');
        if (duplicatePlanBtn) {
            duplicatePlanBtn.addEventListener('click', () => this.duplicateCurrentPlan());
        }
        
        // 保存计划按钮
        const savePlanBtn = document.getElementById('save-plan-btn');
        if (savePlanBtn) {
            savePlanBtn.addEventListener('click', async () => {
                try {
                    await this.savePlanFromEditor();
                } catch (error) {
                    console.error('保存计划时出错:', error);
                    alert('保存计划时出错，请稍后重试');
                }
            });
        }
        
        // 取消编辑按钮
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => this.cancelPlanEdit());
        }
        
        // 使用事件代理处理动态生成的计划操作按钮
        document.addEventListener('click', async (e) => {
            // 激活计划按钮
            if (e.target.classList.contains('plan-activate-btn')) {
                const planId = e.target.getAttribute('data-plan-id');
                if (planId) {
                    try {
                        await this.activatePlan(planId);
                    } catch (error) {
                        console.error('激活计划时出错:', error);
                        alert('激活计划时出错，请稍后重试');
                    }
                }
            }
            
            // 编辑计划按钮
            if (e.target.classList.contains('plan-edit-btn')) {
                const planId = e.target.getAttribute('data-plan-id');
                if (planId) {
                    this.editPlan(planId);
                }
            }
            
            // 删除计划按钮
            if (e.target.classList.contains('plan-delete-btn')) {
                const planId = e.target.getAttribute('data-plan-id');
                if (planId) {
                    this.deletePlan(planId);
                }
            }
        });
    }
    
    // 加载训练计划管理界面
    loadPlansManagement() {
        this.displayCurrentPlan();
        this.displayPlansHistory();
    }
    
    // 显示当前活跃计划
    displayCurrentPlan() {
        const currentPlanDisplay = document.getElementById('current-plan-display');
        if (!currentPlanDisplay) return;
        
        const currentPlan = this.getActivePlanForDate(new Date());
        
        if (currentPlan) {
            const planInfo = currentPlanDisplay.querySelector('.plan-info');
            planInfo.querySelector('.plan-name').textContent = currentPlan.name;
            planInfo.querySelector('.start-date').textContent = `生效日期: ${currentPlan.startDate}`;
            planInfo.querySelector('.plan-status').textContent = `状态: 活跃`;
        } else {
            const planInfo = currentPlanDisplay.querySelector('.plan-info');
            planInfo.querySelector('.plan-name').textContent = '暂无活跃计划';
            planInfo.querySelector('.start-date').textContent = '生效日期: --';
            planInfo.querySelector('.plan-status').textContent = '状态: 无';
        }
    }
    
    // 显示历史计划列表
    displayPlansHistory() {
        const historyList = document.getElementById('plans-history-list');
        if (!historyList) return;
        
        const allPlans = Object.values(this.trainingPlans);
        const currentPlan = this.getActivePlanForDate(new Date());
        
        // 过滤出历史计划（非当前活跃的计划）
        const historyPlans = allPlans.filter(plan => plan.id !== (currentPlan ? currentPlan.id : null));
        
        if (historyPlans.length === 0) {
            historyList.innerHTML = '<div class="empty-state">暂无历史计划</div>';
            return;
        }
        
        historyList.innerHTML = historyPlans.map(plan => `
            <div class="plan-card" data-plan-id="${plan.id}">
                <div class="plan-info">
                    <div class="plan-name">${plan.name}</div>
                    <div class="plan-details">
                        <span class="start-date">生效日期: ${plan.startDate}</span>
                        <span class="plan-status">状态: ${plan.isActive ? '备用' : '已停用'}</span>
                    </div>
                </div>
                <div class="plan-controls">
                    <button class="btn-outline plan-activate-btn" data-plan-id="${plan.id}">激活</button>
                    <button class="btn-outline plan-edit-btn" data-plan-id="${plan.id}">编辑</button>
                    <button class="btn-secondary plan-delete-btn" data-plan-id="${plan.id}">删除</button>
                </div>
            </div>
        `).join('');
    }
    
    // 显示创建计划编辑器
    showCreatePlanEditor() {
        const editor = document.getElementById('plan-editor');
        const title = document.getElementById('editor-title');
        
        if (editor && title) {
            title.textContent = '创建训练计划';
            editor.style.display = 'block';
            editor.dataset.mode = 'create';
            
            // 清空表单
            this.clearPlanEditor();
            
            // 设置默认生效日期为今天
            const startDateInput = document.getElementById('plan-start-date-input');
            if (startDateInput) {
                startDateInput.value = this.getDateString(new Date());
            }
            
            // 生成周计划编辑器
            this.generateWeeklyScheduleEditor();
        }
    }
    
    // 编辑当前计划
    editCurrentPlan() {
        const currentPlan = this.getActivePlanForDate(new Date());
        if (currentPlan) {
            this.editPlan(currentPlan.id);
        }
    }
    
    // 编辑指定计划
    editPlan(planId) {
        const plan = this.trainingPlans[planId];
        if (!plan) return;
        
        const editor = document.getElementById('plan-editor');
        const title = document.getElementById('editor-title');
        
        if (editor && title) {
            title.textContent = '编辑训练计划';
            editor.style.display = 'block';
            editor.dataset.mode = 'edit';
            editor.dataset.planId = planId;
            
            // 填充表单数据
            this.fillPlanEditor(plan);
            
            // 生成周计划编辑器
            this.generateWeeklyScheduleEditor(plan.weeklySchedule);
        }
    }
    
    // 复制当前计划
    duplicateCurrentPlan() {
        const currentPlan = this.getActivePlanForDate(new Date());
        if (!currentPlan) return;
        
        const editor = document.getElementById('plan-editor');
        const title = document.getElementById('editor-title');
        
        if (editor && title) {
            title.textContent = '复制训练计划';
            editor.style.display = 'block';
            editor.dataset.mode = 'create';
            
            // 填充原计划数据，但修改名称
            const duplicatedPlan = JSON.parse(JSON.stringify(currentPlan));
            duplicatedPlan.name += ' (副本)';
            duplicatedPlan.startDate = this.getDateString(new Date());
            
            this.fillPlanEditor(duplicatedPlan);
            this.generateWeeklyScheduleEditor(duplicatedPlan.weeklySchedule);
        }
    }
    
    // 清空计划编辑器
    clearPlanEditor() {
        document.getElementById('plan-name-input').value = '';
        document.getElementById('plan-description-input').value = '';
        document.getElementById('plan-start-date-input').value = '';
    }
    
    // 填充计划编辑器
    fillPlanEditor(plan) {
        document.getElementById('plan-name-input').value = plan.name || '';
        document.getElementById('plan-description-input').value = plan.description || '';
        document.getElementById('plan-start-date-input').value = plan.startDate || '';
    }
    
    // 生成周计划编辑器
    generateWeeklyScheduleEditor(weeklySchedule = null) {
        const container = document.getElementById('days-editor-container');
        if (!container) return;
        
        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const schedule = weeklySchedule || this.createEmptyWeeklySchedule();
        
        container.innerHTML = days.map(day => {
            const dayPlan = schedule[day] || { type: '休息日', exercises: [], targetWater: 2.5 };
            
            return `
                <div class="day-editor" data-day="${day}">
                    <div class="day-header">
                        <h6>${day}</h6>
                        <button type="button" class="btn-outline" onclick="fitnessTracker.addExerciseToDay('${day}')">
                            <i class="fas fa-plus"></i> 添加运动
                        </button>
                    </div>
                    <div class="day-type">
                        <input type="text" placeholder="训练类型" value="${dayPlan.type}" 
                               onchange="fitnessTracker.updateDayType('${day}', this.value)">
                    </div>
                    <div class="exercises-list" data-day="${day}">
                        ${dayPlan.exercises.map((exercise, index) => this.renderExerciseEditor(day, exercise, index)).join('')}
                    </div>
                    <div class="day-water">
                        <label>目标饮水量(L):</label>
                        <input type="number" step="0.1" value="${dayPlan.targetWater}" 
                               onchange="fitnessTracker.updateTargetWater('${day}', this.value)">
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 渲染运动项目编辑器
    renderExerciseEditor(day, exercise, index) {
        return `
            <div class="exercise-editor" data-day="${day}" data-index="${index}">
                <div class="exercise-inputs">
                    <input type="text" placeholder="运动名称" value="${exercise.name || ''}" 
                           onchange="fitnessTracker.updateExerciseField('${day}', ${index}, 'name', this.value)">
                    <input type="text" placeholder="组数" value="${exercise.sets || ''}" 
                           onchange="fitnessTracker.updateExerciseField('${day}', ${index}, 'sets', this.value)">
                    <input type="text" placeholder="重量" value="${exercise.weight || ''}" 
                           onchange="fitnessTracker.updateExerciseField('${day}', ${index}, 'weight', this.value)">
                    <input type="number" placeholder="时长(分)" value="${exercise.duration || ''}" 
                           onchange="fitnessTracker.updateExerciseField('${day}', ${index}, 'duration', this.value)">
                    <input type="number" placeholder="消耗卡路里" value="${exercise.calories || ''}" 
                           onchange="fitnessTracker.updateExerciseField('${day}', ${index}, 'calories', this.value)">
                </div>
                <button type="button" class="btn-secondary" onclick="fitnessTracker.removeExercise('${day}', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }
    
    // 激活计划
    async activatePlan(planId) {
        const plan = this.trainingPlans[planId];
        if (!plan) return;
        
        if (confirm(`确定要激活计划"${plan.name}"吗？\n\n新计划将从今天开始生效。`)) {
            // 更新计划的生效日期和状态
            plan.startDate = this.getDateString(new Date());
            plan.isActive = true;
            
            // 将其他计划设为非活跃状态（如果需要的话）
            // 这里我们允许多个计划同时活跃，系统会自动选择最新的
            
            await this.saveTrainingPlan(plan);
            this.currentPlanId = planId;
            this.saveCurrentPlanId();
            
            // 刷新显示
            this.loadPlansManagement();
            await this.refreshPageData();
            
            alert('✅ 计划已激活！');
        }
    }
    
    // 删除计划
    deletePlan(planId) {
        const plan = this.trainingPlans[planId];
        if (!plan) return;
        
        if (confirm(`确定要删除计划"${plan.name}"吗？\n\n此操作无法撤销。`)) {
            delete this.trainingPlans[planId];
            this.saveTrainingPlansToStorage();
            
            // 如果删除的是当前计划，需要重新设置当前计划
            if (this.currentPlanId === planId) {
                const activePlans = Object.values(this.trainingPlans).filter(p => p.isActive);
                this.currentPlanId = activePlans.length > 0 ? activePlans[0].id : null;
                this.saveCurrentPlanId();
            }
            
            this.loadPlansManagement();
            this.refreshPageData();
            
            alert('✅ 计划已删除！');
        }
    }
    
    // 保存编辑器中的计划
    async savePlanFromEditor() {
        const mode = document.getElementById('plan-editor').dataset.mode;
        const planId = document.getElementById('plan-editor').dataset.planId;
        
        // 收集基本信息
        const name = document.getElementById('plan-name-input').value.trim();
        const description = document.getElementById('plan-description-input').value.trim();
        const startDate = document.getElementById('plan-start-date-input').value;
        
        if (!name) {
            alert('请输入计划名称');
            return;
        }
        
        if (!startDate) {
            alert('请选择生效日期');
            return;
        }
        
        // 收集周计划数据
        const weeklySchedule = this.collectWeeklyScheduleFromEditor();
        
        if (mode === 'create') {
            // 创建新计划
            const newPlan = await this.createNewTrainingPlan({
                name,
                description,
                startDate,
                isActive: true,
                weeklySchedule
            });
            
            this.currentPlanId = newPlan.id;
            this.saveCurrentPlanId();
            
            alert('✅ 新计划已创建！');
        } else if (mode === 'edit') {
            // 更新现有计划
            const plan = this.trainingPlans[planId];
            if (plan) {
                plan.name = name;
                plan.description = description;
                plan.startDate = startDate;
                plan.weeklySchedule = weeklySchedule;
                
                await this.saveTrainingPlan(plan);
                alert('✅ 计划已更新！');
            }
        }
        
        this.cancelPlanEdit();
        this.loadPlansManagement();
        this.refreshPageData();
    }
    
    // 收集编辑器中的周计划数据
    collectWeeklyScheduleFromEditor() {
        const schedule = {};
        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        
        days.forEach(day => {
            const dayEditor = document.querySelector(`[data-day="${day}"]`);
            if (!dayEditor) return;
            
            const typeInput = dayEditor.querySelector('.day-type input');
            const waterInput = dayEditor.querySelector('.day-water input');
            const exerciseEditors = dayEditor.querySelectorAll('.exercise-editor');
            
            const exercises = [];
            exerciseEditors.forEach(editor => {
                const inputs = editor.querySelectorAll('input');
                const exercise = {
                    name: inputs[0]?.value || '',
                    sets: inputs[1]?.value || '',
                    weight: inputs[2]?.value || '',
                    duration: parseInt(inputs[3]?.value) || 0,
                    calories: parseInt(inputs[4]?.value) || 0
                };
                
                if (exercise.name) {
                    exercises.push(exercise);
                }
            });
            
            schedule[day] = {
                type: typeInput?.value || '休息日',
                exercises: exercises,
                targetWater: parseFloat(waterInput?.value) || 2.5
            };
        });
        
        return schedule;
    }
    
    // 取消计划编辑
    cancelPlanEdit() {
        const editor = document.getElementById('plan-editor');
        if (editor) {
            editor.style.display = 'none';
            editor.removeAttribute('data-mode');
            editor.removeAttribute('data-plan-id');
        }
    }
    
    // 添加运动到指定日期
    addExerciseToDay(day) {
        const exercisesList = document.querySelector(`[data-day="${day}"] .exercises-list`);
        if (!exercisesList) return;
        
        const exerciseIndex = exercisesList.children.length;
        const newExercise = { name: '', sets: '', weight: '', duration: 0, calories: 0 };
        
        exercisesList.insertAdjacentHTML('beforeend', 
            this.renderExerciseEditor(day, newExercise, exerciseIndex)
        );
    }
    
    // 移除运动项目
    removeExercise(day, index) {
        const exerciseEditor = document.querySelector(`[data-day="${day}"] .exercise-editor[data-index="${index}"]`);
        if (exerciseEditor) {
            exerciseEditor.remove();
            
            // 重新编号剩余的运动项目
            const remainingExercises = document.querySelectorAll(`[data-day="${day}"] .exercise-editor`);
            remainingExercises.forEach((editor, newIndex) => {
                editor.dataset.index = newIndex;
                // 更新事件处理器
                const inputs = editor.querySelectorAll('input');
                inputs.forEach((input, inputIndex) => {
                    const fields = ['name', 'sets', 'weight', 'duration', 'calories'];
                    input.setAttribute('onchange', `fitnessTracker.updateExerciseField('${day}', ${newIndex}, '${fields[inputIndex]}', this.value)`);
                });
                
                const removeBtn = editor.querySelector('button');
                removeBtn.setAttribute('onclick', `fitnessTracker.removeExercise('${day}', ${newIndex})`);
            });
        }
    }
    
    // 更新运动项目字段
    updateExerciseField(day, index, field, value) {
        // 这个方法在实时编辑时被调用，暂时不需要特殊处理
        // 数据会在保存时统一收集
    }
    
    // 更新日期类型
    updateDayType(day, value) {
        // 实时更新，保存时统一处理
    }
    
    // 更新目标饮水量
    updateTargetWater(day, value) {
        // 实时更新，保存时统一处理
    }

    // 生成热力图
    async generateHeatmap() {
        console.log('🔥 正在重新生成热力图...');
        const heatmapGrid = document.getElementById('heatmap-grid');
        heatmapGrid.innerHTML = '';
        
        // 先尝试从云端加载历史数据（如果启用了云端同步）
        if (this.cloudSync.enabled && this.cloudSync.username) {
            await this.loadHistoryDataForHeatmap();
        }
        
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        console.log('📊 热力图数据包含', Object.keys(data).length, '天的记录');
        console.log('📊 热力图数据详情:', Object.keys(data).slice(0, 10)); // 显示前10天的日期
        
        // 调试：显示当前用户名和云端同步状态
        console.log('🔍 热力图调试信息:');
        console.log('- 云端同步启用:', this.cloudSync.enabled);
        console.log('- 当前用户名:', this.cloudSync.username);
        console.log('- localStorage用户名:', localStorage.getItem('fitness-username'));
        
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
                    const activePlan = this.getActivePlanForDate(date);
                    const plan = activePlan ? activePlan.weeklySchedule[weekday] : null;
                    
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
                        
                        // 获取当天的活动水平，如果没有保存则使用默认值
                        const savedActivityLevel = dayData.activityLevel || 'moderately';
                        const tdee = this.calculateTDEE(savedActivityLevel);
                        
                        // 总消耗 = TDEE + 额外运动消耗
                        const totalBurned = tdee + actualExerciseCalories;
                        
                        // 计算热量缺口 = 总消耗 - 摄入
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
            const activePlan = this.getActivePlanForDate(date);
            const plan = activePlan ? activePlan.weeklySchedule[weekday] : null;
            
            if (plan && plan.exercises) {
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
            const activePlan = this.getActivePlanForDate(date);
            const plan = activePlan ? activePlan.weeklySchedule[weekday] : null;
            
            if (plan && plan.exercises && dayData && dayData.exercises) {
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
                const activePlan = this.getActivePlanForDate(date);
                const plan = activePlan ? activePlan.weeklySchedule[weekday] : null;
                
                if (plan && plan.exercises) {
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
        let daysWithWater = 0;
        
        last30Days.forEach(dateStr => {
            const dayData = data[dateStr];
            if (dayData && dayData.nutrition && dayData.nutrition.calories > 0) {
                const date = new Date(dateStr);
                const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
                const activePlan = this.getActivePlanForDate(date);
                const plan = activePlan ? activePlan.weeklySchedule[weekday] : null;
                
                if (plan && plan.exercises) {
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
                    
                    // 获取当天的活动水平，如果没有保存则使用默认值
                    const savedActivityLevel = dayData.activityLevel || 'moderately';
                    const tdee = this.calculateTDEE(savedActivityLevel);
                    
                    // 总消耗 = TDEE + 额外运动消耗
                    const totalBurned = tdee + actualExerciseCalories;
                    
                    // 热量缺口 = 总消耗 - 摄入
                    const calorieGap = totalBurned - dayData.nutrition.calories;
                    totalCalorieGap += calorieGap;
                    
                    // 只计算有记录的饮水量
                    if (dayData.nutrition.water !== undefined) {
                        totalWater += dayData.nutrition.water;
                        daysWithWater++;
                    }
                    
                    if (dayData.nutrition.proteinPowder) {
                        proteinDays++;
                    }
                    
                    daysWithNutrition++;
                }
            }
        });
        
        const avgCalorieGap = daysWithNutrition > 0 ? Math.round(totalCalorieGap / daysWithNutrition) : 0;
        const proteinRate = daysWithNutrition > 0 ? Math.round((proteinDays / daysWithNutrition) * 100) : 0;
        const avgWater = daysWithWater > 0 ? (totalWater / daysWithWater).toFixed(1) : 0;
        
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
                const activePlan = this.getActivePlanForDate(date);
                const plan = activePlan ? activePlan.weeklySchedule[weekday] : null;
                
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
                    
                    // 获取当天的活动水平，如果没有保存则使用默认值
                    const savedActivityLevel = dayData.activityLevel || 'moderately';
                    const tdee = this.calculateTDEE(savedActivityLevel);
                    
                    // 总消耗 = TDEE + 额外运动消耗
                    const totalBurned = tdee + actualExerciseCalories;
                    
                    // 热量缺口 = 总消耗 - 摄入
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
        console.log('🔧 开始初始化云端同步...');
        console.log('AV 对象存在:', typeof AV !== 'undefined');
        console.log('配置存在:', !!window.LEANCLOUD_CONFIG);
        
        // 检查是否有 LeanCloud 配置
        if (typeof AV !== 'undefined' && window.LEANCLOUD_CONFIG) {
            try {
                console.log('📡 正在连接 LeanCloud...', window.LEANCLOUD_CONFIG);
                
                // 使用和 Valine 相同的配置
                AV.init(window.LEANCLOUD_CONFIG);
                this.cloudSync.enabled = true;
                
                console.log('✅ 云端同步服务已连接，等待用户认证设置username');
                this.updateSyncStatus('syncing');
                this.syncFromCloud();
                this.syncTrainingPlansFromCloud();
            } catch (error) {
                console.error('❌ 云端同步初始化失败:', error);
                this.cloudSync.enabled = false;
                this.updateSyncStatus('offline');
            }
        } else {
            if (typeof AV === 'undefined') {
                console.log('⚠️ LeanCloud SDK 未加载');
            }
            if (!window.LEANCLOUD_CONFIG) {
                console.log('⚠️ LeanCloud 配置未找到');
            }
            console.log('📱 使用本地存储模式');
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
    

    
    // 从云端同步当前日期的数据
    async syncFromCloud() {
        if (!this.cloudSync.enabled) return;
        
        try {
            console.log('🔄 正在从云端同步当前日期数据...');
            
            const dateKey = this.formatDate(this.selectedDate);
            const recordId = `${this.cloudSync.username}_${dateKey}`;
            
            const FitnessDayData = AV.Object.extend('FitnessDayData');
            const query = new AV.Query(FitnessDayData);
            query.equalTo('recordId', recordId);
            query.descending('updatedAt');
            query.limit(1);
            
            const results = await query.find();
            console.log(`📥 云端查询结果 (${dateKey}):`, results.length);
            
            if (results.length > 0) {
                const cloudData = results[0].get('dayData');
                const cloudTimestamp = results[0].updatedAt.getTime();
                
                console.log('☁️ 云端数据时间戳:', new Date(cloudTimestamp));
                
                // 获取本地当天数据的时间戳
                const localData = this.getLocalData();
                const localDayData = localData[dateKey] || {};
                const localTimestamp = localDayData.lastUpdate || 0;
                
                console.log('💾 本地数据时间戳:', new Date(localTimestamp));
                
                if (cloudTimestamp > localTimestamp) {
                    // 云端数据更新，覆盖本地当天数据
                    localData[dateKey] = {
                        ...cloudData,
                        lastUpdate: cloudTimestamp
                    };
                    
                    localStorage.setItem('fitness-data', JSON.stringify(localData));
                    console.log(`✅ 已从云端同步 ${dateKey} 的数据`);
                    this.updateSyncStatus('synced');
                    
                    // 刷新页面显示
                    this.refreshPageData();
                } else if (localTimestamp > cloudTimestamp) {
                    // 本地数据更新，上传到云端
                    console.log('📤 本地数据较新，准备上传');
                    this.syncCurrentDayToCloud();
                } else {
                    console.log('📊 数据已是最新');
                    this.updateSyncStatus('synced');
                }
            } else {
                console.log(`☁️ 云端暂无 ${dateKey} 的数据`);
                // 云端没有当天数据，检查本地是否有数据需要上传
                const localData = this.getLocalData();
                const localDayData = localData[dateKey];
                
                if (localDayData && Object.keys(localDayData).length > 1) { // 有数据且不只是lastUpdate
                    console.log('📤 准备上传本地当天数据到云端');
                    this.syncCurrentDayToCloud();
                } else {
                    console.log('📱 本地当天也无数据，等待用户操作');
                    this.updateSyncStatus('synced');
                }
            }
        } catch (error) {
            // 处理 404 错误 - Class 不存在是正常情况
            if (error.message && error.message.includes('404')) {
                console.log('📋 FitnessDayData 表尚不存在，这是正常情况');
                
                // 尝试从旧的 FitnessData 表迁移数据
                await this.migrateFromOldData();
                
                // 检查是否有本地数据需要上传
                const localData = this.getLocalData();
                const dateKey = this.formatDate(this.selectedDate);
                const localDayData = localData[dateKey];
                
                if (localDayData && Object.keys(localDayData).length > 1) {
                    console.log('📤 准备创建表并上传本地当天数据');
                    this.syncCurrentDayToCloud();
                } else {
                    console.log('📱 等待用户操作后创建数据');
                    this.updateSyncStatus('synced');
                }
            } else {
                console.error('❌ 从云端同步数据失败:', error);
                this.updateSyncStatus('offline');
            }
        }
    }
    
    // 上传当前日期的数据到云端
    async syncCurrentDayToCloud() {
        if (!this.cloudSync.enabled) return;
        
        // 在函数开始时定义 dateKey，确保在所有块中都能访问
        const dateKey = this.formatDate(this.selectedDate);
        
        // 防止重复上传
        const uploadKey = `uploading_${dateKey}`;
        if (this[uploadKey]) {
            console.log(`⚠️ ${dateKey} 的数据正在上传中，跳过重复请求`);
            return;
        }
        
        this[uploadKey] = true;
        
        try {
            const recordId = `${this.cloudSync.username}_${dateKey}`;
            
            const localData = this.getLocalData();
            const dayData = localData[dateKey] || {};
            
            console.log(`📤 准备上传 ${dateKey} 的数据:`, dayData);
            
            const FitnessDayData = AV.Object.extend('FitnessDayData');
            let fitnessDayData;
            
            try {
                // 尝试查询该日期的现有记录
                const query = new AV.Query(FitnessDayData);
                query.equalTo('recordId', recordId);
                
                const results = await query.find();
                
                if (results.length > 0) {
                    // 更新现有记录
                    console.log(`🔄 更新 ${dateKey} 的现有记录`);
                    fitnessDayData = results[0];
                } else {
                    // 创建新记录
                    console.log(`➕ 创建 ${dateKey} 的新记录`);
                    fitnessDayData = new FitnessDayData();
                    fitnessDayData.set('username', this.cloudSync.username);
                    fitnessDayData.set('recordId', recordId);
                    fitnessDayData.set('date', dateKey);
                }
            } catch (queryError) {
                // 如果查询失败（比如 Class 不存在），直接创建新记录
                if (queryError.message && queryError.message.includes('404')) {
                    console.log(`📋 Class 不存在，直接创建 ${dateKey} 的新记录`);
                    fitnessDayData = new FitnessDayData();
                    fitnessDayData.set('username', this.cloudSync.username);
                    fitnessDayData.set('recordId', recordId);
                    fitnessDayData.set('date', dateKey);
                } else {
                    throw queryError;
                }
            }
            
            // 添加更新时间戳
            dayData.lastUpdate = Date.now();
            
            // 保存到云端
            fitnessDayData.set('dayData', dayData);
            const savedObject = await fitnessDayData.save();
            
            // 更新本地数据的时间戳
            localData[dateKey] = dayData;
            localStorage.setItem('fitness-data', JSON.stringify(localData));
            
            console.log(`✅ ${dateKey} 的数据已上传到云端，记录ID:`, savedObject.id);
            this.updateSyncStatus('synced');
        } catch (error) {
            console.error(`❌ 上传 ${dateKey} 的数据到云端失败:`, error);
            this.updateSyncStatus('offline');
        } finally {
            // 清除上传标志
            delete this[`uploading_${dateKey}`];
        }
    }
    
    // 上传训练计划到云端
    async syncTrainingPlansToCloud() {
        if (!this.cloudSync.enabled) {
            console.warn('⚠️ 云端同步未启用');
            return;
        }
        
        if (!this.cloudSync.username || this.cloudSync.username.trim() === '') {
            console.error('❌ 用户名为空，无法上传训练计划');
            console.log('🔍 当前 cloudSync 状态:', this.cloudSync);
            console.log('🔍 localStorage 中的用户名:', localStorage.getItem('fitness-username'));
            console.log('🔍 云端同步是否启用:', this.cloudSync.enabled);
            alert('请先设置用户名后再保存训练计划！\n\n调试信息:\n- cloudSync.username: "' + this.cloudSync.username + '"\n- localStorage username: "' + localStorage.getItem('fitness-username') + '"');
            return;
        }
        
        // 防止重复上传
        const uploadKey = 'uploading_training_plans';
        if (this[uploadKey]) {
            console.log('⚠️ 训练计划正在上传中，跳过重复请求');
            return;
        }
        
        this[uploadKey] = true;
        
        try {
            console.log('📤 准备上传训练计划到云端，用户:', this.cloudSync.username, '计划数量:', Object.keys(this.trainingPlans).length);
            
            const TrainingPlansData = AV.Object.extend('TrainingPlansData');
            let trainingPlansData;
            
            try {
                // 尝试查询现有的训练计划记录
                const query = new AV.Query(TrainingPlansData);
                query.equalTo('username', this.cloudSync.username);
                
                const results = await query.find();
                
                if (results.length > 0) {
                    // 更新现有记录
                    console.log('🔄 更新现有的训练计划记录');
                    trainingPlansData = results[0];
                } else {
                    // 创建新记录
                    console.log('➕ 创建新的训练计划记录');
                    trainingPlansData = new TrainingPlansData();
                    trainingPlansData.set('username', this.cloudSync.username);
                }
            } catch (queryError) {
                // 如果查询失败（比如 Class 不存在），直接创建新记录
                if (queryError.message && queryError.message.includes('404')) {
                    console.log('📋 TrainingPlansData Class 不存在，直接创建新记录');
                    trainingPlansData = new TrainingPlansData();
                    trainingPlansData.set('username', this.cloudSync.username);
                } else {
                    throw queryError;
                }
            }
            
            // 准备上传数据
            const uploadData = {
                trainingPlans: this.trainingPlans,
                currentPlanId: this.currentPlanId,
                lastUpdate: Date.now()
            };
            
            // 保存到云端
            trainingPlansData.set('plansData', uploadData);
            const savedObject = await trainingPlansData.save();
            
            console.log('✅ 训练计划已上传到云端，记录ID:', savedObject.id);
            this.updateSyncStatus('synced');
        } catch (error) {
            console.error('❌ 上传训练计划到云端失败:', error);
            this.updateSyncStatus('offline');
        } finally {
            // 清除上传标志
            delete this[uploadKey];
        }
    }
    
    // 迁移训练计划数据字段（从userId到username）
    async migrateTrainingPlansFields() {
        if (!this.cloudSync.enabled || !this.cloudSync.username) {
            console.warn('⚠️ 云端同步未启用或用户未设置');
            return;
        }
        
        try {
            console.log('🔄 开始迁移训练计划数据字段...');
            
            const TrainingPlansData = AV.Object.extend('TrainingPlansData');
            
            // 查找所有可能的旧记录（包括userId字段和recordId匹配的记录）
            const queries = [];
            
            // 查询1: 通过旧的recordId查找
            const recordId = `${this.cloudSync.username}_training_plans`;
            const query1 = new AV.Query(TrainingPlansData);
            query1.equalTo('recordId', recordId);
            queries.push(query1);
            
            // 查询2: 通过userId字段查找（如果存在的话）
            const query2 = new AV.Query(TrainingPlansData);
            query2.equalTo('userId', this.cloudSync.username);
            queries.push(query2);
            
            // 合并查询
            const mainQuery = AV.Query.or(...queries);
            const results = await mainQuery.find();
            
            console.log(`📋 找到 ${results.length} 条需要迁移的记录`);
            
            if (results.length > 0) {
                // 处理每条记录
                for (const record of results) {
                    console.log('🔄 迁移记录:', record.id);
                    
                    // 设置正确的字段
                    record.set('username', this.cloudSync.username);
                    
                    // 删除旧的字段（如果存在）
                    if (record.has('userId')) {
                        record.unset('userId');
                    }
                    if (record.has('recordId')) {
                        record.unset('recordId');
                    }
                    
                    // 保存更新
                    await record.save();
                    console.log('✅ 记录迁移完成:', record.id);
                }
                
                console.log('✅ 所有训练计划数据字段迁移完成');
                alert(`数据字段迁移完成！共处理 ${results.length} 条记录。`);
            } else {
                console.log('📋 未找到需要迁移的记录');
                alert('未找到需要迁移的记录，数据可能已经是最新格式。');
            }
            
        } catch (error) {
            console.error('❌ 数据字段迁移失败:', error);
            alert('数据字段迁移失败: ' + error.message);
        }
    }

    // 一键修复训练计划数据（迁移字段+重新同步）
    async fixTrainingPlansData() {
        if (!this.cloudSync.enabled || !this.cloudSync.name) {
            alert('请先设置用户名并确保云端同步已启用！');
            return;
        }
        
        if (!confirm('这将修复您的训练计划数据格式并重新同步到云端。\n\n确定要继续吗？')) {
            return;
        }
        
        try {
            console.log('🔧 开始一键修复训练计划数据...');
            
            // 步骤1: 迁移现有记录的字段
            await this.migrateTrainingPlansFields();
            
            // 步骤2: 确保本地有训练计划
            if (Object.keys(this.trainingPlans).length === 0) {
                console.log('📋 本地无训练计划，创建默认计划');
                this.initDefaultPlan();
            }
            
            // 步骤3: 重新同步数据
            console.log('🔄 重新同步训练计划数据...');
            await this.syncTrainingPlansFromCloud();
            
            // 步骤4: 上传本地计划到云端（确保格式正确）
            await this.syncTrainingPlansToCloud();
            
            console.log('✅ 一键修复完成');
            alert('✅ 训练计划数据修复完成！\n\n数据已更新为正确格式并重新同步。');
            
            // 刷新页面显示
            this.refreshPageData();
            this.loadPlansManagement();
            
        } catch (error) {
            console.error('❌ 一键修复失败:', error);
            alert('修复过程中出现错误: ' + error.message);
        }
    }

    // 强制重新上传训练计划（用于修复字段名称问题）
    async forceResyncTrainingPlans() {
        if (!this.cloudSync.enabled || !this.cloudSync.name) {
            console.warn('⚠️ 云端同步未启用或用户未设置');
            return;
        }
        
        try {
            console.log('🔄 强制重新同步训练计划...');
            
            // 删除旧的云端记录
            const TrainingPlansData = AV.Object.extend('TrainingPlansData');
            const query = new AV.Query(TrainingPlansData);
            query.equalTo('username', this.cloudSync.username);
            
            const results = await query.find();
            
            // 删除所有找到的旧记录
            if (results.length > 0) {
                console.log(`🗑️ 删除 ${results.length} 个旧的训练计划记录`);
                await AV.Object.destroyAll(results);
            }
            
            // 强制上传本地训练计划
            await this.syncTrainingPlansToCloud();
            
            console.log('✅ 训练计划重新同步完成');
            alert('训练计划已重新同步到云端！');
            
        } catch (error) {
            console.error('❌ 强制重新同步失败:', error);
            alert('重新同步失败: ' + error.message);
        }
    }

    // 从云端同步训练计划
    async syncTrainingPlansFromCloud() {
        if (!this.cloudSync.enabled) return;
        
        if (!this.cloudSync.username || this.cloudSync.username.trim() === '') {
            console.warn('⚠️ 用户名为空，无法从云端同步训练计划');
            console.log('🔍 当前 cloudSync 状态:', this.cloudSync);
            return;
        }
        
        try {
            console.log('📥 正在从云端同步训练计划，用户:', this.cloudSync.username);
            
            const TrainingPlansData = AV.Object.extend('TrainingPlansData');
            const query = new AV.Query(TrainingPlansData);
            query.equalTo('username', this.cloudSync.username);
            query.descending('updatedAt');
            query.limit(1);
            
            const results = await query.find();
            
            if (results.length > 0) {
                const cloudData = results[0].get('plansData');
                const cloudTimestamp = results[0].updatedAt.getTime();
                
                console.log('☁️ 云端训练计划数据时间戳:', new Date(cloudTimestamp));
                
                // 获取本地数据时间戳
                const localTimestamp = localStorage.getItem('fitness-training-plans-timestamp') || 0;
                
                console.log('💾 本地训练计划时间戳:', new Date(Number(localTimestamp)));
                
                if (cloudTimestamp > Number(localTimestamp)) {
                    // 云端数据更新，覆盖本地数据
                    this.trainingPlans = cloudData.trainingPlans || {};
                    this.currentPlanId = cloudData.currentPlanId || null;
                    
                    // 保存到本地存储
                    this.saveTrainingPlansToStorage();
                    this.saveCurrentPlanId();
                    localStorage.setItem('fitness-training-plans-timestamp', cloudTimestamp.toString());
                    
                    console.log('✅ 已从云端同步训练计划，用户:', this.cloudSync.username, '计划数量:', Object.keys(this.trainingPlans).length);
                    console.log('📋 计划列表:', Object.values(this.trainingPlans).map(p => p.name));
                    
                    // 刷新页面显示
                    this.refreshPageData();
                    this.loadPlansManagement();
                } else {
                    console.log('📊 训练计划已是最新');
                }
            } else {
                console.log('☁️ 云端暂无训练计划数据，用户:', this.cloudSync.username);
                
                // 云端没有数据，检查本地是否有数据需要上传
                if (Object.keys(this.trainingPlans).length > 0) {
                    console.log('📤 准备上传本地训练计划到云端');
                    await this.syncTrainingPlansToCloud();
                } else {
                    console.log('📋 本地也无训练计划，为用户创建默认计划');
                    this.initDefaultPlan();
                    // 创建默认计划后上传到云端
                    if (Object.keys(this.trainingPlans).length > 0) {
                        await this.syncTrainingPlansToCloud();
                    }
                }
            }
        } catch (error) {
            // 处理 404 错误 - Class 不存在是正常情况
            if (error.message && error.message.includes('404')) {
                console.log('📋 TrainingPlansData 表尚不存在，这是正常情况');
                
                // 检查是否有本地数据需要上传
                if (Object.keys(this.trainingPlans).length > 0) {
                    console.log('📤 准备创建表并上传本地训练计划');
                    await this.syncTrainingPlansToCloud();
                } else {
                    console.log('📋 本地也无训练计划，为用户创建默认计划');
                    this.initDefaultPlan();
                    // 创建默认计划后上传到云端
                    if (Object.keys(this.trainingPlans).length > 0) {
                        await this.syncTrainingPlansToCloud();
                    }
                }
            } else {
                console.error('❌ 从云端同步训练计划失败:', error);
                this.updateSyncStatus('offline');
            }
        }
    }
    
    // 保存数据并同步到云端
    saveDataWithSync(key, data) {
        // 先保存到本地
        localStorage.setItem(key, JSON.stringify(data));
        
        // 延迟上传当前日期的数据到云端（避免频繁请求）
        clearTimeout(this.syncTimeout);
        if (this.cloudSync.enabled) {
            this.updateSyncStatus('syncing');
            this.syncTimeout = setTimeout(() => {
                this.syncCurrentDayToCloud();
            }, 2000); // 2秒后上传
        }
    }
    
    // 当日期切换时同步新日期的数据
    async syncOnDateChange() {
        if (this.cloudSync.enabled) {
            this.updateSyncStatus('syncing');
            await this.syncFromCloud(); // 从云端加载新日期的数据
        }
    }
    
    // 为热力图加载历史数据
    async loadHistoryDataForHeatmap() {
        if (!this.cloudSync.enabled || !this.cloudSync.username) {
            console.warn('⚠️ 云端同步未启用，无法加载历史数据');
            return;
        }
        
        try {
            console.log('📊 正在从云端加载历史数据用于热力图...');
            
            const FitnessDayData = AV.Object.extend('FitnessDayData');
            const query = new AV.Query(FitnessDayData);
            
            // 查询当前用户过去一年的所有数据
            query.equalTo('username', this.cloudSync.username);
            
            // 设置时间范围：过去一年
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            query.greaterThanOrEqualTo('createdAt', oneYearAgo);
            
            // 按更新时间降序排列，限制返回数量防止超时
            query.descending('updatedAt');
            query.limit(1000); // 限制最多1000条记录
            
            const results = await query.find();
            console.log(`📥 从云端获取到 ${results.length} 条历史记录`);
            
            // 调试：显示查询的详细信息
            console.log('🔍 历史数据查询详情:');
            console.log('- 查询用户名:', this.cloudSync.username);
            console.log('- 查询时间范围:', oneYearAgo.toISOString(), '至今');
            console.log('- 查询结果数量:', results.length);
            
            if (results.length > 0) {
                const localData = JSON.parse(localStorage.getItem('fitness-data') || '{}');
                let updatedCount = 0;
                
                // 合并云端数据到本地存储
                results.forEach(result => {
                    const dayData = result.get('dayData');
                    const recordId = result.get('recordId');
                    const cloudTimestamp = result.updatedAt.getTime();
                    
                    // 从recordId提取日期 (格式: username_YYYY-MM-DD)
                    const dateKey = recordId.split('_').slice(1).join('_'); // 处理用户名中可能包含下划线的情况
                    
                    if (dateKey && dateKey.match(/\d{4}-\d{2}-\d{2}/)) {
                        const localTimestamp = localData[dateKey]?.lastUpdate || 0;
                        
                        // 只有云端数据更新时才覆盖本地数据
                        if (cloudTimestamp > localTimestamp) {
                            localData[dateKey] = {
                                ...dayData,
                                lastUpdate: cloudTimestamp
                            };
                            updatedCount++;
                        }
                    }
                });
                
                if (updatedCount > 0) {
                    localStorage.setItem('fitness-data', JSON.stringify(localData));
                    console.log(`✅ 已更新 ${updatedCount} 天的历史数据到本地存储`);
                } else {
                    console.log('📊 本地历史数据已是最新，无需更新');
                }
            }
            
        } catch (error) {
            console.error('❌ 加载历史数据失败:', error);
        }
    }
    
    // 重置用户名（用于切换同步账户）
    resetUsername() {
        this.changeUsername();
    }
    
    // 手动同步历史数据（调试用）
    async manualSyncHistoryData() {
        console.log('🔧 手动触发历史数据同步...');
        await this.loadHistoryDataForHeatmap();
        await this.generateHeatmap();
        console.log('✅ 历史数据同步完成，热力图已重新生成');
    }
    
    // 调试：显示当前本地数据
    showLocalDataDebug() {
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        console.log('🔍 本地数据调试信息:');
        console.log('- 数据总天数:', Object.keys(data).length);
        console.log('- 所有日期:', Object.keys(data));
        console.log('- 最近5天的数据:', Object.keys(data).slice(-5).map(date => ({
            date: date,
            hasNutrition: !!(data[date]?.nutrition?.calories),
            hasExercises: !!(data[date]?.exercises),
            calories: data[date]?.nutrition?.calories || 0
        })));
        
        // 检查是否有非零的卡路里数据
        const daysWithCalories = Object.keys(data).filter(date => 
            data[date]?.nutrition?.calories > 0
        );
        console.log('- 有卡路里记录的天数:', daysWithCalories.length);
        console.log('- 有卡路里记录的日期:', daysWithCalories.slice(-5));
        
        return data;
    }
    
    // 完整的热力图调试
    async debugHeatmap() {
        console.log('🔥 完整热力图调试开始...');
        
        // 1. 检查用户认证
        console.log('1️⃣ 检查用户认证状态:');
        const currentUser = AV.User.current();
        console.log('- 当前用户:', currentUser);
        console.log('- 用户名:', currentUser?.get('username'));
        
        // 2. 显示本地数据
        console.log('\n2️⃣ 检查本地数据:');
        const localData = this.showLocalDataDebug();
        
        // 3. 手动同步云端数据
        console.log('\n3️⃣ 同步云端历史数据:');
        await this.loadHistoryDataForHeatmap();
        
        // 4. 重新生成热力图
        console.log('\n4️⃣ 重新生成热力图:');
        await this.generateHeatmap();
        
        // 5. 检查同步后的数据
        console.log('\n5️⃣ 同步后的本地数据:');
        const updatedData = this.showLocalDataDebug();
        
        console.log('\n🎯 调试总结:');
        console.log('- 用户认证:', !!currentUser);
        console.log('- 同步前数据天数:', Object.keys(localData).length);
        console.log('- 同步后数据天数:', Object.keys(updatedData).length);
        console.log('- 数据有变化:', Object.keys(localData).length !== Object.keys(updatedData).length);
        
        return {
            user: currentUser,
            beforeSync: Object.keys(localData).length,
            afterSync: Object.keys(updatedData).length
        };
    }
    
    // 获取当前用户名
    getCurrentUsername() {
        return localStorage.getItem('fitness-username') || '未设置';
    }
    
    // 显示用户信息弹窗
    showUserInfo() {
        const username = localStorage.getItem('fitness-username') || '未知用户';
        const syncStatus = this.cloudSync.enabled ? '✅ 已启用' : '❌ 未启用';
        const isOfflineMode = !username || username === '未知用户' || username === 'offline_user';
        
        let message;
        if (isOfflineMode) {
            message = `� 当前模式: 离线模式
☁️ 云端同步状态: ${syncStatus}

💡 提示：您当前使用离线模式，数据仅保存在本设备。

🔐 是否要注册账户启用云端同步？`;
        } else {
            message = `👤 当前登录用户: ${username}
☁️ 云端同步状态: ${syncStatus}

📱 多设备同步说明：
• 使用相同的用户名和密码在其他设备登录即可同步数据
• 数据安全加密存储在云端

🔄 是否要切换账户？`;
        }
        
        if (confirm(message)) {
            this.changeUsername();
        }
    }
    
    // 更换用户ID（支持注册、登录和登出）
    async changeUsername() {
        try {
            const username = localStorage.getItem('fitness-username');
            const isOfflineMode = !username || username === '未知用户' || username === 'offline_user';
            
            let action;
            if (isOfflineMode) {
                action = confirm('请选择操作：\n\n确定 = 注册新账户\n取消 = 登录现有账户');
                if (action) {
                    await this.handleUserRegistration();
                } else {
                    await this.handleUserLogin();
                }
            } else {
                // 已登录用户的选项
                const choice = confirm(`当前已登录：${localStorage.getItem('fitness-username')}\n\n请选择操作：\n\n确定 = 切换到其他账户\n取消 = 退出当前账户`);
                
                if (choice) {
                    // 切换账户
                    const switchChoice = confirm('切换账户：\n\n确定 = 登录其他账户\n取消 = 注册新账户');
                    if (switchChoice) {
                        await this.handleUserLogin();
                    } else {
                        await this.handleUserRegistration();
                    }
                } else {
                    // 退出登录
                    if (confirm('确定要退出当前账户吗？\n\n退出后将切换到离线模式，云端数据不会丢失。')) {
                        this.logoutUser();
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ 用户操作失败:', error);
            alert(`操作失败：${error.message}`);
        }
    }
    
    // 用户登出
    logoutUser() {
        // 清除用户数据
        localStorage.removeItem('fitness-user-id');
        localStorage.removeItem('fitness-username');
        
        // 设置为离线模式
        this.setUsername('offline_user');
        
        alert('✅ 已退出账户\n\n现在使用离线模式，您可以随时重新登录。');
        
        // 刷新页面
        setTimeout(() => location.reload(), 1000);
    }
    
    // 从旧的 FitnessData 迁移数据到新的 FitnessDayData 结构
    async migrateFromOldData() {
        if (!this.cloudSync.enabled) return;
        
        // 防止重复迁移
        if (this.migrationInProgress) {
            console.log('⚠️ 数据迁移正在进行中，跳过重复请求');
            return;
        }
        
        this.migrationInProgress = true;
        
        try {
            console.log('🔄 尝试从旧数据格式迁移...');
            
            const FitnessData = AV.Object.extend('FitnessData');
            const query = new AV.Query(FitnessData);
            query.equalTo('username', this.cloudSync.username);
            query.descending('updatedAt');
            query.limit(1);
            
            const results = await query.find();
            
            if (results.length > 0) {
                const oldData = results[0].get('data');
                console.log('📦 发现旧数据，开始迁移:', Object.keys(oldData).length, '天的记录');
                
                // 迁移每一天的数据到新格式
                for (const [dateKey, dayData] of Object.entries(oldData)) {
                    if (dateKey && dayData && typeof dayData === 'object') {
                        console.log(`📤 迁移 ${dateKey} 的数据...`);
                        
                        const recordId = `${this.cloudSync.username}_${dateKey}`;
                        const FitnessDayData = AV.Object.extend('FitnessDayData');
                        const fitnessDayData = new FitnessDayData();
                        
                        fitnessDayData.set('username', this.cloudSync.username);
                        fitnessDayData.set('recordId', recordId);
                        fitnessDayData.set('date', dateKey);
                        fitnessDayData.set('dayData', {
                            ...dayData,
                            lastUpdate: Date.now()
                        });
                        
                        try {
                            await fitnessDayData.save();
                            console.log(`✅ ${dateKey} 迁移成功`);
                        } catch (saveError) {
                            console.warn(`⚠️ ${dateKey} 迁移失败:`, saveError.message);
                        }
                    }
                }
                
                console.log('🎉 数据迁移完成！');
                
                // 可选：删除旧数据（注释掉以保持安全）
                // await results[0].destroy();
                // console.log('🗑️ 旧数据已清理');
                
            } else {
                console.log('📭 没有发现需要迁移的旧数据');
            }
        } catch (error) {
            if (error.message && error.message.includes('404')) {
                console.log('📋 旧 FitnessData 表不存在，无需迁移');
            } else {
                console.warn('⚠️ 数据迁移过程中出错:', error.message);
            }
        } finally {
            // 清除迁移标志
            this.migrationInProgress = false;
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 防止重复初始化
    if (window.fitnessTrackerInstance) {
        console.warn('⚠️ FitnessTracker 实例已存在，跳过重复初始化');
        return;
    }
    
    // 检查DOM是否包含健身打卡相关元素
    const fitnessContainer = document.querySelector('.fitness-container');
    if (!fitnessContainer) {
        console.log('📋 当前页面不包含健身打卡组件，跳过初始化');
        return;
    }
    
    // 先初始化 LeanCloud 配置（如果存在）
    if (typeof window.LEANCLOUD_CONFIG === 'undefined') {
        // 可以在这里配置你的 LeanCloud 信息
        // window.LEANCLOUD_CONFIG = {
        //     appId: 'your-app-id',
        //     appKey: 'your-app-key',
        //     serverURL: 'your-server-url'
        // };
    }
    
    // 将 FitnessTracker 类暴露到全局，防止重复声明
    window.FitnessTracker = FitnessTracker;
    
    // 创建实例并保存到全局变量
    window.fitnessTrackerInstance = new FitnessTracker();
    
    // 同时创建一个简短的全局引用供HTML onclick使用
    window.fitnessTracker = window.fitnessTrackerInstance;
    
    console.log('✅ FitnessTracker 初始化完成');
});

})(); // 关闭立即执行函数