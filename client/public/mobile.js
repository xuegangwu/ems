/* EnOS Mobile JS — Light Theme */

(function() {
  /* Only apply mobile layout on small screens */
  if (window.innerWidth > 768) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(function() {});
    }
    return;
  }

  /* ── Show mobile elements ─────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = [
    '.mobile-header { display: flex !important; }',
    '.bottom-tab-bar { display: flex !important; }',
    '.ant-layout-content { padding-top: 52px !important; }',
    'body { background: #EEF2F8 !important; }'
  ].join('\n');
  document.head.appendChild(style);

  /* ── Page title map ──────────────────────────────────────────── */
  var pageTitles = {
    '/dashboard':        '总览',
    '/digital-twin':     '数字孪生',
    '/monitoring':       '实时监控',
    '/monitor':          '监控中心',
    '/agent-pipeline':   'AI流水线',
    '/agent-console':    'Agent控制台',
    '/ai-prediction':    'AI预测',
    '/schedule':         'AI调度',
    '/vpp':              'AI交易策略',
    '/electricity-trade':'电力交易',
    '/station-trade':    '电站交易',
    '/stations':         '电站管理',
    '/operation':        '运营管理',
    '/alerts':           '告警管理',
    '/work-order':       'AI创建工单',
    '/tools':            '工具箱',
    '/api-explorer':     'API Explorer',
    '/lab':              'Solaripple Lab',
    '/projects':         '项目案例',
    '/solutions':        '解决方案',
    '/tech':             '技术研发',
    '/about':            '关于',
    '/history':          '历史数据',
    '/login':            '登录',
    '/login-enos':       '登录'
  };

  /* ── Tab bar ──────────────────────────────────────────────────── */
  var tabBar = document.createElement('div');
  tabBar.className = 'bottom-tab-bar';
  tabBar.id = 'bottomTabBar';

  var tabs = [
    { path: '/dashboard',        label: '总览',      icon: '📊' },
    { path: '/monitor',          label: '监控',      icon: '📡' },
    { path: '/agent-pipeline',   label: 'AI流水线',  icon: '🔄' },
    { path: '/ai-prediction',    label: 'AI预测',    icon: '🤖' },
    { path: '/schedule',          label: 'AI调度',    icon: '⚡' },
    { path: '/work-order',        label: '工单',      icon: '🛠️' },
  ];

  var currentPath = window.location.pathname.replace(/\/$/, '') || '/dashboard';

  tabs.forEach(function(tab) {
    var item = document.createElement('a');
    item.className = 'bottom-tab-item' +
      (currentPath.startsWith(tab.path) || (tab.path !== '/dashboard' && currentPath.startsWith(tab.path)) ? ' active' : '');
    item.href = tab.path;
    item.innerHTML = '<span class="tab-icon">' + tab.icon + '</span><span>' + tab.label + '</span>';
    tabBar.appendChild(item);
  });

  document.body.appendChild(tabBar);

  /* ── Page title sync ───────────────────────────────────────────── */
  var mobileTitle = document.getElementById('mobileTitle');
  if (mobileTitle) {
    for (var key in pageTitles) {
      if (currentPath.startsWith(key)) {
        mobileTitle.textContent = pageTitles[key];
        break;
      }
    }
  }

  /* ── Back button ───────────────────────────────────────────────── */
  var backBtn = document.getElementById('mobileBack');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      var prev = document.referrer;
      if (prev && prev.includes(window.location.hostname)) {
        history.back();
      } else {
        window.location.href = '/dashboard';
      }
    });
  }

  /* ── Tab bar highlight on navigation ───────────────────────────── */
  var lastPath = currentPath;
  setInterval(function() {
    var cur = window.location.pathname.replace(/\/$/, '') || '/dashboard';
    if (cur !== lastPath) {
      lastPath = cur;
      tabBar.querySelectorAll('.bottom-tab-item').forEach(function(item) {
        var p = item.getAttribute('href').replace(/\/$/, '') || '/dashboard';
        var isActive = cur.startsWith(p) || (p !== '/dashboard' && cur.startsWith(p));
        if (isActive) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      /* Update title */
      if (mobileTitle) {
        for (var key in pageTitles) {
          if (cur.startsWith(key)) {
            mobileTitle.textContent = pageTitles[key];
            break;
          }
        }
      }
    }
  }, 200);

  /* ── Service Worker ────────────────────────────────────────────── */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  }
})();
