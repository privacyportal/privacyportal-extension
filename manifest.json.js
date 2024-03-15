import { version } from './package.json';

export default ({ env }) => ({
  name: env.VITE_NAME,
  author: env.VITE_AUTHOR_EMAIL,
  homepage_url: env.VITE_HOMEPAGE_URL,
  description: 'Your Gateway To Online Privacy',
  version: version,
  manifest_version: 3,
  permissions: ['activeTab', 'identity', 'storage', 'notifications'],
  host_permissions: ['<all_urls>'],
  incognito: 'spanning',
  icons: {
    16: '/favicons/icon-16.png',
    32: '/favicons/icon-32.png',
    48: '/favicons/icon-48.png',
    128: '/favicons/icon-128.png',
    256: '/favicons/icon-256.png'
  },
  action: {
    default_icon: {
      16: '/favicons/icon-16.png',
      32: '/favicons/icon-32.png',
      48: '/favicons/icon-48.png',
      128: '/favicons/icon-128.png',
      256: '/favicons/icon-256.png'
    },
    default_title: env.VITE_NAME,
    default_popup: 'index.html'
  },
  background: {
    type: 'module',
    service_worker: 'assets/worker.js',
    ...(env.VITE_SET_BACKGROUND_SCRIPTS === 'true' && {
      scripts: ['assets/worker.js'],
    })
  },
  content_scripts: [
    {
      matches: ['https://*/*'],
      js: ['assets/content_script.js'],
      run_at: 'document_idle'
    }
  ],
  commands: {
    'privacy-address': {
      suggested_key: {
        default: 'Ctrl+Shift+9'
      },
      description: 'Insert a new Privacy Address to the selected input field'
    }
  },
  key: env.VITE_MANIFEST_KEY,
  ...(env.VITE_BROWSER_SPECIFIC_SETTINGS_ID && {
    browser_specific_settings: {
      gecko: {
        id: env.VITE_BROWSER_SPECIFIC_SETTINGS_ID,
        strict_min_version: '120.0'
      },
      gecko_android: {
        id: env.VITE_BROWSER_SPECIFIC_SETTINGS_ID,
        strict_min_version: '120.0'
      }
    }
  })
});
