# NSimg助手

NSimg助手是一款为 NodeSeek 原生编辑器提供 NodeImage 图片上传与管理能力的 Chrome / Edge 扩展。

无需改变原有发帖习惯，适配NodeSeek桌面版以及移动端原生样式。

## 功能

- 📋 **粘贴上传**  
  在 NodeSeek 编辑器中直接粘贴剪贴板中的图片，自动上传并插入 Markdown。

- 🖱️ **拖拽上传**  
  将本地图片拖入编辑器即可完成上传。

- 🖼️ **本地图片上传**  
  接管 NodeSeek 编辑器原生「图片」按钮，选择本地图片上传并自动插入。

- 📚 **NodeImage 图片管理**  
  可直接在 NodeSeek 编辑器中查看已上传至 NodeImage 的图片。

- ✏️ **快速插入历史图片**  
  点击图片缩略图，即可将对应图片插入当前编辑器。

- 👁️ **查看原图**  
  可从图片管理窗口快速查看已上传图片的原图。

- 🗑️ **删除图片**  
  支持直接删除 NodeImage 中不再需要的图片。

- 🔑 **自动获取 API Key**  
  已登录 NodeImage 时会自动尝试获取并保存 API Key，通常无需手动配置。

- 🖼️ **多图上传**  
  支持一次处理多张图片，并保持正确的 Markdown 插入顺序。

## 安装

### Chrome / Edge 扩展版

目前 NSimg助手以 ZIP 压缩包形式发布，需要通过 Chrome / Edge 的「开发者模式」安装。

1. 下载最新版本的 NSimg助手 ZIP 压缩包。
2. 将 ZIP **完整解压**到一个固定目录，请勿直接从压缩包中运行。
3. 打开 Chrome / Edge 的扩展管理页面。
4. 开启页面中的 **「开发者模式」**。
5. 点击 **「加载已解压的扩展程序」**。
6. 选择刚刚解压得到的 NSimg助手目录。
7. 打开或刷新 NodeSeek 页面即可使用。

> **注意：NSimg助手目前未通过 Chrome Web Store / Edge Add-ons 发布，因此必须开启浏览器「开发者模式」才能安装。**
>
> 安装完成后请保留解压后的扩展目录。如果删除或移动该目录，浏览器可能无法继续正常加载扩展。

### JS 版

NSimg助手同时提供独立的 Userscript 版本。

JS 版无需安装浏览器扩展，仅需安装：

`NSimg.user.js`

目前已在 **iOS / iPadOS Safari + Userscripts** 环境完成测试。

其他支持 Userscript 的浏览器及脚本管理器理论上也可运行，但由于不同环境存在差异，兼容性暂未逐一验证。

#### Safari 安装

1. 安装并启用 Userscripts Safari 扩展。
2. 下载最新版本的 `NSimg.user.js`。
3. 将脚本添加至 Userscripts。
4. 确保脚本允许在 NodeSeek 页面运行。
5. 打开或刷新 NodeSeek 页面即可使用。

JS 版同样支持 NodeImage 图片上传、历史图片管理、图片插入、原图查看及图片删除等主要功能。

> JS 版与 Chrome / Edge 扩展版采用不同的运行方式，但主要功能及使用体验保持一致。

## 使用

安装完成后，打开 NodeSeek 发帖或回复编辑器。

- 点击编辑器原有的 **图片按钮**选择手机相册图片
- 点击编辑器中的 **图片管理入口**查看 NodeImage 历史图片

图片上传完成后，NSimg助手会自动将对应的 Markdown 图片链接插入当前编辑位置。

## API Key

正常情况下无需手动配置。

如果浏览器中已经登录 NodeImage，NSimg助手会自动尝试获取并保存 API Key。

如果没有自动获取成功，可以根据提示指引完成登录操作。

## 支持的浏览器

### 扩展版

- Google Chrome
- Microsoft Edge
- 其他兼容 Chromium Manifest V3 扩展的浏览器

### JS 版

- iOS Safari + Userscripts（已测试）
- 其他支持 Userscript 的浏览器及脚本管理器（未验证）
