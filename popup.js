document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['timetableUrl', 'group', 'semigroup', 'subjects'], (result) => {
    if (result.timetableUrl) {
      document.getElementById('timetableUrl').value = result.timetableUrl;
    }
    if (result.group) {
      document.getElementById('group').value = result.group;
    }
    if (result.semigroup) {
      document.getElementById('semigroup').value = result.semigroup;
    }
    if (result.subjects) {
      document.getElementById('subjects').value = result.subjects.join('\n');
    }
  });
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const timetableUrl = document.getElementById('timetableUrl').value.trim();
  const group = document.getElementById('group').value.trim();
  const semigroup = document.getElementById('semigroup').value.trim();
  const subjectsText = document.getElementById('subjects').value.trim();
  const subjects = subjectsText ? subjectsText.split('\n').map(s => s.trim()).filter(s => s) : [];

  if (!timetableUrl) {
    showStatus('Please enter a timetable URL', 'error');
    return;
  }

  if (!group) {
    showStatus('Please enter your group number', 'error');
    return;
  }

  chrome.storage.sync.set({
    timetableUrl,
    group,
    semigroup,
    subjects
  }, () => {
    showStatus('Settings saved successfully!', 'success');
  });
});

document.getElementById('applyBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'applyFilter' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Please refresh the timetable page first', 'error');
      } else if (response && response.success) {
        showStatus('Filter applied successfully!', 'success');
      } else {
        showStatus('Failed to apply filter', 'error');
      }
    });
  });
});

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;

  setTimeout(() => {
    status.className = 'status';
  }, 3000);
}
