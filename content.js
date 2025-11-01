// 监听来自background.js的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showDialog') {
    // 收集页面资源
    const resources = collectResources();
    // 显示下载对话框
    showDownloadDialog(resources);
    sendResponse({ success: true });
  }
  return true;
});

// 收集页面资源
function collectResources() {
  const resources = [];
  
  // 收集图片
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    if (img.src) {
      resources.push({
        id: 'img_' + index,
        name: img.alt || 'Image ' + (index + 1),
        type: 'image',
        url: img.src,
        size: 'Unknown',
        filename: getFilenameFromUrl(img.src)
      });
    }
  });
  
  // 收集视频
  const videos = document.querySelectorAll('video');
  videos.forEach((video, index) => {
    if (video.src) {
      resources.push({
        id: 'video_' + index,
        name: 'Video ' + (index + 1),
        type: 'video',
        url: video.src,
        size: 'Unknown',
        filename: getFilenameFromUrl(video.src)
      });
    }
  });
  
  // 收集表格数据
  const tables = document.querySelectorAll('table');
  tables.forEach((table, index) => {
    resources.push({
      id: 'table_' + index,
      name: 'Table ' + (index + 1),
      type: 'table',
      url: 'data:text/csv;charset=utf-8,' + encodeURIComponent(convertTableToCsv(table)),
      size: 'Unknown',
      filename: 'table_' + (index + 1) + '.csv'
    });
  });
  
  // 收集链接中的媒体文件
  const links = document.querySelectorAll('a[href]');
  links.forEach((link, index) => {
    const href = link.href;
    const mediaExtensions = /\.(jpg|jpeg|png|gif|webp|mp4|webm|pdf)$/i;
    
    if (mediaExtensions.test(href)) {
      // 检查是否已收集
      const isDuplicate = resources.some(r => r.url === href);
      if (!isDuplicate) {
        resources.push({
          id: 'link_' + index,
          name: link.textContent.trim() || 'Linked Media ' + (index + 1),
          type: 'media',
          url: href,
          size: 'Unknown',
          filename: getFilenameFromUrl(href)
        });
      }
    }
  });
  
  return resources;
}

// 从URL提取文件名
function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    return filename || 'download';
  } catch (e) {
    return 'download';
  }
}

// 将表格转换为CSV格式
function convertTableToCsv(table) {
  const rows = table.querySelectorAll('tr');
  const csv = [];
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('th, td');
    const rowData = Array.from(cells).map(cell => {
      // 清理单元格文本
      const text = cell.textContent.trim().replace(/"/g, '""');
      // 用引号包围包含逗号或换行符的文本
      return text.includes(',') || text.includes('\n') ? '"' + text + '"' : text;
    });
    csv.push(rowData.join(','));
  });
  
  return csv.join('\n');
}

// 显示下载对话框
function showDownloadDialog(resources) {
  // 移除可能存在的旧对话框
  const oldDialog = document.getElementById('easy-downloader-dialog');
  if (oldDialog) oldDialog.remove();
  
  // 创建对话框容器
  const dialogContainer = document.createElement('div');
  dialogContainer.id = 'easy-downloader-dialog';
  dialogContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
    font-family: Arial, sans-serif;
  `;
  
  // 创建对话框内容
  const dialogContent = document.createElement('div');
  dialogContent.style.cssText = `
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    width: 90%;
    max-width: 800px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;
  
  // 创建对话框标题
  const dialogTitle = document.createElement('h2');
  dialogTitle.textContent = '选择要下载的资源';
  dialogTitle.style.marginTop = '0';
  
  // 创建资源列表容器
  const listContainer = document.createElement('div');
  listContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    margin: 20px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
  `;
  
  // 创建表格
  const table = document.createElement('table');
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
  `;
  
  // 创建表头
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr style="background-color: #f5f5f5;">
      <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">选择</th>
      <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">名称</th>
      <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">类型</th>
      <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">URL</th>
      <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">文件大小</th>
    </tr>
  `;
  
  // 创建表体
  const tbody = document.createElement('tbody');
  
  // 为每个资源创建行
  resources.forEach(resource => {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid #eee';
    row.innerHTML = `
      <td style="padding: 10px;">
        <input type="checkbox" id="${resource.id}" data-url="${resource.url}" data-filename="${resource.filename}">
      </td>
      <td style="padding: 10px;">${resource.name}</td>
      <td style="padding: 10px;">${resource.type}</td>
      <td style="padding: 10px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        <a href="${resource.url}" target="_blank" style="color: #1a73e8; text-decoration: none;">${resource.url}</a>
      </td>
      <td style="padding: 10px;">${resource.size}</td>
    `;
    tbody.appendChild(row);
  });
  
  // 组装表格
  table.appendChild(thead);
  table.appendChild(tbody);
  listContainer.appendChild(table);
  
  // 创建按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  `;
  
  // 创建全选按钮
  const selectAllButton = document.createElement('button');
  selectAllButton.textContent = '全选';
  selectAllButton.style.cssText = `
    padding: 8px 16px;
    background-color: #f1f1f1;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  `;
  selectAllButton.addEventListener('click', () => {
    const checkboxes = tbody.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = true;
    });
  });
  
  // 创建取消全选按钮
  const deselectAllButton = document.createElement('button');
  deselectAllButton.textContent = '取消全选';
  deselectAllButton.style.cssText = `
    padding: 8px 16px;
    background-color: #f1f1f1;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  `;
  deselectAllButton.addEventListener('click', () => {
    const checkboxes = tbody.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
  });
  
  // 创建取消按钮
  const cancelButton = document.createElement('button');
  cancelButton.textContent = '取消';
  cancelButton.style.cssText = `
    padding: 8px 16px;
    background-color: #f1f1f1;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  `;
  cancelButton.addEventListener('click', () => {
    dialogContainer.remove();
  });
  
  // 创建下载按钮
  const downloadButton = document.createElement('button');
  downloadButton.textContent = '下载所选';
  downloadButton.style.cssText = `
    padding: 8px 16px;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  downloadButton.addEventListener('click', () => {
    const selectedResources = [];
    const checkedBoxes = tbody.querySelectorAll('input[type="checkbox"]:checked');
    
    checkedBoxes.forEach(checkbox => {
      selectedResources.push({
        url: checkbox.getAttribute('data-url'),
        filename: checkbox.getAttribute('data-filename')
      });
    });
    
    if (selectedResources.length > 0) {
      // 发送消息到background.js进行下载
      chrome.runtime.sendMessage({
        action: 'downloadResources',
        resources: selectedResources
      }, (response) => {
        if (response && response.success) {
          alert('开始下载 ' + selectedResources.length + ' 个资源');
        }
        dialogContainer.remove();
      });
    } else {
      alert('请至少选择一个资源');
    }
  });
  
  // 组装按钮容器
  buttonContainer.appendChild(selectAllButton);
  buttonContainer.appendChild(deselectAllButton);
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(downloadButton);
  
  // 组装对话框内容
  dialogContent.appendChild(dialogTitle);
  dialogContent.appendChild(listContainer);
  dialogContent.appendChild(buttonContainer);
  
  // 组装对话框
  dialogContainer.appendChild(dialogContent);
  
  // 添加到文档中
  document.body.appendChild(dialogContainer);
  
  // 点击对话框外部关闭
  dialogContainer.addEventListener('click', (e) => {
    if (e.target === dialogContainer) {
      dialogContainer.remove();
    }
  });
}