// 获取URL中的文章ID参数
function getArticleId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// 生成文章目录
function generateToc(markdownContent) {
    const toc = document.getElementById('article-toc');
    toc.innerHTML = '';
    
    // 提取Markdown中的标题
    const headings = markdownContent.match(/#{2,3}\s+.+/g) || [];
    
    headings.forEach(heading => {
        // 解析标题级别和内容
        const level = heading.match(/#+/)[0].length;
        const text = heading.replace(/#+\s+/, '');
        // 创建唯一ID用于锚点
        const id = text.toLowerCase().replace(/\s+/g, '-');
        
        // 创建目录项
        const li = document.createElement('li');
        li.className = `toc-level-${level}`;
        
        const a = document.createElement('a');
        a.href = `#${id}`;
        a.textContent = text;
        li.appendChild(a);
        
        toc.appendChild(li);
    });
    
    return headings;
}

// 为Markdown内容中的标题添加ID
function addHeadingIds(markdownContent, headings) {
    let content = markdownContent;
    
    headings.forEach(heading => {
        const level = heading.match(/#+/)[0];
        const text = heading.replace(/#+\s+/, '');
        const id = text.toLowerCase().replace(/\s+/g, '-');
        
        // 替换原始标题为带ID的HTML标题
        const replacement = `${level} <span id="${id}">${text}</span>`;
        content = content.replace(heading, replacement);
    });
    
    return content;
}

// 处理标题生成安全的文件名
function getSafeFilename(title) {
    // 转换为小写，替换空格为连字符，移除特殊字符
    return title.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
}

// 加载文章详情
function loadArticleDetail() {
    const articleId = getArticleId();
    if (!articleId) {
        showError();
        return;
    }
    
    fetch('../data/articles.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应不正常');
            }
            return response.json();
        })
        .then(articles => {
            // 查找对应的文章
            const article = articles.find(a => a.id.toString() === articleId);
            
            if (!article) {
                showError();
                return;
            }
            
            // 显示文章内容区域，隐藏加载和错误提示
            document.querySelector('.loading').style.display = 'none';
            document.querySelector('.error').style.display = 'none';
            document.getElementById('article-content').style.display = 'block';
            
            // 填充文章基本信息
            document.getElementById('article-title').textContent = article.artiTitle;
            document.getElementById('article-date').textContent = article.date;
            document.getElementById('article-tag').textContent = article.tag;
            document.getElementById('article-readTime').textContent = article.readTime;
            
            // 更新页面标题
            document.title = `${article.title} | 宁静空间`;
            
            // 生成安全的文件名
            const safeFilename = getSafeFilename(article.title);
            // 构建MD文件路径（与pages并列的articles文件夹）
            const mdFilePath = `../articles/${safeFilename}.md`;
            
            // 加载Markdown内容
            fetch(mdFilePath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('无法加载文章内容');
                    }
                    return response.text();
                })
                .then(markdownContent => {
                    // 生成目录
                    const headings = generateToc(markdownContent);
                    
                    // 为标题添加ID
                    const contentWithIds = addHeadingIds(markdownContent, headings);
                    
                    // 渲染Markdown
                    document.getElementById('article-markdown-content').innerHTML = marked.parse(contentWithIds);
                    
                    // 高亮代码
                    hljs.highlightAll();
                })
                .catch(error => {
                    console.error('加载Markdown内容失败:', error);
                    document.getElementById('article-markdown-content').innerHTML = 
                         `<p class="error">加载失败：${error.message}</p>
                            <p>尝试加载的文件：${mdFilePath}</p>`;
                });
        })
        .catch(error => {
            console.error('加载文章信息失败:', error);
            showError();
        });
}

// 显示错误信息
function showError() {
    document.querySelector('.loading').style.display = 'none';
    document.getElementById('article-content').style.display = 'none';
    document.querySelector('.error').style.display = 'block';
}

// 页面加载完成后加载文章详情
document.addEventListener('DOMContentLoaded', loadArticleDetail);