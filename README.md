# NSimg助手

NSimg助手是一款为 NodeSeek 原生编辑器提供 NodeImage 图片上传与管理能力的 Chrome / Edge 扩展。

无需改变原有发帖习惯，即可在 NodeSeek 编辑器中直接粘贴、拖拽或选择图片上传至 NodeImage，并自动插入 Markdown 图片链接。

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

- ⏯️ **随时启用 / 停止**  
  可通过扩展面板一键启用或停止 NSimg助手。

## 安装

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

## 使用

安装完成后，打开 NodeSeek 发帖或回复编辑器。

你可以：

- 直接在编辑器中 **粘贴图片**
- 将图片 **拖入编辑器**
- 点击编辑器原有的 **图片按钮**选择本地图片
- 点击编辑器中的 **图片管理入口**查看 NodeImage 历史图片

图片上传完成后，NSimg助手会自动将对应的 Markdown 图片链接插入当前编辑位置。

## API Key

正常情况下无需手动配置。

如果浏览器中已经登录 NodeImage，NSimg助手会自动尝试获取并保存 API Key。

如果没有自动获取成功，可以：

1. 点击浏览器工具栏中的 NSimg助手图标。
2. 点击 **「获取Api Key」**重新获取。
3. 或在扩展面板中手动填写 NodeImage API Key。

配置成功后即可正常使用图片上传及图片管理功能。

## 更新

下载新版本 ZIP 并解压后，在浏览器扩展管理页面更新对应的扩展目录，然后点击 NSimg助手的 **「重新加载」**即可。

如果直接使用新版本目录，也可以删除旧版本扩展后，通过「加载已解压的扩展程序」重新选择新目录。

## 支持的浏览器

- Google Chrome
- Microsoft Edge
- 其他兼容 Chromium Manifest V3 扩展的浏览器

## 项目

GitHub: https://github.com/5hux1n/nsimg

NodeImage: https://www.nodeimage.com

## 说明

NSimg助手是面向 NodeSeek / NodeImage 使用场景开发的第三方辅助扩展，与 NodeSeek、NodeImage 官方无隶属关系。

扩展主要用于简化 NodeSeek 编辑器中的图片上传、插入及 NodeImage 图片管理操作。

## License

本项目的开源许可信息请参阅仓库中的 LICENSE 文件。
