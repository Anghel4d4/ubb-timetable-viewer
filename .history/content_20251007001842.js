let settings = null;

chrome.storage.sync.get(['timetableUrl', 'group', 'semigroup', 'subjects'], (result) => {
  settings = result;

  if (shouldFilterCurrentPage()) {
    applyFilter();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'applyFilter') {
    chrome.storage.sync.get(['timetableUrl', 'group', 'semigroup', 'subjects'], (result) => {
      settings = result;
      applyFilter();
      sendResponse({ success: true });
    });
    return true;
  }
});

function shouldFilterCurrentPage() {
  if (!settings || !settings.timetableUrl || !settings.group) {
    return false;
  }

  const currentUrl = window.location.href;
  const configuredUrl = settings.timetableUrl;

  return currentUrl === configuredUrl;
}

function applyFilter() {
  if (!settings || !settings.group) {
    return;
  }

  const group = settings.group;
  const semigroup = settings.semigroup;
  const subjects = settings.subjects || [];

  const groupHeaders = document.querySelectorAll('h1');
  groupHeaders.forEach((header) => {
    const headerText = header.textContent;
    if (headerText.includes('Grupa')) {
      if (headerText.includes(`Grupa ${group}`)) {
        header.style.display = '';
        header.style.backgroundColor = '#4CAF50';
        header.style.color = 'white';
        header.style.padding = '10px';
      } else {
        header.style.display = 'none';
      }
    }
  });

  const tables = document.querySelectorAll('table');
  let currentGroup = null;

  tables.forEach((table) => {
    let element = table.previousElementSibling;
    while (element) {
      if (element.tagName === 'H1' && element.textContent.includes('Grupa')) {
        const match = element.textContent.match(/Grupa (\d+)/);
        if (match) {
          currentGroup = match[1];
        }
        break;
      }
      element = element.previousElementSibling;
    }

    if (currentGroup !== group) {
      table.style.display = 'none';
      return;
    }

    const rows = table.querySelectorAll('tr');

    rows.forEach((row, index) => {
      const isHeader = row.querySelector('th');
      if (isHeader) {
        return;
      }

      const cells = row.querySelectorAll('td');
      if (cells.length === 0) {
        return;
      }

      let shouldShow = false;

      if (cells.length >= 5) {
        const formatiaCell = cells[4]; // Formatia column
        const formatiaText = formatiaCell.textContent.trim();
        const disciplineCell = cells.length >= 7 ? cells[6] : null; // Disciplina column

        const isWholeYear = formatiaText === 'I3'; // Whole year courses
        const isOurGroup = formatiaText === group;
        const isOurSemigroup = semigroup ? formatiaText === `${group}/${semigroup}` : false;

        if (isWholeYear || isOurGroup || isOurSemigroup) {
          if (subjects.length === 0) {
            shouldShow = true;
          } else if (disciplineCell) {
            const disciplineText = disciplineCell.textContent.toLowerCase();
            shouldShow = subjects.some(s => disciplineText.includes(s.toLowerCase()));
          }
        }
      }

      if (shouldShow) {
        row.style.display = '';

        if (cells.length >= 5) {
          const formatiaText = cells[4].textContent.trim();
          if (semigroup && formatiaText === `${group}/${semigroup}`) {
            row.style.backgroundColor = '#c8e6c9';
          } else if (formatiaText === group) {
            row.style.backgroundColor = '#e8f5e9';
          } else {
            row.style.backgroundColor = '#f1f8e9';
          }
        }
      } else {
        row.style.display = 'none';
      }
    });
  });

  showNotification();
}

function showNotification() {
  if (document.getElementById('ubb-filter-notification')) {
    return;
  }

  const notification = document.createElement('div');
  notification.id = 'ubb-filter-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 4px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
  `;

  const groupText = settings.semigroup
    ? `Group ${settings.group}/${settings.semigroup}`
    : `Group ${settings.group}`;

  notification.textContent = `Timetable filtered for ${groupText}`;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transition = 'opacity 0.5s';
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}
