// Codeforces数据处理
const handle = 'PeaceRocket'; // 使用你的Codeforces用户名

// 获取用户基本信息
function getUserInfo() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://codeforces.com/api/user.info?handles=${handle}&jsonp=userInfoCallback`;
        window.userInfoCallback = (data) => {
            if (data.status === 'OK') {
                resolve(data.result[0]);
            } else {
                reject(new Error(data.comment || '获取用户信息失败'));
            }
            document.head.removeChild(script);
            delete window.userInfoCallback;
        };
        script.onerror = () => reject(new Error('用户信息请求失败'));
        document.head.appendChild(script);
    });
}

// 获取用户Rating历史
function getUserRating() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://codeforces.com/api/user.rating?handle=${handle}&jsonp=userRatingCallback`;
        window.userRatingCallback = (data) => {
            if (data.status === 'OK') {
                resolve(data.result);
            } else {
                reject(new Error(data.comment || '获取Rating历史失败'));
            }
            document.head.removeChild(script);
            delete window.userRatingCallback;
        };
        script.onerror = () => reject(new Error('Rating历史请求失败'));
        document.head.appendChild(script);
    });
}

// 获取用户提交记录
function getUserStatus() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://codeforces.com/api/user.status?handle=${handle}&jsonp=userStatusCallback`;
        window.userStatusCallback = (data) => {
            if (data.status === 'OK') {
                resolve(data.result);
            } else {
                reject(new Error(data.comment || '获取提交记录失败'));
            }
            document.head.removeChild(script);
            delete window.userStatusCallback;
        };
        script.onerror = () => reject(new Error('提交记录请求失败'));
        document.head.appendChild(script);
    });
}

// 更新用户信息显示
function updateUserInfo(user) {
    document.getElementById('currentRating').textContent = user.rating || '未参与比赛';
    document.getElementById('maxRating').textContent = user.maxRating || '未参与比赛';
    document.getElementById('contribution').textContent = user.contribution || '0';
    document.getElementById('rank').textContent = user.rank || '未评级';
}

// 创建Rating变化图表
function createRatingChart(ratingHistory) {
    const ctx = document.getElementById('ratingChart').getContext('2d');
    
    // 提取比赛名称和Rating数据
    const contests = ratingHistory.map(entry => 
        entry.contestName.length > 15 
            ? entry.contestName.substring(0, 15) + '...' 
            : entry.contestName
    );
    const ratings = ratingHistory.map(entry => entry.newRating);
    const ratingChanges = ratingHistory.map(entry => entry.newRating - entry.oldRating);
    
    // 确定颜色：绿色表示上升，红色表示下降
    const pointBackgroundColors = ratingChanges.map(change => 
        change >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
    );
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: contests,
            datasets: [{
                label: 'Rating',
                data: ratings,
                borderColor: 'var(--primary-color)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: pointBackgroundColors,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    display: true,
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Rating'
                    }
                }
            }
        }
    });
}

// 创建提交分布图表
function createSubmissionChart(submissions) {
    const ctx = document.getElementById('submissionChart').getContext('2d');
    
    // 统计不同标签的提交数量
    const tagCounts = {};
    submissions.forEach(submission => {
        if (submission.problem && submission.problem.tags) {
            submission.problem.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });
    
    // 转换为图表数据格式
    const tags = Object.keys(tagCounts);
    const counts = Object.values(tagCounts);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: tags,
            datasets: [{
                data: counts,
                backgroundColor: [
                    '#e6f4ff', // 极浅蓝（接近白色）
                    '#bfddff', // 浅淡蓝
                    '#99c9ff', // 淡天蓝
                    '#73b5ff', // 亮蓝
                    '#4da1ff', // 中浅蓝
                    '#278dff', // 标准蓝
                    '#0079f2', // 稍深蓝
                    '#0066cc', // 中蓝
                    '#0052b3', // 深蓝
                    '#003d80', // 暗蓝
                    '#0080b3', // 青调蓝（带轻微青色）
                    '#4d5fff', // 紫调蓝（带轻微紫色）
                    '#263399', // 深紫蓝
                    '#1a2266', // 近黑蓝
                    '#0d1133'  // 极深蓝（接近黑色）
                ],
                borderWidth: 1,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// 创建提交日历
function createSubmissionCalendar(submissions) {
    const yearSelect = document.getElementById('yearSelect');
    const calendar = document.getElementById('calendar');
    const monthLabels = document.getElementById('monthLabels');
    const stats = document.getElementById('stats');
    
    // 获取当前年份
    const currentYear = new Date().getFullYear();
    
    // 添加年份选项（最近5年）
    for (let year = currentYear; year >= currentYear - 4; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
    
    // 根据提交数据生成日历
    function generateCalendar(year) {
        calendar.innerHTML = '';
        monthLabels.innerHTML = '';
        
        // 创建星期标签
        const weekdays = document.createElement('div');
        weekdays.className = 'weekdays';
        const weekdayLabels = ['一', '三', '五'];
        for (let i = 0; i < 7; i++) {
            const weekday = document.createElement('div');
            weekday.className = 'weekday';
            if (weekdayLabels[i]) {
                weekday.textContent = weekdayLabels[i];
            }
            weekdays.appendChild(weekday);
        }
        calendar.appendChild(weekdays);
        
        // 创建周容器
        const weeksContainer = document.createElement('div');
        weeksContainer.className = 'weeks';
        
        // 计算一年的第一天
        const firstDay = new Date(year, 0, 1);
        let firstDayOfWeek = firstDay.getDay();
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        
        // 计算一年的总天数
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const daysInYear = isLeapYear ? 366 : 365;
        
        // 按日期统计提交次数
        const submissionsByDate = {};
        submissions.forEach(submission => {
            const submissionDate = new Date(submission.creationTimeSeconds * 1000);
            if (submissionDate.getFullYear() === year) {
                const dateStr = submissionDate.toISOString().split('T')[0];
                submissionsByDate[dateStr] = (submissionsByDate[dateStr] || 0) + 1;
            }
        });
        
        // 生成每个月的标签
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                           '7月', '8月', '9月', '10月', '11月', '12月'];
        let monthLabelHtml = '';
        let currentMonth = -1;
        let monthStartWeek = 0;
        
        // 生成日历格子
        for (let i = 0; i < 53; i++) {
            const week = document.createElement('div');
            week.className = 'week';
            
            for (let j = 0; j < 7; j++) {
                const dayIndex = i * 7 + j - firstDayOfWeek;
                if (dayIndex < 0 || dayIndex >= daysInYear) {
                    const emptyDay = document.createElement('div');
                    emptyDay.className = 'day empty';
                    week.appendChild(emptyDay);
                    continue;
                }
                
                const date = new Date(year, 0, dayIndex + 1);
                const dateStr = date.toISOString().split('T')[0];
                const submissionCount = submissionsByDate[dateStr] || 0;
                
                // 确定颜色等级
                let level = 0;
                if (submissionCount > 0) level = 1;
                if (submissionCount > 3) level = 2;
                if (submissionCount > 6) level = 3;
                if (submissionCount > 9) level = 4;
                
                const day = document.createElement('div');
                day.className = 'day';
                day.setAttribute('data-level', level);
                day.setAttribute('data-date', dateStr);
                day.setAttribute('data-count', submissionCount);
                week.appendChild(day);
                
                // 记录月份变化
                if (date.getMonth() !== currentMonth) {
                    currentMonth = date.getMonth();
                    monthLabelHtml += `<span style="width: ${(i - monthStartWeek) * 14}px">${monthNames[currentMonth]}</span>`;
                    monthStartWeek = i;
                }
            }
            
            weeksContainer.appendChild(week);
        }
        
        calendar.appendChild(weeksContainer);
        monthLabels.innerHTML = monthLabelHtml;
        
        // 计算统计数据
        let totalSubmissions = 0;
        let lastMonthSubmissions = 0;
        
        totalSubmissions = submissions.length;
        
        // 计算上个月的提交数
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1, 1);
        const lastMonthEnd = new Date();
        lastMonthEnd.setDate(0);
        
        submissions.forEach(submission => {
            const submissionDate = new Date(submission.creationTimeSeconds * 1000);
            if (submissionDate >= lastMonthStart && submissionDate <= lastMonthEnd) {
                lastMonthSubmissions++;
            }
        });
        
        // 更新统计数据
        stats.innerHTML = `
            <div class="stat-group">
                <div class="stat-value">${totalSubmissions}</div>
                <div class="stat-label">总提交数</div>
            </div>
            <div class="stat-group">
                <div class="stat-value">${lastMonthSubmissions}</div>
                <div class="stat-label">上月提交</div>
            </div>
        `;
    }
    
    // 初始生成当前年份的日历
    generateCalendar(currentYear);
    
    // 年份选择变化时更新日历
    yearSelect.addEventListener('change', function() {
        generateCalendar(parseInt(this.value));
    });
}

// 加载Codeforces数据
async function loadCodeforcesData() {
    try {
        const userInfo = await getUserInfo();
        updateUserInfo(userInfo);
        
        const ratingHistory = await getUserRating();
        createRatingChart(ratingHistory);
        
        const submissions = await getUserStatus();
        createSubmissionChart(submissions);
        createSubmissionCalendar(submissions);
        
    } catch (error) {
        console.error('Codeforces数据加载错误:', error);
    }
}

// 页面加载完成后加载数据

window.addEventListener('load', loadCodeforcesData);

