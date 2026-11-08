// 归页 扩展后台（MV3 service worker）
// 1. 点击工具栏图标时打开归页
// 2. 为「WebApp 内嵌窗口」移除 X-Frame-Options / CSP 响应头。
//    规则仅作用于由本扩展页面发起的 iframe 请求（initiatorDomains = 扩展 id），
//    不影响你正常浏览的任何网页。

const RULE_ID = 1

async function installFrameRule() {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules: [
      {
        id: RULE_ID,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [
            { header: 'x-frame-options', operation: 'remove' },
            { header: 'content-security-policy', operation: 'remove' },
            { header: 'content-security-policy-report-only', operation: 'remove' },
          ],
        },
        condition: { resourceTypes: ['sub_frame'], initiatorDomains: [chrome.runtime.id] },
      },
    ],
  })
}

chrome.runtime.onInstalled.addListener(() => installFrameRule())
chrome.runtime.onStartup.addListener(() => installFrameRule())

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') })
})
