// 当扩展安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'easyDownloader',
    title: 'EasyDownloader',
    contexts: ['all']
  });
});

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'easyDownloader') {
    // 向当前标签页发送消息，获取页面资源
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }, () => {
      chrome.tabs.sendMessage(tab.id, { action: 'showDialog' });
    });
  }
});

// 监听来自content.js的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'downloadResources') {
    const resources = message.resources;
    
    // 批量下载资源
    resources.forEach(resource => {
      chrome.downloads.download({
        url: resource.url,
        filename: resource.filename || getFilenameFromUrl(resource.url),
        saveAs: false
      }, (downloadId) => {
        console.log('Download started for:', resource.url, 'with ID:', downloadId);
      });
    });
    
    sendResponse({ success: true });
  }
  
  return true; // 保持消息通道开放
});

// 从URL中提取文件名
function getFilenameFromUrl(url) {
  const urlParts = url.split('/');
  let filename = urlParts[urlParts.length - 1];
  
  // 如果文件名不包含扩展名，添加默认扩展名
  if (!filename.includes('.')) {
    const mimeType = getMimeTypeFromUrl(url);
    filename += '.' + mimeType.split('/')[1];
  }
  
  return filename;
}

// 从URL推断MIME类型
function getMimeTypeFromUrl(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) return 'image/jpeg';
  if (urlLower.includes('.png')) return 'image/png';
  if (urlLower.includes('.gif')) return 'image/gif';
  if (urlLower.includes('.webp')) return 'image/webp';
  if (urlLower.includes('.mp4')) return 'video/mp4';
  if (urlLower.includes('.webm')) return 'video/webm';
  if (urlLower.includes('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}