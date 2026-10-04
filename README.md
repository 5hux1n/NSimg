<div align="center">

<img src=".github/assets/nsimg.png" alt="NSimg 图标" width="64">

# NSimg 助手

在 NodeSeek 原生编辑器中上传、插入和管理 NodeImage 图片。

粘贴截图、选择本地图片或打开历史图库，图片链接会插入当前帖子。

</div>

[项目网站](https://nsimg.goforit.si/)

## Install

选择一种安装方式：

- **Chrome / Edge 扩展：**下载 [v1.0.2 扩展 ZIP](https://github.com/5hux1n/NSimg/releases/download/v1.0.2/nsimg-v1.0.2.zip)，解压到固定目录。在 `chrome://extensions` 或 `edge://extensions` 开启开发者模式，选择“加载已解压的扩展程序”，指向解压后的 `nsimg-v1.0.2` 文件夹。
- **独立 JS：**下载 [v1.0.2 用户脚本](https://github.com/5hux1n/NSimg/releases/download/v1.0.2/NSimg.user.js)，导入支持用户脚本的浏览器或脚本管理器，并允许它在 `nodeseek.com` 上运行。

当前未发布到浏览器扩展商店。安装扩展后请保留解压目录。

## Quickstart

1. 打开或刷新 NodeSeek 的发帖、回复编辑器。
2. 点击编辑器原有的“图片”按钮选择图片，或直接在编辑器中粘贴截图。扩展版还支持拖拽图片。
3. 上传完成后检查正文中的 Markdown 图片链接。点击编辑器顶部的“图片”入口，可查看、插入或删除历史图片。

如果未能自动获取 API Key，可在扩展弹窗或独立 JS 的图库设置中填写 NodeImage API Key。独立 JS 支持明文多行输入，填写后点击“保存”。使用已有 API Key 上传图片无需依赖浏览器中的 NodeImage 登录会话。

## What you can do

- **粘贴与批量上传：**从剪贴板或文件选择器上传多张图片，依次插入链接。
- **管理历史图片：**查看缩略图、打开原图、将历史图片插入编辑器或删除图片。
- **保留编辑器样式：**复用 NodeSeek 的图片按钮和界面颜色，不增加发帖步骤。
- **确认插入结果：**扩展在编辑器确认写入后才显示插入成功；失败时提示从图库找回已上传图片。

## Browser support

| 版本 | 环境 | 状态 |
| --- | --- | --- |
| 扩展 | Chrome、Edge 的 Manifest V3 环境 | 支持；v1.0.2 尚未完成浏览器实测 |
| 独立 JS | Alook | 当前上传流程已通过用户真机测试 |
| 独立 JS | Safari + Userscripts | 早期版本已实测；本次设置界面尚未完成设备复测 |


## NodeSeek 论坛美化 CSS

纯 CSS，在 NodeSeek 个人资料的自定义 style 中使用。完整代码共 **8108 字符 / 8114 UTF-8 字节（含 style 请求包装 8170 字节）**，低于 8180 限额。

- 全局圆角头像；重排桌面个人资料卡，五个操作图标均匀分布。
- 用户头像弹出的资料卡复用布局与日夜配色，底部操作区两侧及下方留出 16px 内边距；修复 Stardust 转账弹窗被资料卡遮挡。
- 缩小桌面帖子列表外层卡片，让右侧资料卡与顶部发帖按钮右侧对齐。
- 重构搜索及发帖按钮，适配导航文字、按钮和页脚的夜间配色。
- 移动端签到入口移至顶部导航栏，随导航栏滚动；保留侧滑菜单。
- 资料卡统计区下方增加分隔线；保留 Seek.li、NodeQuality、NodeScriptKit、NodeHatch、NFD2.0 和幸运抽奖六个入口，使用两行纯文字链接与「｜」分隔，保留 NodeScriptKit 全名。
- 隐藏 beta 标识、顶部轮播、右侧商业广告、最新注册用户及板块简介；桌面左侧分类去重后合并至顶部导航。

[下载 CSS 文件](https://github.com/5hux1n/NSimg/releases/download/v1.0.2/nodeseek.min.css) · [查看仓库中的 CSS](styles/nodeseek.min.css)

进入论坛个人资料中的自定义 style，复制下面代码块中的全部 CSS，替换原有样式后保存并刷新。代码块右上角的复制按钮可复制完整内容，无需安装 JS。样式使用 CSS 嵌套、`:has()` 和锚点定位，需要支持这些特性的浏览器。

<details>
<summary>展开完整 CSS（可一键复制）</summary>

```css
body{--r:max(8px,calc((100vw - 1080px)/2));--n:#111;--f:#555;--g:#f5f5f5;--l:#c9c9c9;--c:#fff;--t:#555;--b:#eee}.dark-layout{--n:#fff;--f:#fff;--g:#202328;--l:#777;--c:#25282d;--t:#ddd;--b:#41454c}@keyframes ns-sign-in{0%{opacity:0;visibility:hidden}to{opacity:1;visibility:visible}}@media(max-width:760px){#left-slide-panel{transition:left .5s!important}#left-slide-panel[style*="-100%"]{position:absolute!important;top:0!important;bottom:auto!important;overflow:visible!important;pointer-events:none!important}#left-slide-panel[style*="-100%"] [title=签到]{position:absolute!important;left:calc(200vw - 165px)!important;right:auto!important;top:0!important;width:33px!important;height:30px!important;z-index:99999!important;display:flex!important;align-items:center!important;justify-content:center!important;pointer-events:auto!important;color:var(--f)!important;animation:ns-sign-in .5s step-end!important}}footer,footer .contain{background:var(--g)!important;color:var(--f)!important}footer a{color:var(--f)!important}.topic-carousel-wrapper,.beta-icon{display:none!important}.avatar-normal{border-radius:50%!important;object-fit:cover!important}@media(min-width:761px){#nsk-body{display:block!important;position:relative!important;overflow:visible!important}#nsk-body-left{width:100%!important;margin:0!important}#nsk-right-panel-container .nsk-panel:not(.quick-access){display:none!important}#nsk-head .nav-menu{anchor-name:--n!important}#nsk-left-panel-container{&{position:fixed!important;position-anchor:--n!important;top:anchor(top)!important;left:anchor(right)!important;z-index:1002!important}&,& .category-list{width:max-content!important;height:40px!important;margin:0!important;padding:0!important;background:0 0!important;border:0!important;box-shadow:none!important}&>.nsk-panel:not(.category-list),&>div:not(.nsk-panel),& .category-list :is(h4,.iconpark-icon,li:nth-child(-n+7)){display:none!important}}:is(.nav-menu,.category-list ul){&{display:flex!important;align-items:center!important;height:40px!important;margin:0!important;padding:0!important}& li{margin:0!important;padding:0!important;border:0!important;background:0 0!important}& li a{display:flex!important;align-items:center!important;justify-content:center!important;height:40px!important;margin:0!important;padding:0 9px!important;background:0 0!important;border:0!important;border-radius:0!important;box-shadow:none!important;font-size:13px!important;font-weight:400!important;white-space:nowrap!important;}& li,& li :is(a,span){color:var(--n)!important;-webkit-text-fill-color:var(--n)!important;opacity:1!important}}.user-card{&{color:var(--t)!important;margin:0!important;padding:0!important;background:var(--c)!important;border:0!important;border-radius:16px!important;box-shadow:0 3px 8px #0004!important;overflow:hidden!important}& .user-head{height:auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:12px!important;padding:22px 16px 16px!important;margin:0!important;background:var(--c)!important}& .user-head>.menu{display:contents!important}& .user-head>a{margin:0!important}& .user-head .avatar-normal{width:72px!important;height:72px!important;margin:0!important}& .menu>a{margin:0!important;font-size:16px!important}& .menu>div{display:grid!important;align-items:center!important;text-align:center!important;grid-auto-flow:column!important;grid-auto-columns:1fr!important;gap:0!important;width:100%!important;margin:0!important}& .menu>div svg{margin:0!important}& .menu>div>a:empty{display:none!important}& .menu>div>*{display:flex!important;justify-content:center!important;margin:0!important}& :is(.user-stat,.stat-block,.stat-block>div,.stat-block a){background:var(--c)!important}& .user-stat{margin:0!important;padding:16px!important;border:0!important;border-top:1px solid var(--b)!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:16px!important}& :is(.user-stat,.stat-block){border-radius:0!important;box-shadow:none!important}& .stat-block{display:flex!important;flex-direction:column!important;gap:12px!important}& .stat-block>div,& .stat-block>div>a{transform:none!important;display:flex!important;align-items:center!important;gap:6px!important}& :is(a,svg){color:var(--t)!important}& .usercard-button-group{padding:0 16px 16px!important}}body>.user-card{z-index:1104!important}#nsk-right-panel-container{position:fixed!important;top:56px!important;right:var(--r)!important;width:248px!important;display:flex!important;flex-wrap:wrap!important;justify-content:center!important;gap:0!important;margin:0!important;padding:16px!important;z-index:1102!important;background:var(--c)!important;border-radius:16px!important;box-shadow:0 3px 8px #0004!important;&>.user-card{margin:-16px -16px 8px!important;flex:0 0 280px!important;border-bottom:1px solid var(--b)!important;border-radius:16px 16px 0 0!important;box-shadow:none!important}&>div:has(>.promotation-item),& :is(.quick-access,.quick-access ul,.quick-access li:has([href="/lucky"])){display:contents!important}& .quick-access :is(h4,li:not(:has([href="/lucky"]))){display:none!important}& :is(.promotation-item,[href="/lucky"]){width:auto!important;display:flex!important;align-items:center!important;height:28px!important;margin:0!important;padding:0!important;font-size:12px!important;border:0!important;box-shadow:none!important;color:var(--t)!important;background:none!important}& [href="/lucky"]{order:1!important}& .promotation-item:not(:has(img:is([alt="Seek.li"],[alt=NodeQuality],[alt=NodeScriptKit],[alt=NodeHatch],[alt="NFD2.0"]))){display:none!important}& :is(.promotation-item img,[href="/lucky"] svg){display:none!important}& .promotation-item{&:before{content:var(--s)}&[href*="seek.li"]{--s:"Seek.li"}&[href*=nodequality]{--s:"NodeQuality"}&[href*=NodeScriptKit]{--s:"NodeScriptKit"}&[href*="132849"]{--s:"NodeHatch"}&[href*="286885"]{--s:"NFD2.0"}}& :is([href*="seek.li"],[href*=nodequality],[href*="132849"],[href*="286885"]):after{content:"｜";margin:0 4px;color:var(--b)}}#nsk-head{& .search-box{right:calc(var(--r) + 80px)!important;overflow:visible!important}& .color-theme-switcher{right:calc(var(--r) + 40px)!important}& #search-site2{position:absolute!important;inset:0!important;margin:0!important;cursor:pointer!important;outline:0!important;width:32px!important;padding:0!important;color:transparent!important;background:0 0!important;box-shadow:none!important}& #search-site2::placeholder{color:transparent!important}& .search-icon{position:absolute!important;top:50%!important;left:50%!important;right:auto!important;width:16px!important;height:16px!important;margin:0!important;transform:translate(-50%,-50%)!important;pointer-events:none!important;z-index:2!important}}#nsk-head :is(.search-box,.color-theme-switcher),div:has(>.btn.new-discussion){position:fixed!important;top:4px!important;z-index:1102!important;width:32px!important;height:32px!important;margin:0!important;padding:0!important}#nsk-head :is(#search-site2,.color-theme-switcher),.btn.new-discussion{height:32px!important;border:1px solid var(--l)!important;border-radius:4px!important;box-sizing:border-box!important}#nsk-head .color-theme-switcher,.btn.new-discussion{width:32px!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:0!important;padding:0!important;color:var(--f)!important;background:0 0!important;box-shadow:none!important;line-height:1!important}div:has(>.btn.new-discussion){right:var(--r)!important;display:block!important}.btn.new-discussion :is(span,svg){display:none!important}.btn.new-discussion:before{content:"+";display:block!important;color:var(--f)!important;font:400 22px/28px Arial,sans-serif!important}}@media(761px<=width<=1400px){#nsk-right-panel-container>:not(:has(>.btn.new-discussion)){display:none!important}#nsk-right-panel-container{display:contents!important}}@media(761px<=width<=1100px){#nsk-left-panel-container{display:none!important}}@media(min-width:1401px){#nsk-body{width:780px!important;left:-150px!important}}.with-mask{z-index:1200!important}
```

</details>

## Notes

- **图片格式：**扩展上传前检查 PNG、JPEG、GIF、WebP、BMP 的实际文件头；独立 JS 将所选图片文件交给浏览器上传。
- **版本记录：**查看 [更新日志](CHANGELOG.md)及 [GitHub Releases](https://github.com/5hux1n/NSimg/releases)。
