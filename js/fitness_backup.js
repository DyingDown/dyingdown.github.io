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
        
        // 热力图生成锁，防止重复生成
        this.heatmapGenerating = false;
        this.heatmapUpdateTimer = null;
        
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
        
        // 健康记录管理相关变量
        this.editingRecordId = null; // 当前正在编辑的记录ID
        this.allHealthRecords = []; // 所有健康记录缓存
        
        // 目标热量缺口（卡路里）
        this.targetCalorieDeficit = 450;
        
        // 健康数据录入限制
        this.lastHealthRecordTime = 0; // 上次录入健康数据的时间
        
        // 数据表创建状态跟踪
        this.healthTableCreated = false;
        this.goalTableCreated = false;
        
        // 数据缓存，减少重复的 API 调用
        this.dataCache = {
            healthInfo: null,
            userGoal: null,
            cacheTime: 0,
            cacheTimeout: 30000 // 缓存30秒
        };
        
        // 图表实例
        this.weightChart = null;
        
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
        // 异步更新热力图，添加防抖
        this.debounceHeatmapUpdate();
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
        
        // 延迟生成热力图和更新数据面板
        setTimeout(() => {
            this.generateHeatmap().catch(console.error);
            this.updateDashboard().catch(console.error);
        }, 100);
        
        this.updateStatistics();
    }
    
    // 刷新页面数据（日期改变时调用）
    async refreshPageData() {
        this.updateTodayDisplay();
        this.loadTodayPlan();
        this.loadTodayData();
        // 用户主动刷新页面时立即更新热力图和数据面板
        await this.generateHeatmap();
        await this.updateDashboard();
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
            this.updateWorkoutStats(); // 更新运动统计
            this.updateCalorieProgress(); // 更新卡路里进度
            this.updateStatistics();
        });
        
        // 异步更新热力图，使用防抖机制但保持实时性
        this.debounceHeatmapUpdate();
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
        this.updateNutritionSummary(); // 更新营养摘要
        this.updateCalorieProgress(); // 更新卡路里进度
        this.updateStatistics();
        // 营养数据变化时也延迟更新热力图，避免频繁重绘
        this.debounceHeatmapUpdate();
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
                
                // 立即更新按钮UI状态，提供即时反馈
                const newCompleted = !isCompleted;
                btn.dataset.completed = newCompleted;
                
                // 更新按钮内容，使用优化的DOM操作
                const icon = btn.querySelector('i');
                const textSpan = btn.querySelector('.btn-text');
                
                if (icon) {
                    icon.className = `fas fa-${newCompleted ? 'check-circle' : 'circle'}`;
                }
                if (textSpan) {
                    textSpan.textContent = newCompleted ? '已完成' : '完成';
                }
                
                // 短暂禁用按钮，防止快速重复点击
                btn.disabled = true;
                setTimeout(() => {
                    btn.disabled = false;
                }, 150);
                
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
        
        // 数据面板功能
        this.initDashboardListeners();
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

    // 防抖更新热力图 - 平衡实时性和性能
    debounceHeatmapUpdate() {
        if (this.heatmapUpdateTimer) {
            clearTimeout(this.heatmapUpdateTimer);
        }
        
        // 300ms延迟，既保持响应性又避免过度频繁更新
        this.heatmapUpdateTimer = setTimeout(() => {
            this.generateHeatmap().catch(console.error);
        }, 300);
    }

    // 生成热力图
    async generateHeatmap() {
        // 防止重复生成
        if (this.heatmapGenerating) {
            console.log('🔥 热力图正在生成中，跳过重复调用');
            return;
        }
        
        this.heatmapGenerating = true;
        
        try {
            console.log('🔥 正在重新生成热力图...');
            const heatmapGrid = document.getElementById('heatmap-grid');
            if (!heatmapGrid) {
                console.warn('热力图容器未找到');
                return;
            }
            
            // 创建新的热力图内容，CSS已确保容器尺寸稳定
            const newHeatmapContent = document.createDocumentFragment();
            
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
            
            newHeatmapContent.appendChild(weekElement);
        }
        
        // 一次性替换所有内容，减少重排
        heatmapGrid.innerHTML = '';
        heatmapGrid.appendChild(newHeatmapContent);
        } catch (error) {
            console.error('热力图生成失败:', error);
        } finally {
            this.heatmapGenerating = false;
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
    
    // ==================== 健康数据管理功能 ====================
    
    // 获取用户健康信息
    async getUserHealthInfo(limit = 1, useCache = true) {
        if (!this.cloudSync.enabled || !this.cloudSync.username) {
            console.warn('云端同步未启用，无法获取健康数据');
            return [];
        }
        
        // 检查缓存（只缓存limit=1的情况，避免复杂化）
        const now = Date.now();
        if (useCache && limit === 1 && this.dataCache.healthInfo && (now - this.dataCache.cacheTime < this.dataCache.cacheTimeout)) {
            return this.dataCache.healthInfo;
        }
        
        try {
            const UserHealthInfo = AV.Object.extend('UserHealthInfo');
            const query = new AV.Query(UserHealthInfo);
            query.equalTo('username', this.cloudSync.username);
            query.descending('recordDate');
            query.limit(limit);
            
            const results = await query.find();
            const healthData = results.map(result => ({
                id: result.id,
                weight: result.get('weight'),
                height: result.get('height'),
                bodyFat: result.get('bodyFat') || null, // 体脂率可能为空
                recordDate: result.get('recordDate'),
                createdAt: result.get('createdAt')
            }));
            
            // 更新缓存（只缓存 limit=1 的情况）
            if (limit === 1) {
                this.dataCache.healthInfo = healthData;
                this.dataCache.cacheTime = Date.now();
            }
            
            return healthData;
        } catch (error) {
            // 如果是表不存在的错误（404），返回空数组而不是错误
            if (error.code === 101 || (error.message && error.message.includes('404'))) {
                console.log('💡 健康数据表尚未创建，将在首次保存数据时自动创建');
                // 缓存空结果
                if (limit === 1) {
                    this.dataCache.healthInfo = [];
                    this.dataCache.cacheTime = Date.now();
                }
                return [];
            }
            console.error('获取健康数据失败:', error);
            return [];
        }
    }
    
    // 保存健康信息
    async saveHealthInfo(healthData) {
        // 检查录入频率限制（1小时内只能录入一次）
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        if (now - this.lastHealthRecordTime < oneHour) {
            const remainingTime = Math.ceil((oneHour - (now - this.lastHealthRecordTime)) / (1000 * 60));
            alert(`请等待 ${remainingTime} 分钟后再录入健康数据`);
            return false;
        }
        
        if (!this.cloudSync.enabled || !this.cloudSync.username) {
            alert('请先登录账户以保存健康数据');
            return false;
        }
        
        try {
            const UserHealthInfo = AV.Object.extend('UserHealthInfo');
            const healthInfo = new UserHealthInfo();
            
            healthInfo.set('username', this.cloudSync.username);
            healthInfo.set('weight', parseFloat(healthData.weight));
            healthInfo.set('height', parseInt(healthData.height));
            // 体脂率为可选字段
            if (healthData.bodyFat) {
                healthInfo.set('bodyFat', parseFloat(healthData.bodyFat));
            }
            healthInfo.set('recordDate', new Date());
            
            await healthInfo.save();
            
            this.lastHealthRecordTime = now;
            console.log('✅ 健康数据保存成功');
            
            // 清除健康数据缓存，下次查询时重新获取
            this.dataCache.healthInfo = null;
            this.dataCache.cacheTime = 0;
            
            // 首次保存成功后，表就被创建了
            if (!this.healthTableCreated) {
                console.log('🎉 健康数据表创建成功！');
                this.healthTableCreated = true;
            }
            
            return true;
        } catch (error) {
            console.error('保存健康数据失败:', error);
            
            // 提供更友好的错误提示
            let errorMessage = '保存失败，请稍后重试';
            if (error.message && error.message.includes('network')) {
                errorMessage = '网络连接失败，请检查网络后重试';
            } else if (error.message && error.message.includes('permission')) {
                errorMessage = '权限不足，请联系管理员';
            }
            
            alert(errorMessage);
            return false;
        }
    }
    
    // 获取用户目标设定
    async getUserGoal(useCache = true) {
        if (!this.cloudSync.enabled || !this.cloudSync.username) {
            return null;
        }
        
        // 检查缓存
        const now = Date.now();
        if (useCache && this.dataCache.userGoal && (now - this.dataCache.cacheTime < this.dataCache.cacheTimeout)) {
            return this.dataCache.userGoal;
        }
        
        try {
            const UserGoals = AV.Object.extend('UserGoals');
            const query = new AV.Query(UserGoals);
            query.equalTo('username', this.cloudSync.username);
            
            const result = await query.first();
            let goalData = null;
            if (result) {
                goalData = {
                    id: result.id,
                    targetWeight: result.get('targetWeight'),
                    targetDate: result.get('targetDate'),
                    updatedAt: result.get('updatedAt')
                };
            }
            
            // 更新缓存
            this.dataCache.userGoal = goalData;
            this.dataCache.cacheTime = Date.now();
            
            return goalData;
        } catch (error) {
            // 如果是表不存在的错误（404），返回null而不是错误
            if (error.code === 101 || (error.message && error.message.includes('404'))) {
                console.log('💡 目标数据表尚未创建，将在首次设置目标时自动创建');
                // 缓存null结果
                this.dataCache.userGoal = null;
                this.dataCache.cacheTime = Date.now();
                return null;
            }
            console.error('获取目标数据失败:', error);
            return null;
        }
    }
    
    // 保存用户目标
    async saveUserGoal(goalData) {
        if (!this.cloudSync.enabled || !this.cloudSync.username) {
            alert('请先登录账户以保存目标数据');
            return false;
        }
        
        try {
            const UserGoals = AV.Object.extend('UserGoals');
            let goal;
            
            // 检查是否已有目标（处理表不存在的情况）
            try {
                const query = new AV.Query(UserGoals);
                query.equalTo('username', this.cloudSync.username);
                const existingGoal = await query.first();
                
                if (existingGoal) {
                    goal = existingGoal;
                } else {
                    goal = new UserGoals();
                    goal.set('username', this.cloudSync.username);
                }
            } catch (queryError) {
                // 如果查询失败（表不存在），直接创建新目标
                if (queryError.code === 101 || (queryError.message && queryError.message.includes('404'))) {
                    console.log('💡 首次创建目标数据表');
                    goal = new UserGoals();
                    goal.set('username', this.cloudSync.username);
                } else {
                    throw queryError; // 其他错误继续抛出
                }
            }
            
            goal.set('targetWeight', parseFloat(goalData.targetWeight));
            goal.set('targetDate', new Date(goalData.targetDate));
            // updatedAt 是 LeanCloud 的保留字段，会自动管理，不需要手动设置
            
            await goal.save();
            console.log('✅ 目标数据保存成功');
            
            // 首次保存成功后，表就被创建了
            if (!this.goalTableCreated) {
                console.log('🎉 目标数据表创建成功！');
                this.goalTableCreated = true;
            }
            
            // 清除目标数据缓存，下次查询时重新获取
            this.dataCache.userGoal = null;
            this.dataCache.cacheTime = 0;
            
            return true;
        } catch (error) {
            console.error('保存目标数据失败:', error);
            alert('保存失败，请稍后重试');
            return false;
        }
    }
    
    // 计算BMI
    calculateBMI(weight, height) {
        const heightInMeters = height / 100;
        return weight / (heightInMeters * heightInMeters);
    }
    
    // 获取BMI状态
    getBMIStatus(bmi) {
        if (bmi < 18.5) return { status: 'underweight', text: '偏瘦' };
        if (bmi < 25) return { status: 'normal', text: '正常' };
        if (bmi < 30) return { status: 'overweight', text: '超重' };
        return { status: 'obese', text: '肥胖' };
    }
    
    // 计算目标热量缺口
    async calculateTargetCalorieDeficit() {
        try {
            const healthInfo = await this.getUserHealthInfo(1);
            const goal = await this.getUserGoal();
            
            if (!healthInfo.length || !goal) {
                return this.targetCalorieDeficit; // 返回默认值
            }
            
            const currentWeight = healthInfo[0].weight;
            const targetWeight = goal.targetWeight;
            const targetDate = new Date(goal.targetDate);
            const today = new Date();
            
            // 如果已达到或低于目标体重，返回0
            if (currentWeight <= targetWeight) {
                return 0;
            }
            
            // 计算剩余天数
            const remainingDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
            
            if (remainingDays <= 0) {
                return this.targetCalorieDeficit; // 目标日期已过，返回默认值
            }
            
            // 计算所需总热量缺口 (1kg脂肪 ≈ 7700卡路里)
            const weightToLose = currentWeight - targetWeight;
            const totalCalorieDeficit = weightToLose * 7700;
            
            // 计算每日所需热量缺口
            const dailyCalorieDeficit = totalCalorieDeficit / remainingDays;
            
            return Math.round(dailyCalorieDeficit);
        } catch (error) {
            console.error('计算目标热量缺口时出错:', error);
            return this.targetCalorieDeficit; // 出错时返回默认值
        }
    }
    
    // 更新数据面板
    async updateDashboard() {
        try {
            // 批量获取数据以减少重复的 API 调用
            const [healthInfo, userGoal] = await Promise.all([
                this.getUserHealthInfo(1),
                this.getUserGoal()
            ]);
            
            await this.updateNutritionSummary();
            await this.updateCalorieProgress();
            this.updateWorkoutStats();
            await this.updateHealthInfoDisplay(healthInfo);
            await this.updateGoalDisplay(userGoal, healthInfo);
            await this.updateWeightTrend();
        } catch (error) {
            console.error('更新数据面板时出错:', error);
            // 不影响用户操作，静默处理
        }
    }
    
    // 更新营养摘要
    async updateNutritionSummary() {
        const calorieGapElement = document.getElementById('calorie-gap');
        const waterStatusElement = document.getElementById('water-status');
        
        if (calorieGapElement || waterStatusElement) {
            // 获取今日数据
            const dateStr = this.getDateString();
            const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
            const todayData = data[dateStr] || {};
            
            // 计算热量缺口
            const targetDeficit = await this.calculateTargetCalorieDeficit();
            const actualDeficit = this.calculateActualCalorieDeficit(todayData);
            
            if (calorieGapElement) {
                calorieGapElement.textContent = `${actualDeficit}/${targetDeficit} kcal`;
            }
            
            // 更新饮水状态
            if (waterStatusElement) {
                const currentWater = todayData.nutrition?.water || 0;
                const weeklyPlan = this.getCurrentWeeklyPlan();
                const today = this.getTodayWeekday();
                const targetWater = weeklyPlan[today]?.targetWater || 3.0;
                
                waterStatusElement.textContent = `${currentWater}L/${targetWater}L`;
            }
        }
    }
    
    // 计算实际热量缺口
    calculateActualCalorieDeficit(todayData) {
        if (!todayData.nutrition?.calories) return 0;
        
        // 计算基础消耗
        const activityLevel = todayData.activityLevel || 'moderately';
        const bmr = this.calculateBMR();
        const tdee = Math.round(bmr * (this.activityLevels[activityLevel]?.factor || 1.55));
        
        // 计算运动消耗
        let exerciseCalories = 0;
        const weeklyPlan = this.getCurrentWeeklyPlan();
        const today = this.getTodayWeekday();
        const plan = weeklyPlan[today];
        
        if (plan && todayData.exercises) {
            Object.keys(todayData.exercises).forEach(index => {
                if (todayData.exercises[index] === true && plan.exercises[index]) {
                    exerciseCalories += plan.exercises[index].calories;
                }
            });
        }
        
        // 总消耗 - 摄入 = 实际热量缺口
        const totalBurned = tdee + exerciseCalories;
        return Math.max(0, totalBurned - todayData.nutrition.calories);
    }
    
    // 更新卡路里进度
    async updateCalorieProgress() {
        const currentCaloriesElement = document.getElementById('current-calories');
        const recommendedCaloriesElement = document.getElementById('recommended-calories');
        const remainingCaloriesElement = document.getElementById('remaining-calories');
        const calorieProgressElement = document.getElementById('calorie-progress');
        
        if (!currentCaloriesElement) return;
        
        // 获取今日数据
        const dateStr = this.getDateString();
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        const todayData = data[dateStr] || {};
        
        const currentCalories = todayData.nutrition?.calories || 0;
        
        // 计算推荐摄入
        const bmr = this.calculateBMR();
        const activityLevel = todayData.activityLevel || 'moderately';
        const tdee = Math.round(bmr * (this.activityLevels[activityLevel]?.factor || 1.55));
        
        // 获取运动消耗
        let exerciseCalories = 0;
        const weeklyPlan = this.getCurrentWeeklyPlan();
        const today = this.getTodayWeekday();
        const plan = weeklyPlan[today];
        
        if (plan && todayData.exercises) {
            Object.keys(todayData.exercises).forEach(index => {
                if (todayData.exercises[index] === true && plan.exercises[index]) {
                    exerciseCalories += plan.exercises[index].calories;
                }
            });
        }
        
        // 计算推荐摄入 = 基础消耗 + 运动消耗 - 目标热量缺口
        const targetDeficit = await this.calculateTargetCalorieDeficit();
        const recommendedCalories = Math.max(1200, tdee + exerciseCalories - targetDeficit);
        const remainingCalories = Math.max(0, recommendedCalories - currentCalories);
        
        // 更新显示
        currentCaloriesElement.textContent = `${currentCalories} kcal`;
        if (recommendedCaloriesElement) {
            recommendedCaloriesElement.textContent = `${recommendedCalories} kcal`;
        }
        if (remainingCaloriesElement) {
            remainingCaloriesElement.textContent = `${remainingCalories} kcal`;
        }
        
        // 更新环形进度条
        if (calorieProgressElement) {
            const progressPercentage = Math.min(100, (currentCalories / recommendedCalories) * 100);
            const progressDegree = (progressPercentage / 100) * 360;
            
            const progressCircle = calorieProgressElement.querySelector('.progress-circle');
            if (progressCircle) {
                progressCircle.style.setProperty('--progress-degree', `${progressDegree}deg`);
            }
            
            // 更新中心文字
            const currentIntakeElement = calorieProgressElement.querySelector('.current-intake');
            const recommendedElement = calorieProgressElement.querySelector('.recommended');
            
            if (currentIntakeElement) currentIntakeElement.textContent = currentCalories;
            if (recommendedElement) recommendedElement.textContent = `/${recommendedCalories}`;
        }
    }
    
    // 更新运动统计
    updateWorkoutStats() {
        const totalDurationElement = document.getElementById('total-duration');
        const completedExercisesElement = document.getElementById('completed-exercises');
        const exerciseCaloriesElement = document.getElementById('exercise-calories');
        const workoutProgressElement = document.getElementById('workout-progress');
        
        if (!totalDurationElement) return;
        
        // 获取今日计划
        const weeklyPlan = this.getCurrentWeeklyPlan();
        const today = this.getTodayWeekday();
        const plan = weeklyPlan[today];
        
        if (!plan || !plan.exercises) {
            totalDurationElement.textContent = '0 分钟';
            if (completedExercisesElement) completedExercisesElement.textContent = '0/0 项';
            if (exerciseCaloriesElement) exerciseCaloriesElement.textContent = '0 kcal';
            return;
        }
        
        // 获取今日完成情况
        const dateStr = this.getDateString();
        const data = JSON.parse(localStorage.getItem('fitness-data') || '{}');
        const todayData = data[dateStr] || {};
        
        let totalDuration = 0;
        let totalCalories = 0;
        let completedCount = 0;
        const totalCount = plan.exercises.length;
        
        plan.exercises.forEach((exercise, index) => {
            const isCompleted = todayData.exercises && todayData.exercises[index] === true;
            
            if (isCompleted) {
                totalDuration += exercise.duration;
                totalCalories += exercise.calories;
                completedCount++;
            }
        });
        
        const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        // 更新显示
        totalDurationElement.textContent = `${totalDuration} 分钟`;
        if (completedExercisesElement) {
            completedExercisesElement.textContent = `${completedCount}/${totalCount} 项`;
        }
        if (exerciseCaloriesElement) {
            exerciseCaloriesElement.textContent = `${totalCalories} kcal`;
        }
        
        // 更新环形进度条
        if (workoutProgressElement) {
            const progressDegree = (completionRate / 100) * 360;
            const progressCircle = workoutProgressElement.querySelector('.progress-circle');
            if (progressCircle) {
                progressCircle.style.setProperty('--progress-degree', `${progressDegree}deg`);
            }
            
            const completionRateElement = workoutProgressElement.querySelector('.completion-rate');
            if (completionRateElement) {
                completionRateElement.textContent = `${completionRate}%`;
            }
        }
    }
    
    // 更新健康信息显示
    async updateHealthInfoDisplay(healthInfo = null) {
        const healthDisplay = document.getElementById('health-display');
        if (!healthDisplay) return;
        
        // 如果没有传入数据，则获取数据
        if (!healthInfo) {
            healthInfo = await this.getUserHealthInfo(1);
        }
        
        if (healthInfo.length === 0) {
            healthDisplay.innerHTML = '<div class="no-data">暂无健康数据，请点击录入</div>';
            return;
        }
        
        const latest = healthInfo[0];
        const bmi = this.calculateBMI(latest.weight, latest.height);
        const bmiStatus = this.getBMIStatus(bmi);
        
        // 计算BMI指针位置，根据不同区间映射到对应的百分比位置
        let bmiPercentage;
        if (bmi < 18.5) {
            // 偏瘦区间：0% - 23%
            bmiPercentage = Math.max(0, (bmi / 18.5) * 23);
        } else if (bmi < 25) {
            // 正常区间：23% - 62%
            bmiPercentage = 23 + ((bmi - 18.5) / (25 - 18.5)) * 39;
        } else if (bmi < 30) {
            // 超重区间：62% - 85%
            bmiPercentage = 62 + ((bmi - 25) / (30 - 25)) * 23;
        } else {
            // 肥胖区间：85% - 100%
            bmiPercentage = Math.min(100, 85 + ((bmi - 30) / 10) * 15);
        }
        
        healthDisplay.innerHTML = `
            <div class="health-info-container">
                <div class="health-info-grid">
                    <div class="health-item">
                        <div class="health-label">体重</div>
                        <div class="health-value">${latest.weight} <span class="health-unit">kg</span></div>
                    </div>
                    <div class="health-item">
                        <div class="health-label">身高</div>
                        <div class="health-value">${latest.height} <span class="health-unit">cm</span></div>
                    </div>
                    <div class="health-item">
                        <div class="health-label">BMI</div>
                        <div class="health-value">${bmi.toFixed(1)}</div>
                    </div>
                    <div class="health-item">
                        <div class="health-label">体脂率</div>
                        <div class="health-value">${latest.bodyFat ? latest.bodyFat + ' %' : '--'}</div>
                    </div>
                </div>
                <div class="bmi-indicator">
                    <div class="bmi-meter">
                        <div class="bmi-pointer" style="left: ${bmiPercentage}%"></div>
                    </div>
                    <div class="bmi-status ${bmiStatus.status}">${bmiStatus.text}</div>
                </div>
            </div>
        `;
    }
    
    // 更新目标显示
    async updateGoalDisplay(goal = null, healthInfo = null) {
        const goalDisplay = document.getElementById('goal-display');
        if (!goalDisplay) return;
        
        // 如果没有传入数据，则获取数据
        if (!goal) {
            goal = await this.getUserGoal();
        }
        if (!healthInfo) {
            healthInfo = await this.getUserHealthInfo(1);
        }
        
        if (!goal) {
            goalDisplay.innerHTML = '<div class="no-goal">未设置减重目标</div>';
            return;
        }
        
        const currentWeight = healthInfo.length > 0 ? healthInfo[0].weight : 0;
        const targetWeight = goal.targetWeight;
        const targetDate = new Date(goal.targetDate);
        const today = new Date();
        
        // 计算剩余天数
        const remainingDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        
        goalDisplay.innerHTML = `
            <div class="goal-info">
                <div class="goal-item">
                    <div class="goal-label">目标体重</div>
                    <div class="goal-value">${targetWeight} kg</div>
                </div>
                <div class="goal-item">
                    <div class="goal-label">目标日期</div>
                    <div class="goal-value">${targetDate.toLocaleDateString()}</div>
                </div>
                <div class="goal-item">
                    <div class="goal-label">剩余天数</div>
                    <div class="goal-value">${Math.max(0, remainingDays)} 天</div>
                </div>
            </div>
        `;
    }
    
    // 初始化数据面板事件监听
    initDashboardListeners() {
        // 健康数据录入
        const addHealthInfoBtn = document.getElementById('add-health-info-btn');
        const healthForm = document.getElementById('health-form');
        const saveHealthBtn = document.getElementById('save-health-btn');
        const cancelHealthBtn = document.getElementById('cancel-health-btn');
        
        if (addHealthInfoBtn) {
            addHealthInfoBtn.addEventListener('click', () => {
                healthForm.style.display = healthForm.style.display === 'none' ? 'block' : 'none';
            });
        }
        
        if (saveHealthBtn) {
            saveHealthBtn.addEventListener('click', async () => {
                const weight = document.getElementById('weight-input').value;
                const height = document.getElementById('height-input').value;
                const bodyFat = document.getElementById('body-fat-input').value;
                
                if (!weight || !height) {
                    alert('请填写体重和身高（体脂率为可选项）');
                    return;
                }
                
                const healthData = { weight, height };
                // 体脂率为可选项
                if (bodyFat) {
                    healthData.bodyFat = bodyFat;
                }
                
                const success = await this.saveHealthInfo(healthData);
                if (success) {
                    healthForm.style.display = 'none';
                    await this.updateDashboard();
                    
                    // 清空表单
                    document.getElementById('weight-input').value = '';
                    document.getElementById('height-input').value = '';
                    document.getElementById('body-fat-input').value = '';
                }
            });
        }
        
        if (cancelHealthBtn) {
            cancelHealthBtn.addEventListener('click', () => {
                healthForm.style.display = 'none';
            });
        }
        
        // 目标设定
        const setGoalBtn = document.getElementById('set-goal-btn');
        const goalForm = document.getElementById('goal-form');
        const saveGoalBtn = document.getElementById('save-goal-btn');
        const cancelGoalBtn = document.getElementById('cancel-goal-btn');
        
        if (setGoalBtn) {
            setGoalBtn.addEventListener('click', () => {
                goalForm.style.display = goalForm.style.display === 'none' ? 'block' : 'none';
            });
        }
        
        if (saveGoalBtn) {
            saveGoalBtn.addEventListener('click', async () => {
                const targetWeight = document.getElementById('target-weight-input').value;
                const targetDate = document.getElementById('target-date-input').value;
                
                if (!targetWeight || !targetDate) {
                    alert('请填写完整的目标信息');
                    return;
                }
                
                const success = await this.saveUserGoal({ targetWeight, targetDate });
                if (success) {
                    goalForm.style.display = 'none';
                    await this.updateDashboard();
                    
                    // 清空表单
                    document.getElementById('target-weight-input').value = '';
                    document.getElementById('target-date-input').value = '';
                }
            });
        }
        
        if (cancelGoalBtn) {
            cancelGoalBtn.addEventListener('click', () => {
                goalForm.style.display = 'none';
            });
        }
        
        // 体重趋势图切换
        const trendBtns = document.querySelectorAll('.trend-btn');
        trendBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                trendBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const period = btn.dataset.period;
                await this.updateWeightTrend(period);
            });
        });
        
        // 健康记录管理
        const viewRecordsBtn = document.getElementById('view-health-records-btn');
        console.log('🔍 查看记录按钮:', viewRecordsBtn ? '找到' : '未找到');
        
        const recordsModal = document.getElementById('health-records-modal');
        console.log('🔍 记录模态框:', recordsModal ? '找到' : '未找到');
        
        const closeModalBtn = document.getElementById('close-health-records-modal');
        const addNewRecordBtn = document.getElementById('add-new-health-record');
        const editForm = document.getElementById('edit-health-record-form');
        const saveEditBtn = document.getElementById('save-edit-record');
        const cancelEditBtn = document.getElementById('cancel-edit-record');
        const deleteRecordBtn = document.getElementById('delete-record');
        
        if (viewRecordsBtn) {
            console.log('✅ 添加查看记录按钮事件监听器');
            viewRecordsBtn.addEventListener('click', (e) => {
                console.log('📝 查看记录按钮被点击');
                e.preventDefault();
                this.showHealthRecordsModal();
            });
        } else {
            console.warn('⚠️ 未找到查看记录按钮，ID: view-health-records-btn');
        }
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.hideHealthRecordsModal();
            });
        }
        
        if (recordsModal) {
            recordsModal.addEventListener('click', (e) => {
                if (e.target === recordsModal) {
                    this.hideHealthRecordsModal();
                }
            });
        }
        
        if (addNewRecordBtn) {
            addNewRecordBtn.addEventListener('click', () => {
                this.showEditRecordForm(true);
            });
        }
        
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', async () => {
                await this.saveEditedRecord();
            });
        }
        
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.hideEditRecordForm();
            });
        }
        
        if (deleteRecordBtn) {
            deleteRecordBtn.addEventListener('click', async () => {
                await this.deleteHealthRecord();
            });
        }
    }
    
    // 准备年度数据（按月）
    prepareYearlyData(healthData, currentYear) {
        const months = [
            '1月', '2月', '3月', '4月', '5月', '6月',
            '7月', '8月', '9月', '10月', '11月', '12月'
        ];
        
        const weights = new Array(12).fill(null);
        
        // 按月分组数据，取每月最后一次记录
        healthData.forEach(record => {
            const recordDate = new Date(record.recordDate);
            if (recordDate.getFullYear() === currentYear.getFullYear()) {
                const month = recordDate.getMonth(); // 0-11
                weights[month] = record.weight; // 后面的记录会覆盖前面的
            }
        });
        
        return {
            labels: months,
            weights: weights
        };
    }
    
    // 准备指定期间数据
    preparePeriodData(healthData, period, now) {
        const periodDays = parseInt(period);
        const labels = [];
        const weights = [];
        
        // 生成日期标签
        for (let i = periodDays - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            labels.push(date.toLocaleDateString('zh-CN', { 
                month: 'short', 
                day: 'numeric' 
            }));
        }
        
        // 初始化权重数组
        weights.fill(null, 0, labels.length);
        
        // 填入实际数据
        healthData.forEach(record => {
            const recordDate = new Date(record.recordDate);
            const daysDiff = Math.floor((now - recordDate) / (24 * 60 * 60 * 1000));
            
            if (daysDiff >= 0 && daysDiff < periodDays) {
                const index = periodDays - 1 - daysDiff;
                weights[index] = record.weight;
            }
        });
        
        return {
            labels: labels,
            weights: weights
        };
    }
    
    // 获取图表标题
    getChartTitle(period) {
        switch (period) {
            case '365':
            case 'all':
                return '体重趋势 (年视图)';
            case '90':
                return '体重趋势 (季度)';
            case '30':
                return '体重趋势 (月视图)';
            case '7':
                return '体重趋势 (周视图)';
            default:
                return `体重趋势 (${period}天)`;
        }
    }
    
    // 更新体重趋势图
    async updateWeightTrend(period = '30') {
        const canvas = document.getElementById('weight-trend-chart');
        if (!canvas) return;
        
        try {
            // 获取健康数据和目标体重
            const healthData = await this.getUserHealthInfo(1000); // 获取足够多的数据
            const userGoal = await this.getUserGoal();
            
            console.log('🎯 开始创建体重趋势图...');
            console.log('📊 原始健康数据条数:', healthData.length);
            console.log('📊 时间段:', period);
            
            // 销毁现有图表
            if (this.weightChart) {
                this.weightChart.destroy();
            }
            
            let chartData;
            const now = new Date();
            
            if (period === '365' || period === 'all') {
                // 年视图：按月显示
                chartData = this.prepareYearlyData(healthData, now);
            } else {
                // 月/周/日视图：按指定期间显示
                chartData = this.preparePeriodData(healthData, period, now);
            }
            
            const chartLabels = chartData.labels;
            const weights = chartData.weights;
            const hasData = weights.some(w => w !== null);
            
            console.log('📊 图表标签:', chartLabels);
            console.log('📊 权重数据:', weights);
            console.log('📊 是否有数据:', hasData);
            
            // 设置目标体重
            let targetWeight = 48.0; // 默认目标
            if (userGoal && userGoal.targetWeight) {
                targetWeight = userGoal.targetWeight;
            }
            
            console.log('🎯 目标体重:', targetWeight, 'kg');
                const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
                filteredData = sortedData.filter(item => new Date(item.recordDate) >= cutoffDate);
            }
            
            if (filteredData.length === 0) {
                this.showEmptyChart(canvas, `最近${period}天无数据`);
                return;
            }
            
            // 准备Chart.js数据
            const labels = filteredData.map(item => {
                const date = new Date(item.recordDate);
                return date.toLocaleDateString('zh-CN', { 
                    month: 'short', 
                    day: 'numeric' 
                });
            });
            
            const weights = filteredData.map(item => item.weight);
            
            // 获取目标体重数据
            const userGoal = await this.getUserGoal();
            
            // 销毁现有图表
            if (this.weightChart) {
                this.weightChart.destroy();
            }
            
            // 创建渐变色
            const canvas2d = canvas.getContext('2d');
            const gradient = canvas2d.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(52, 168, 83, 0.6)');
            gradient.addColorStop(0.5, 'rgba(52, 168, 83, 0.3)');
            gradient.addColorStop(1, 'rgba(52, 168, 83, 0.05)');
            
            // 准备数据集
            const datasets = [{
                label: '体重',
                data: weights,
                borderColor: '#34a853',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#34a853',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointHoverBorderWidth: 3
            }];
            
            // 强制添加目标体重参考线
            let targetWeight = 50.0; // 默认目标体重
            console.log('🎯 开始创建目标体重线...');
            console.log('🎯 获取用户目标:', userGoal);
            
            if (userGoal && userGoal.targetWeight) {
                targetWeight = userGoal.targetWeight;
                console.log('📊 使用用户设置的目标体重:', targetWeight, 'kg');
            } else {
                console.log('📊 使用默认目标体重:', targetWeight, 'kg');
            }
            
            console.log('📊 图表标签数量:', labels.length);
            console.log('📊 图表标签内容:', labels);
            
            if (labels.length === 0) {
                console.warn('⚠️ 没有数据点，无法创建目标线');
            } else {
                const targetData = new Array(labels.length).fill(targetWeight);
                console.log('📊 目标数据数组:', targetData);
                console.log('📊 目标数据数组长度:', targetData.length);
                
                const targetDataset = {
                    label: '目标体重',
                    data: targetData,
                    borderColor: '#ff6b6b', // 红色虚线
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    borderDash: [10, 5], // 虚线样式
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    tension: 0,
                    order: 1 // 确保目标线在前面绘制
                };
                
                console.log('📊 目标数据集配置:', targetDataset);
                datasets.push(targetDataset);
                console.log('✅ 目标体重线强制添加完成，数据集总数:', datasets.length);
                console.log('📊 所有数据集:', datasets);
            }
            
            // 创建新图表
            const ctx = canvas2d;
            
            // 检查Chart.js是否可用
            if (typeof Chart === 'undefined') {
                console.error('❌ Chart.js 库未加载');
                throw new Error('Chart.js 库未加载');
            }
            
            console.log('📊 Chart.js版本:', Chart.version);
            console.log('📊 开始创建图表，数据集:', datasets);
            
            this.weightChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: '体重',
                            data: weights,
                            borderColor: '#34a853',
                            backgroundColor: gradient,
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#34a853',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            pointHoverBorderWidth: 3
                        },
                        {
                            label: '目标体重',
                            data: new Array(labels.length).fill(targetWeight),
                            borderColor: '#FF0000',
                            backgroundColor: 'rgba(0,0,0,0)',
                            borderWidth: 4,
                            fill: false,
                            pointRadius: 0,
                            pointHoverRadius: 0,
                            tension: 0,
                            type: 'line',
                            order: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false  // 隐藏图例，只显示指示线
                        },
                        title: {
                            display: true,
                            text: `体重趋势 (${period === 'all' ? '全部' : period + '天'})`,
                            font: {
                                size: 14
                            },
                            color: '#333'
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#333',
                            bodyColor: '#666',
                            borderColor: '#ddd',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    const datasetLabel = context.dataset.label;
                                    const value = context.parsed.y;
                                    if (datasetLabel === '目标') {
                                        return `🎯 目标体重: ${value}kg`;
                                    }
                                    return `⚖️ 体重: ${value}kg`;
                                },
                                afterLabel: function(context) {
                                    if (context.dataset.label === '体重') {
                                        const dataIndex = context.dataIndex;
                                        const data = filteredData[dataIndex];
                                        const afterLabels = [];
                                        
                                        if (data.bodyFat) {
                                            afterLabels.push(`📊 体脂率: ${data.bodyFat}%`);
                                        }
                                        
                                        // 计算BMI
                                        const bmi = (data.weight / Math.pow(data.height / 100, 2)).toFixed(1);
                                        afterLabels.push(`📈 BMI: ${bmi}`);
                                        
                                        return afterLabels;
                                    }
                                    return '';
                                },
                                title: function(context) {
                                    const dataIndex = context[0].dataIndex;
                                    const data = filteredData[dataIndex];
                                    const date = new Date(data.recordDate);
                                    return date.toLocaleDateString('zh-CN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    });
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: '日期'
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: '体重 (kg)'
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            beginAtZero: false,
                            // 动态调整Y轴范围，强制包含目标体重
                            min: function(context) {
                                const minWeight = Math.min(...weights);
                                // 强制包含目标体重
                                const min = Math.min(minWeight, targetWeight);
                                return Math.max(0, min - 5);
                            },
                            max: function(context) {
                                const maxWeight = Math.max(...weights);
                                // 强制包含目标体重
                                const max = Math.max(maxWeight, targetWeight);
                                return max + 5;
                            }
                        }
                    },
                    elements: {
                        point: {
                            hitRadius: 8
                        }
                    }
                }
            });
            
            // 图表创建完成后的调试信息
            console.log(`✅ 体重趋势图创建完成`);
            console.log(`📊 图表实际数据集数量:`, this.weightChart.data.datasets.length);
            
            // 详细检查每个数据集
            this.weightChart.data.datasets.forEach((dataset, index) => {
                console.log(`📊 数据集 ${index}:`, {
                    label: dataset.label,
                    dataLength: dataset.data.length,
                    borderColor: dataset.borderColor,
                    borderWidth: dataset.borderWidth,
                    data: dataset.data.slice(0, 3) // 只显示前3个数据点
                });
            });
            
            console.log(`📊 目标体重值: ${targetWeight}kg`);
            console.log(`📊 Canvas尺寸: ${canvas.width} x ${canvas.height}`);
            
            // 强制重绘图表
            this.weightChart.update();
            console.log(`🔄 图表更新完成`);
            
            console.log(`✅ 体重趋势图更新完成 (${filteredData.length}条数据)`);
            
        } catch (error) {
            console.error('更新体重趋势图失败:', error);
            console.error('错误详情:', error.stack);
            this.showEmptyChart(canvas, '加载图表失败');
        }
    }
    
    // 显示空图表
    showEmptyChart(canvas, message) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
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
    
    // ==================== 健康记录管理方法 ====================
    
    // 显示健康记录模态框
    async showHealthRecordsModal() {
        console.log('🔍 尝试显示健康记录模态框');
        
        // 等待一下确保DOM完全加载
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const modal = document.getElementById('health-records-modal');
        console.log('🔍 查找模态框元素:', modal);
        console.log('🔍 页面中所有带有modal的元素:', document.querySelectorAll('[id*="modal"]'));
        
        if (!modal) {
            console.error('❌ 未找到健康记录模态框元素，ID: health-records-modal');
            
            // 尝试查找其他可能的选择器
            const allModals = document.querySelectorAll('.modal');
            console.log('🔍 页面中所有.modal元素:', allModals);
            
            // 临时创建一个简单的模态框
            this.createTemporaryModal();
            return;
        }
        
        console.log('✅ 找到模态框，显示中...');
        modal.style.display = 'flex';
        await this.loadHealthRecordsList();
    }
    
    // 创建临时模态框（如果找不到原始模态框）
    createTemporaryModal() {
        console.log('📝 创建临时模态框');
        
        // 移除可能存在的临时模态框
        const existingTempModal = document.getElementById('temp-health-modal');
        if (existingTempModal) {
            existingTempModal.remove();
        }
        
        // 创建临时模态框
        const modalHTML = `
            <div id="temp-health-modal" style="
                position: fixed; 
                top: 0; left: 0; 
                width: 100%; height: 100%; 
                background-color: rgba(0,0,0,0.5); 
                z-index: 1000; 
                display: flex; 
                justify-content: center; 
                align-items: center;
            ">
                <div style="
                    background: white; 
                    border-radius: 12px; 
                    padding: 24px; 
                    max-width: 600px; 
                    width: 90%; 
                    max-height: 80vh; 
                    overflow-y: auto;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;">健康记录管理</h3>
                        <button id="close-temp-modal" style="
                            background: none; 
                            border: none; 
                            font-size: 24px; 
                            cursor: pointer;
                        ">×</button>
                    </div>
                    <div id="temp-records-list">
                        <div style="text-align: center; padding: 40px;">加载中...</div>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button id="temp-add-record" style="
                            background: #007bff; 
                            color: white; 
                            border: none; 
                            padding: 10px 20px; 
                            border-radius: 6px; 
                            cursor: pointer;
                        ">添加新记录</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 添加事件监听器
        const tempModal = document.getElementById('temp-health-modal');
        const closeBtn = document.getElementById('close-temp-modal');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                tempModal.remove();
            });
        }
        
        if (tempModal) {
            tempModal.addEventListener('click', (e) => {
                if (e.target === tempModal) {
                    tempModal.remove();
                }
            });
        }
        
        // 加载记录列表
        this.loadTempHealthRecordsList();
    }
    
    // 为临时模态框加载记录列表
    async loadTempHealthRecordsList() {
        const recordsList = document.getElementById('temp-records-list');
        if (!recordsList) return;
        
        try {
            // 获取健康记录
            const healthRecords = await this.getUserHealthInfo(20);
            
            if (healthRecords.length === 0) {
                recordsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">暂无健康记录</div>';
                return;
            }
            
            // 生成记录列表
            const recordsHtml = healthRecords.map(record => {
                const date = new Date(record.recordDate);
                const formattedDate = date.toLocaleDateString('zh-CN');
                const bmi = this.calculateBMI(record.weight, record.height);
                const bodyFat = record.bodyFat ? `${record.bodyFat}%` : '--';
                
                return `
                    <div style="
                        background: #f8f9fa; 
                        padding: 16px; 
                        margin: 12px 0; 
                        border-radius: 8px; 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center;
                    ">
                        <div>
                            <div style="font-size: 14px; color: #666; margin-bottom: 4px;">${formattedDate}</div>
                            <div style="display: flex; gap: 16px; font-size: 13px;">
                                <span>体重: <strong>${record.weight}kg</strong></span>
                                <span>身高: <strong>${record.height}cm</strong></span>
                                <span>BMI: <strong>${bmi.toFixed(1)}</strong></span>
                                <span>体脂: <strong>${bodyFat}</strong></span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="temp-edit-btn" data-record-id="${record.id}" style="
                                background: #28a745; 
                                color: white; 
                                border: none; 
                                padding: 6px 12px; 
                                border-radius: 4px; 
                                cursor: pointer;
                                font-size: 12px;
                            ">编辑</button>
                            <button class="temp-delete-btn" data-record-id="${record.id}" style="
                                background: #dc3545; 
                                color: white; 
                                border: none; 
                                padding: 6px 12px; 
                                border-radius: 4px; 
                                cursor: pointer;
                                font-size: 12px;
                            ">删除</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            recordsList.innerHTML = recordsHtml;
            
            // 添加编辑和删除按钮的事件监听器
            this.addTempRecordEventListeners(healthRecords);
            
        } catch (error) {
            console.error('加载健康记录失败:', error);
            recordsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">加载记录失败</div>';
        }
    }
    
    // 为临时模态框添加编辑删除事件监听器
    addTempRecordEventListeners(healthRecords) {
        // 编辑按钮
        document.querySelectorAll('.temp-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const recordId = e.target.dataset.recordId;
                const record = healthRecords.find(r => r.id === recordId);
                if (record) {
                    this.showTempEditForm(record);
                }
            });
        });
        
        // 删除按钮
        document.querySelectorAll('.temp-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const recordId = e.target.dataset.recordId;
                const record = healthRecords.find(r => r.id === recordId);
                if (record) {
                    const confirmed = confirm(`确定要删除 ${new Date(record.recordDate).toLocaleDateString('zh-CN')} 的健康记录吗？`);
                    if (confirmed) {
                        await this.deleteTempRecord(recordId);
                    }
                }
            });
        });
    }
    
    // 显示临时编辑表单
    showTempEditForm(record) {
        const tempModal = document.getElementById('temp-health-modal');
        if (!tempModal) return;
        
        const date = new Date(record.recordDate);
        const formattedDate = date.toISOString().split('T')[0];
        
        const editFormHTML = `
            <div id="temp-edit-form" style="
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: white;
                padding: 24px;
                overflow-y: auto;
            ">
                <h3 style="margin: 0 0 20px 0;">编辑健康记录</h3>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 500;">体重 (kg):</label>
                    <input id="temp-edit-weight" type="number" step="0.1" value="${record.weight}" style="
                        width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;
                    ">
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 500;">身高 (cm):</label>
                    <input id="temp-edit-height" type="number" value="${record.height}" style="
                        width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;
                    ">
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 500;">体脂率 (%) - 可选:</label>
                    <input id="temp-edit-bodyfat" type="number" step="0.1" value="${record.bodyFat || ''}" style="
                        width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;
                    ">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 500;">记录日期:</label>
                    <input id="temp-edit-date" type="date" value="${formattedDate}" style="
                        width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;
                    ">
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button id="temp-save-edit" data-record-id="${record.id}" style="
                        background: #28a745; color: white; border: none; 
                        padding: 12px 24px; border-radius: 6px; cursor: pointer;
                    ">保存修改</button>
                    <button id="temp-cancel-edit" style="
                        background: #6c757d; color: white; border: none; 
                        padding: 12px 24px; border-radius: 6px; cursor: pointer;
                    ">取消</button>
                    <button id="temp-delete-record" data-record-id="${record.id}" style="
                        background: #dc3545; color: white; border: none; 
                        padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-left: auto;
                    ">删除记录</button>
                </div>
            </div>
        `;
        
        const modalContent = tempModal.querySelector('div > div');
        modalContent.insertAdjacentHTML('beforeend', editFormHTML);
        
        // 添加按钮事件监听器
        document.getElementById('temp-save-edit').addEventListener('click', async (e) => {
            await this.saveTempEditRecord(e.target.dataset.recordId);
        });
        
        document.getElementById('temp-cancel-edit').addEventListener('click', () => {
            document.getElementById('temp-edit-form').remove();
        });
        
        document.getElementById('temp-delete-record').addEventListener('click', async (e) => {
            const confirmed = confirm('确定要删除这条健康记录吗？删除后无法恢复。');
            if (confirmed) {
                await this.deleteTempRecord(e.target.dataset.recordId);
                document.getElementById('temp-edit-form').remove();
            }
        });
    }
    
    // 保存临时编辑的记录
    async saveTempEditRecord(recordId) {
        const weight = parseFloat(document.getElementById('temp-edit-weight').value);
        const height = parseInt(document.getElementById('temp-edit-height').value);
        const bodyFat = document.getElementById('temp-edit-bodyfat').value ? parseFloat(document.getElementById('temp-edit-bodyfat').value) : null;
        const recordDate = new Date(document.getElementById('temp-edit-date').value);
        
        if (!weight || !height || isNaN(weight) || isNaN(height)) {
            alert('请填写有效的体重和身高');
            return;
        }
        
        try {
            await this.updateHealthRecord(recordId, {
                weight,
                height,
                bodyFat,
                recordDate
            });
            
            // 关闭编辑表单并刷新列表
            document.getElementById('temp-edit-form').remove();
            await this.loadTempHealthRecordsList();
            
            // 更新主面板
            await this.updateDashboard();
            await this.updateWeightTrend();
            
            alert('记录更新成功！');
            
        } catch (error) {
            console.error('保存记录失败:', error);
            alert('保存失败，请稍后重试');
        }
    }
    
    // 删除临时记录
    async deleteTempRecord(recordId) {
        try {
            const UserHealthInfo = AV.Object.extend('UserHealthInfo');
            const record = new UserHealthInfo();
            record.id = recordId;
            
            await record.destroy();
            console.log('✅ 健康记录删除成功');
            
            // 清除缓存
            this.healthInfoCache = null;
            this.healthInfoCacheTime = 0;
            
            // 刷新列表和主面板
            await this.loadTempHealthRecordsList();
            await this.updateDashboard();
            await this.updateWeightTrend();
            
            alert('记录删除成功！');
            
        } catch (error) {
            console.error('删除记录失败:', error);
            alert('删除失败，请稍后重试');
        }
    }
    
    // 隐藏健康记录模态框
    hideHealthRecordsModal() {
        const modal = document.getElementById('health-records-modal');
        const editForm = document.getElementById('edit-health-record-form');
        
        if (modal) {
            modal.style.display = 'none';
        }
        if (editForm) {
            editForm.style.display = 'none';
        }
        
        this.editingRecordId = null;
    }
    
    // 加载健康记录列表
    async loadHealthRecordsList() {
        const recordsList = document.getElementById('health-records-list');
        if (!recordsList) return;
        
        recordsList.innerHTML = '<div class="loading">加载中...</div>';
        
        try {
            // 获取所有健康记录
            this.allHealthRecords = await this.getUserHealthInfo(100); // 获取最近100条
            
            if (this.allHealthRecords.length === 0) {
                recordsList.innerHTML = '<div class="no-records">暂无健康记录</div>';
                return;
            }
            
            // 按日期排序（最新的在前面）
            this.allHealthRecords.sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));
            
            // 生成记录列表HTML
            const recordsHtml = this.allHealthRecords.map((record, index) => {
                const date = new Date(record.recordDate);
                const formattedDate = date.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
                
                const bmi = this.calculateBMI(record.weight, record.height);
                const bodyFatDisplay = record.bodyFat ? `${record.bodyFat}%` : '--';
                
                return `
                    <div class="record-item" data-record-id="${record.id}" data-index="${index}">
                        <div class="record-info">
                            <div class="record-date">${formattedDate}</div>
                            <div class="record-data">
                                <div class="data-item">
                                    <span class="label">体重:</span>
                                    <span class="value">${record.weight}kg</span>
                                </div>
                                <div class="data-item">
                                    <span class="label">身高:</span>
                                    <span class="value">${record.height}cm</span>
                                </div>
                                <div class="data-item">
                                    <span class="label">BMI:</span>
                                    <span class="value">${bmi.toFixed(1)}</span>
                                </div>
                                <div class="data-item">
                                    <span class="label">体脂:</span>
                                    <span class="value">${bodyFatDisplay}</span>
                                </div>
                            </div>
                        </div>
                        <div class="record-actions">
                            <button class="btn-small btn-outline edit-record-btn" data-record-id="${record.id}" data-index="${index}">编辑</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            recordsList.innerHTML = recordsHtml;
            
            // 添加编辑按钮事件监听
            recordsList.querySelectorAll('.edit-record-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    const recordId = e.target.dataset.recordId;
                    this.editHealthRecord(recordId, index);
                });
            });
            
        } catch (error) {
            console.error('加载健康记录失败:', error);
            recordsList.innerHTML = '<div class="no-records">加载记录失败</div>';
        }
    }
    
    // 编辑健康记录
    editHealthRecord(recordId, index) {
        const record = this.allHealthRecords[index];
        if (!record) return;
        
        this.editingRecordId = recordId;
        
        // 填充编辑表单
        const weightInput = document.getElementById('edit-weight-input');
        const heightInput = document.getElementById('edit-height-input');
        const bodyFatInput = document.getElementById('edit-body-fat-input');
        const dateInput = document.getElementById('edit-record-date-input');
        const formTitle = document.getElementById('edit-form-title');
        
        if (weightInput) weightInput.value = record.weight;
        if (heightInput) heightInput.value = record.height;
        if (bodyFatInput) bodyFatInput.value = record.bodyFat || '';
        if (dateInput) {
            const date = new Date(record.recordDate);
            dateInput.value = date.toISOString().split('T')[0];
        }
        if (formTitle) formTitle.textContent = '编辑健康记录';
        
        this.showEditRecordForm();
    }
    
    // 显示编辑记录表单
    showEditRecordForm(isNew = false) {
        const editForm = document.getElementById('edit-health-record-form');
        const formTitle = document.getElementById('edit-form-title');
        const deleteBtn = document.getElementById('delete-record');
        
        if (editForm) {
            editForm.style.display = 'block';
        }
        
        if (isNew) {
            this.editingRecordId = null;
            if (formTitle) formTitle.textContent = '添加新记录';
            if (deleteBtn) deleteBtn.style.display = 'none';
            
            // 清空表单
            const inputs = editForm.querySelectorAll('input');
            inputs.forEach(input => {
                if (input.type === 'date') {
                    input.value = new Date().toISOString().split('T')[0];
                } else {
                    input.value = '';
                }
            });
        } else {
            if (deleteBtn) deleteBtn.style.display = 'inline-block';
        }
    }
    
    // 隐藏编辑记录表单
    hideEditRecordForm() {
        const editForm = document.getElementById('edit-health-record-form');
        if (editForm) {
            editForm.style.display = 'none';
        }
        this.editingRecordId = null;
    }
    
    // 保存编辑的记录
    async saveEditedRecord() {
        const weightInput = document.getElementById('edit-weight-input');
        const heightInput = document.getElementById('edit-height-input');
        const bodyFatInput = document.getElementById('edit-body-fat-input');
        const dateInput = document.getElementById('edit-record-date-input');
        
        if (!weightInput || !heightInput || !dateInput) return;
        
        const weight = parseFloat(weightInput.value);
        const height = parseInt(heightInput.value);
        const bodyFat = bodyFatInput.value ? parseFloat(bodyFatInput.value) : null;
        const recordDate = new Date(dateInput.value);
        
        if (!weight || !height || isNaN(weight) || isNaN(height)) {
            alert('请填写有效的体重和身高');
            return;
        }
        
        try {
            if (this.editingRecordId) {
                // 更新现有记录
                await this.updateHealthRecord(this.editingRecordId, {
                    weight,
                    height,
                    bodyFat,
                    recordDate
                });
            } else {
                // 创建新记录
                await this.saveHealthInfo({
                    weight: weight.toString(),
                    height: height.toString(),
                    bodyFat: bodyFat ? bodyFat.toString() : ''
                });
            }
            
            // 刷新记录列表和数据面板
            await this.loadHealthRecordsList();
            await this.updateDashboard();
            await this.updateWeightTrend();
            this.hideEditRecordForm();
            
        } catch (error) {
            console.error('保存记录失败:', error);
            alert('保存失败，请稍后重试');
        }
    }
    
    // 更新健康记录
    async updateHealthRecord(recordId, data) {
        if (!this.cloudSync.enabled || !this.cloudSync.username) {
            throw new Error('请先登录账户');
        }
        
        try {
            const UserHealthInfo = AV.Object.extend('UserHealthInfo');
            const record = new UserHealthInfo();
            record.id = recordId;
            
            record.set('weight', data.weight);
            record.set('height', data.height);
            if (data.bodyFat) {
                record.set('bodyFat', data.bodyFat);
            }
            record.set('recordDate', data.recordDate);
            
            await record.save();
            console.log('✅ 健康记录更新成功');
            
            // 清除缓存
            this.healthInfoCache = null;
            this.healthInfoCacheTime = 0;
            
        } catch (error) {
            console.error('更新健康记录失败:', error);
            throw error;
        }
    }
    
    // 删除健康记录
    async deleteHealthRecord() {
        if (!this.editingRecordId) return;
        
        const confirmed = confirm('确定要删除这条健康记录吗？删除后无法恢复。');
        if (!confirmed) return;
        
        try {
            if (!this.cloudSync.enabled || !this.cloudSync.username) {
                throw new Error('请先登录账户');
            }
            
            const UserHealthInfo = AV.Object.extend('UserHealthInfo');
            const record = new UserHealthInfo();
            record.id = this.editingRecordId;
            
            await record.destroy();
            console.log('✅ 健康记录删除成功');
            
            // 清除缓存
            this.healthInfoCache = null;
            this.healthInfoCacheTime = 0;
            
            // 刷新记录列表和数据面板
            await this.loadHealthRecordsList();
            await this.updateDashboard();
            await this.updateWeightTrend();
            this.hideEditRecordForm();
            
        } catch (error) {
            console.error('删除健康记录失败:', error);
            alert('删除失败，请稍后重试');
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