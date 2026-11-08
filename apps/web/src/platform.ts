/** 运行环境判断：Web 版 or 浏览器扩展 */
export const IS_EXTENSION: boolean =
  __GUIYE_TARGET__ === 'extension' || (typeof chrome !== 'undefined' && !!chrome.runtime?.id && location.protocol.endsWith('-extension:'))

/** 扩展根地址，用于 _favicon API */
export const EXTENSION_BASE = IS_EXTENSION && typeof chrome !== 'undefined' && chrome.runtime?.id ? `chrome-extension://${chrome.runtime.id}` : ''

export const IS_MOBILE = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
