# taro2.xRichText组件

> 此项目基于taro2.x+ts+mobx框架研发

## 组件特性

支持特性 | 支持度
---|---
HTML的大部分标签解析 | 微信小程序/h5
markdown格式解析 | 微信小程序/h5
代码高亮显示  | 微信小程序/h5
内联style | 微信小程序/h5
标签Class | 微信小程序/h5
图片自适应规则 | 微信小程序/h5
图片多图片预览 | 微信小程序/h5
多数据循环方式 |微信小程序/h5
支持音频 | 微信小程序/h5
支持视频 | 微信小程序/h5

### 组件说明

- h5端默认taro的基础组件RichText，自定义实现图片自适应加点击事件
- 小程序端自定义富文本渲染组件MpParseHtml，支持音频、视频、图片、外部链接点击事件处理

### 参考资料

```bash
wxParse —— 微信小程序富文本解析 https://github.com/csonchen/wxParse
wxParse —— 微信小程序富文本解析 https://github.com/icindy/wxParse
highlightjs—— 代码高亮 https://github.com/highlightjs/highlight.js
```
