// 获取URL中的项目ID
function getProjectId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// 加载项目数据
async function loadProjectData() {
    try {
        const response = await fetch('/PeaceSpace/data/projects.json');
        if (!response.ok) throw new Error('数据加载失败');
        const projects = await response.json();
        const projectId = getProjectId();
        return projects.find(project => project.id.toString() === projectId);
    } catch (error) {
        console.error('加载项目数据出错:', error);
        document.body.innerHTML = '<div class="error">无法加载项目详情，请稍后重试</div>';
        return null;
    }
}

// 获取相关文章数据
async function getRelatedArticles(projectTag) {
    try {
        const response = await fetch('/PeaceSpace/data/articles.json');
        if (!response.ok) throw new Error('文章数据加载失败');
        const articles = await response.json();
        // 筛选与项目标签相关的文章
        return articles.filter(article => article.tag && article.tag.includes(projectTag));
    } catch (error) {
        console.error('加载相关文章出错:', error);
        return [];
    }
}

// 生成技术栈标签
function generateTechStack(techStack) {
    const container = document.getElementById('project-tech-stack');
    container.innerHTML = '';
    techStack.forEach(tech => {
        const tag = document.createElement('span');
        tag.className = 'tech-tag';
        tag.textContent = tech;
        container.appendChild(tag);
    });
    // 同步更新侧边栏技术栈
    document.getElementById('info-tech-stack').textContent = techStack.join('、');
}

// 生成项目链接
function generateProjectLinks(project) {
    const container = document.getElementById('project-links');
    container.innerHTML = '';
    
    // 项目详情链接
    if (project.link) {
        const detailLink = document.createElement('a');
        detailLink.href = project.link;
        detailLink.className = 'project-link-btn';
        detailLink.innerHTML = '<i class="fa fa-external-link"></i> 项目地址';
        container.appendChild(detailLink);
    }
    
    // GitHub链接
    if (project.github) {
        const githubLink = document.createElement('a');
        githubLink.href = project.github;
        githubLink.target = '_blank';
        githubLink.className = 'project-link-btn secondary';
        githubLink.innerHTML = '<i class="fa fa-github"></i> 源码仓库';
        container.appendChild(githubLink);
    }
}

// 生成图片画廊
function generateGallery(images) {
    const mainImage = document.getElementById('main-gallery-image');
    const thumbContainer = document.getElementById('gallery-thumbs');
    
    // 设置主图
    mainImage.src = images[0];
    mainImage.alt = '项目图片';
    
    // 生成缩略图
    images.forEach((img, index) => {
        const thumb = document.createElement('img');
        thumb.src = img;
        thumb.alt = `项目图片 ${index + 1}`;
        thumb.className = `gallery-thumb ${index === 0 ? 'active' : ''}`;
        thumb.addEventListener('click', () => {
            mainImage.src = img;
            // 更新激活状态
            document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
        thumbContainer.appendChild(thumb);
    });
}

// 生成功能模块
function generateFeatures(features) {
    const container = document.getElementById('project-features');
    container.innerHTML = '';
    features.forEach(feature => {
        const card = document.createElement('div');
        card.className = 'feature-card';
        card.innerHTML = `
            <i class="fas fa-cube"></i>
            <h3>${feature}</h3>
        `;
        container.appendChild(card);
    });
}

// 加载并显示开发日志
async function loadDevelopmentLogs(projectTag) {
    const logsContainer = document.getElementById('logs-container');
    
    try {
        const response = await fetch('/PeaceSpace/data/articles.json');
        if (!response.ok) throw new Error('日志加载失败');
        
        const articles = await response.json();
        
        // 筛选与项目tag匹配的文章
        const matchedLogs = articles.filter(article => 
            article.tag && article.tag.toLowerCase() === projectTag.toLowerCase()
        );
        
        // 按日期排序，最新的在前
        const sortedLogs = matchedLogs.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        // 清空加载提示
        logsContainer.innerHTML = '';
        
        if (sortedLogs.length === 0) {
            logsContainer.innerHTML = '<div class="no-logs">暂无相关开发日志</div>';
            return;
        }
        
        // 创建日志列表
        const logsList = document.createElement('div');
        logsList.className = 'logs-list';
        
        sortedLogs.forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = 'log-item';
            logItem.innerHTML = `
                <h3><a href="${log.link}" target="_blank">${log.artiTitle}</a></h3>
                <p class="log-date"><i class="far fa-calendar"></i> ${log.date}</p>
                <p class="log-excerpt">${log.excerpt}</p>
                <a href="${log.link}" class="read-more" target="_blank">阅读全文 <i class="fas fa-arrow-right"></i></a>
            `;
            logsList.appendChild(logItem);
        });
        
        logsContainer.appendChild(logsList);
        
    } catch (error) {
        console.error('加载开发日志出错:', error);
        logsContainer.innerHTML = '<div class="error">加载日志失败，请稍后重试</div>';
    }
}

// 生成项目贡献图（模仿Codeforces贡献图）
function generateContributionChart(project, relatedArticles) {
    // 基于项目标签和相关文章日期生成贡献数据
    const baseDate = new Date(project.date);
    const year = baseDate.getFullYear();
    
    // 添加年份选择器
    const yearSelect = document.getElementById('projectYearSelect');
    yearSelect.innerHTML = '';
    // 添加当前年份和前后各一年，与Codeforces保持一致
    for (let y = year - 1; y <= year + 1; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === year) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
    
    // 当选择年份变化时重新渲染
    yearSelect.addEventListener('change', () => {
        renderCalendar(parseInt(yearSelect.value));
    });
    
    // 生成贡献数据
    function generateContributions(selectedYear) {
        const contributions = {};
        
        // 处理相关文章的日期
        relatedArticles.forEach(article => {
            const articleDate = new Date(article.date);
            if (articleDate.getFullYear() === selectedYear) {
                const dateStr = articleDate.toISOString().split('T')[0];
                // 每篇文章计1次贡献
                contributions[dateStr] = (contributions[dateStr] || 0) + 1;
            }
        });
        
        // 限制贡献等级在0-4之间，与Codeforces保持一致
        Object.keys(contributions).forEach(date => {
            contributions[date] = Math.min(4, contributions[date]);
        });
        
        return contributions;
    }
    
    // 渲染日历（周横向排列）
    function renderCalendar(year) {
        const contributions = generateContributions(year);
        const calendar = document.getElementById('projectCalendar');
        const monthLabels = document.getElementById('projectMonthLabels');
        const stats = document.getElementById('projectStats');
        
        // 清空容器
        calendar.innerHTML = '';
        monthLabels.innerHTML = '';
        
        // 创建星期标签（只显示一、三、五，与Codeforces保持一致）
        const weekdays = document.createElement('div');
        weekdays.className = 'weekdays-header';
        const weekdayLabels = ['一', '', '三', '', '五', '', '日'];
        weekdayLabels.forEach(day => {
            const weekday = document.createElement('div');
            weekday.className = 'weekday-header';
            weekday.textContent = day;
            weekdays.appendChild(weekday);
        });
        calendar.appendChild(weekdays);
        
        // 创建周容器（横向排列）
        const weeksContainer = document.createElement('div');
        weeksContainer.className = 'weeks-horizontal'; // 使用横向布局的类
        
        // 计算一年的第一天
        const firstDay = new Date(year, 0, 1);
        let firstDayOfWeek = firstDay.getDay();
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 转换为周一为0
        
        // 计算一年的总天数
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const daysInYear = isLeapYear ? 366 : 365;
        const totalWeeks = Math.ceil((firstDayOfWeek + daysInYear) / 7);
        
        // 记录月份位置用于标签显示
        const monthPositions = {};
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                           '7月', '8月', '9月', '10月', '11月', '12月'];
        
        // 计算总贡献次数
        let totalContributions = 0;
        Object.values(contributions).forEach(count => {
            totalContributions += count;
        });
        
        // 生成日历格子（周横向排列）
        for (let weekNum = 0; weekNum < totalWeeks; weekNum++) {
            const week = document.createElement('div');
            week.className = 'week-column'; // 每一周作为一列
            
            for (let dayNum = 0; dayNum < 7; dayNum++) { // 一周7天
                const dayIndex = weekNum * 7 + dayNum - firstDayOfWeek;
                if (dayIndex < 0 || dayIndex >= daysInYear) {
                    // 填充空白格子
                    const emptyDay = document.createElement('div');
                    emptyDay.className = 'day level-0';
                    week.appendChild(emptyDay);
                    continue;
                }
                
                // 计算当前日期
                const currentDate = new Date(year, 0, dayIndex + 1);
                const dateStr = currentDate.toISOString().split('T')[0];
                const month = currentDate.getMonth();
                
                // 记录每月第一周的位置
                if (!monthPositions[month]) {
                    monthPositions[month] = weekNum;
                }
                
                // 确定贡献等级
                const level = contributions[dateStr] || 0;
                
                // 创建日期格子
                const day = document.createElement('div');
                day.className = `day level-${level}`;
                day.title = `${dateStr}: ${level || '无'} 次贡献`; // 悬停显示详情
                week.appendChild(day);
            }
            
            weeksContainer.appendChild(week);
        }
        
        calendar.appendChild(weeksContainer);
        
        // 生成月份标签
        for (let i = 0; i < 12; i++) {
            if (monthPositions[i] !== undefined) {
                const monthLabel = document.createElement('div');
                monthLabel.className = 'month-label';
                monthLabel.textContent = monthNames[i];
                // 计算月份标签位置
                monthLabel.style.left = `${monthPositions[i] * (24 + 8)}px`; // 24是格子宽度，8是间距
                monthLabel.style.position = 'absolute';
                monthLabels.appendChild(monthLabel);
            }
        }
        
        // 更新统计信息
        stats.innerHTML = `
            <div class="total-contributions">
                总贡献: <strong>${totalContributions}</strong> 次
            </div>
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-color level-0"></div>
                    <span>0</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color level-1"></div>
                    <span>1</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color level-2"></div>
                    <span>2</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color level-3"></div>
                    <span>3</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color level-4"></div>
                    <span>4+</span>
                </div>
            </div>
        `;
        
        // 添加图例颜色样式
        document.querySelectorAll('.legend-color.level-0').forEach(el => {
            el.style.backgroundColor = '#d0dbec';
        });
        document.querySelectorAll('.legend-color.level-1').forEach(el => {
            el.style.backgroundColor = '#99c9ff';
        });
        document.querySelectorAll('.legend-color.level-2').forEach(el => {
            el.style.backgroundColor = '#73b5ff';
        });
        document.querySelectorAll('.legend-color.level-3').forEach(el => {
            el.style.backgroundColor = '#4da1ff';
        });
        document.querySelectorAll('.legend-color.level-4').forEach(el => {
            el.style.backgroundColor = '#278dff';
        });
    }
    
    // 初始渲染
    renderCalendar(year);
}

// 初始化页面
async function init() {
    const project = await loadProjectData();
    if (!project) return;
    
    // 填充项目基本信息
    document.getElementById('project-title').textContent = project.title;
    document.getElementById('project-category').textContent = project.category;
    document.getElementById('project-duration').textContent = project.duration;
    document.getElementById('project-status').textContent = project.status;
    document.getElementById('project-description').textContent = project.description;
    document.getElementById('project-challenges').textContent = project.challenges || '暂无记录';
    
    // 填充侧边栏信息
    document.getElementById('info-duration').textContent = project.duration;
    document.getElementById('info-status').textContent = project.status;
    
    // 生成技术栈标签
    generateTechStack(project.techStack);
    
    // 生成项目链接
    generateProjectLinks(project);
    
    // 生成图片画廊
    if (project.images && project.images.length > 0) {
        generateGallery(project.images);
    } else {
        document.querySelector('.project-gallery').style.display = 'none';
    }
    
    // 生成功能模块
    if (project.features && project.features.length > 0) {
        generateFeatures(project.features);
    } else {
        document.querySelector('.section:nth-child(4)').style.display = 'none';
    }
    
    // 获取相关文章并生成贡献图
    const relatedArticles = await getRelatedArticles(project.tag);
    generateContributionChart(project, relatedArticles);
    
    // 加载开发日志
    loadDevelopmentLogs(project.tag);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);