# 智能机器人视觉挑战赛 - 刷题系统

## 部署方式（任选一种）

### 方式1：Vercel（推荐，最快）
1. 打开 https://vercel.com
2. 用GitHub/邮箱注册登录
3. 点击 "Add New Project" → "Import Third-Party Git Repository" 或直接拖拽
4. 把 `deploy` 文件夹里的文件上传
5. 部署完成，自动获得 `xxx.vercel.app` 地址

### 方式2：Netlify
1. 打开 https://app.netlify.com/drop
2. 直接把 `deploy` 文件夹拖进去
3. 30秒部署完成

### 方式3：GitHub Pages
1. 创建新仓库
2. 把 `deploy/index.html` 推上去
3. Settings → Pages → Source 选 main 分支
4. 获得 `username.github.io/repo-name` 地址

### 方式4：本地局域网（手机同WiFi）
```
cd deploy
python -m http.server 8080
```
手机浏览器访问 `http://你的电脑IP:8080`

## 文件说明
- `index.html` - 完整应用（单文件，164KB，含全部1000题）
- `vercel.json` - Vercel缓存配置（可选）
