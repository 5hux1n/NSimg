<div align="center">

<img src=".github/assets/nsimg.png" alt="NSimg 图标" width="64">

# NSimg 助手

在 NodeSeek 原生编辑器中上传、插入和管理 NodeImage 图片。

粘贴截图、选择本地图片或打开历史图库，图片链接会插入当前帖子。

</div>

## Install

选择一种安装方式：

- **Chrome / Edge 扩展：**下载 [v1.0.1 扩展 ZIP](https://github.com/5hux1n/NSimg/releases/download/v1.0.1/nsimg-v1.0.1.zip)，解压到固定目录。在 `chrome://extensions` 或 `edge://extensions` 开启开发者模式，选择“加载已解压的扩展程序”，指向解压后的 `nsimg-v1.0.1` 文件夹。
- **独立 JS：**下载 [v1.0.1 用户脚本](https://github.com/5hux1n/NSimg/releases/download/v1.0.1/NSimg.user.js)，导入支持用户脚本的浏览器或脚本管理器，并允许它在 `nodeseek.com` 上运行。

当前未发布到浏览器扩展商店。安装扩展后请保留解压目录。

## Quickstart

1. 打开或刷新 NodeSeek 的发帖、回复编辑器。
2. 点击编辑器原有的“图片”按钮选择图片，或直接在编辑器中粘贴截图。扩展版还支持拖拽图片。
3. 上传完成后检查正文中的 Markdown 图片链接。点击编辑器顶部的“图片”入口，可查看、插入或删除历史图片。

如果未能自动获取 API Key，可在扩展弹窗或独立 JS 的图库设置中填写 NodeImage API Key。使用已有 API Key 上传图片无需依赖浏览器中的 NodeImage 登录会话。

## What you can do

- **粘贴与批量上传：**从剪贴板或文件选择器上传多张图片，依次插入链接。
- **管理历史图片：**查看缩略图、打开原图、将历史图片插入编辑器或删除图片。
- **保留编辑器样式：**复用 NodeSeek 的图片按钮和界面颜色，不增加发帖步骤。
- **确认插入结果：**扩展在编辑器确认写入后才显示插入成功；失败时提示从图库找回已上传图片。

## Browser support

| 版本 | 环境 | 状态 |
| --- | --- | --- |
| 扩展 | Chrome、Edge 的 Manifest V3 环境 | 支持；v1.0.1 尚未完成浏览器实测 |
| 独立 JS | Safari + Userscripts、Alook | 早期版本已实测；v1.0.1 尚未完成设备复测 |
| 独立 JS | Via | 脚本上传链路尚未解决 |

不同浏览器的用户脚本接口和跨域规则可能不同。独立 JS 的 v1.0.1 沿用已工作的通用上传方式，没有加入 Via 专用请求代码。

## Notes

- **图片格式：**扩展上传前检查 PNG、JPEG、GIF、WebP、BMP 的实际文件头；独立 JS 将所选图片文件交给浏览器上传。
- **版本记录：**查看 [更新日志](CHANGELOG.md)及 [GitHub Releases](https://github.com/5hux1n/NSimg/releases)。
