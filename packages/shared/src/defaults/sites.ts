/** 图标库 / 标签库：一键添加常用网站（配置驱动，按需增删） */
export interface LibrarySite {
  title: string
  url: string
  description?: string
  color?: string
}

export interface LibraryGroup {
  id: string
  name: string
  sites: LibrarySite[]
}

export const SITE_LIBRARY: LibraryGroup[] = [
  {
    id: 'common',
    name: '常用',
    sites: [
      { title: '百度', url: 'https://www.baidu.com', color: '#2932e1' },
      { title: '必应', url: 'https://www.bing.com', color: '#008373' },
      { title: 'Google', url: 'https://www.google.com', color: '#4285f4' },
      { title: '微信读书', url: 'https://weread.qq.com', color: '#1677ff' },
      { title: 'QQ 邮箱', url: 'https://mail.qq.com', color: '#f5a623' },
      { title: 'Gmail', url: 'https://mail.google.com', color: '#ea4335' },
      { title: '百度网盘', url: 'https://pan.baidu.com', color: '#06a7ff' },
      { title: '高德地图', url: 'https://www.amap.com', color: '#1f8cff' },
    ],
  },
  {
    id: 'video',
    name: '影音',
    sites: [
      { title: '哔哩哔哩', url: 'https://www.bilibili.com', description: '国内知名弹幕视频网站', color: '#fb7299' },
      { title: '抖音', url: 'https://www.douyin.com', color: '#111111' },
      { title: '腾讯视频', url: 'https://v.qq.com', color: '#ff7f00' },
      { title: '爱奇艺', url: 'https://www.iqiyi.com', color: '#00be06' },
      { title: '优酷', url: 'https://www.youku.com', color: '#1ebeff' },
      { title: 'YouTube', url: 'https://www.youtube.com', color: '#ff0000' },
      { title: '网易云音乐', url: 'https://music.163.com', color: '#c20c0c' },
      { title: 'QQ 音乐', url: 'https://y.qq.com', color: '#31c27c' },
      { title: 'Netflix', url: 'https://www.netflix.com', color: '#e50914' },
    ],
  },
  {
    id: 'social',
    name: '社区',
    sites: [
      { title: '微博', url: 'https://weibo.com', color: '#e6162d' },
      { title: '知乎', url: 'https://www.zhihu.com', color: '#0066ff' },
      { title: '小红书', url: 'https://www.xiaohongshu.com', color: '#ff2442' },
      { title: '豆瓣', url: 'https://www.douban.com', color: '#007722' },
      { title: '贴吧', url: 'https://tieba.baidu.com', color: '#3385ff' },
      { title: 'V2EX', url: 'https://www.v2ex.com', color: '#333344' },
      { title: 'X', url: 'https://x.com', color: '#000000' },
      { title: 'Reddit', url: 'https://www.reddit.com', color: '#ff4500' },
    ],
  },
  {
    id: 'shopping',
    name: '购物',
    sites: [
      { title: '淘宝', url: 'https://www.taobao.com', color: '#ff5000' },
      { title: '京东', url: 'https://www.jd.com', color: '#e1251b' },
      { title: '天猫', url: 'https://www.tmall.com', color: '#ff0036' },
      { title: '拼多多', url: 'https://www.pinduoduo.com', color: '#e02e24' },
      { title: '闲鱼', url: 'https://www.goofish.com', color: '#ffda44' },
      { title: '什么值得买', url: 'https://www.smzdm.com', color: '#e62828' },
      { title: 'Amazon', url: 'https://www.amazon.com', color: '#ff9900' },
    ],
  },
  {
    id: 'dev',
    name: '开发',
    sites: [
      { title: 'GitHub', url: 'https://github.com', description: '全球最大的代码托管平台', color: '#181717' },
      { title: 'Gitee', url: 'https://gitee.com', color: '#c71d23' },
      { title: '掘金', url: 'https://juejin.cn', color: '#1e80ff' },
      { title: 'CSDN', url: 'https://www.csdn.net', color: '#fc5531' },
      { title: 'Stack Overflow', url: 'https://stackoverflow.com', color: '#f48024' },
      { title: 'MDN', url: 'https://developer.mozilla.org', color: '#000000' },
      { title: 'npm', url: 'https://www.npmjs.com', color: '#cb3837' },
      { title: 'Vue', url: 'https://vuejs.org', color: '#42b883' },
      { title: 'Vercel', url: 'https://vercel.com', color: '#000000' },
      { title: 'Can I use', url: 'https://caniuse.com', color: '#e05d44' },
    ],
  },
  {
    id: 'ai',
    name: 'AI',
    sites: [
      { title: 'ChatGPT', url: 'https://chatgpt.com', color: '#10a37f' },
      { title: 'Claude', url: 'https://claude.ai', color: '#d97757' },
      { title: 'Gemini', url: 'https://gemini.google.com', color: '#4285f4' },
      { title: 'DeepSeek', url: 'https://chat.deepseek.com', color: '#4d6bfe' },
      { title: 'Kimi', url: 'https://www.kimi.com', color: '#000000' },
      { title: '豆包', url: 'https://www.doubao.com', color: '#3b82f6' },
      { title: '通义', url: 'https://www.tongyi.com', color: '#615ced' },
      { title: '文心一言', url: 'https://yiyan.baidu.com', color: '#2932e1' },
    ],
  },
  {
    id: 'design',
    name: '设计',
    sites: [
      { title: 'Figma', url: 'https://www.figma.com', color: '#f24e1e' },
      { title: 'Dribbble', url: 'https://dribbble.com', color: '#ea4c89' },
      { title: '站酷', url: 'https://www.zcool.com.cn', color: '#ffe100' },
      { title: '花瓣', url: 'https://huaban.com', color: '#e94043' },
      { title: 'Unsplash', url: 'https://unsplash.com', color: '#000000' },
      { title: 'Iconfont', url: 'https://www.iconfont.cn', color: '#e64545' },
    ],
  },
  {
    id: 'tools',
    name: '工具',
    sites: [
      { title: '百度翻译', url: 'https://fanyi.baidu.com', color: '#2932e1' },
      { title: 'DeepL', url: 'https://www.deepl.com/translator', color: '#0f2b46' },
      { title: '腾讯文档', url: 'https://docs.qq.com', color: '#1e6fff' },
      { title: '飞书', url: 'https://www.feishu.cn', color: '#3370ff' },
      { title: 'Notion', url: 'https://www.notion.so', color: '#000000' },
      { title: 'TinyPNG', url: 'https://tinypng.com', color: '#84bb4b' },
      { title: '草料二维码', url: 'https://cli.im', color: '#22b14c' },
    ],
  },
  {
    id: 'news',
    name: '资讯',
    sites: [
      { title: '少数派', url: 'https://sspai.com', color: '#d71a1b' },
      { title: '36氪', url: 'https://36kr.com', color: '#0078ff' },
      { title: '虎嗅', url: 'https://www.huxiu.com', color: '#18191c' },
      { title: 'IT之家', url: 'https://www.ithome.com', color: '#d22222' },
      { title: '澎湃新闻', url: 'https://www.thepaper.cn', color: '#00a5eb' },
      { title: 'Hacker News', url: 'https://news.ycombinator.com', color: '#ff6600' },
    ],
  },
  {
    id: 'study',
    name: '学习',
    sites: [
      { title: '中国大学MOOC', url: 'https://www.icourse163.org', color: '#00b55d' },
      { title: '学堂在线', url: 'https://www.xuetangx.com', color: '#2e7cf6' },
      { title: 'Coursera', url: 'https://www.coursera.org', color: '#0056d2' },
      { title: '维基百科', url: 'https://zh.wikipedia.org', color: '#000000' },
      { title: '知网', url: 'https://www.cnki.net', color: '#1a5aa9' },
      { title: 'LeetCode', url: 'https://leetcode.cn', color: '#ffa116' },
    ],
  },
]
