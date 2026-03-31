import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#667EEA',
          colorBgContainer: 'rgba(255,255,255,0.04)',
          colorBgElevated: '#1A1040',
          colorBorder: 'rgba(102,126,234,0.15)',
          colorText: 'rgba(255,255,255,0.87)',
          colorTextSecondary: 'rgba(255,255,255,0.6)',
          borderRadius: 8,
          fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 14,
        },
        components: {
          Card: {
            colorBgContainer: 'rgba(255,255,255,0.04)',
            colorBorderSecondary: 'rgba(102,126,234,0.12)',
          },
          Table: {
            colorBgContainer: 'rgba(255,255,255,0.04)',
            colorBorderSecondary: 'rgba(102,126,234,0.12)',
            headerBg: 'rgba(102,126,234,0.1)',
            rowHoverBg: 'rgba(102,126,234,0.08)',
          },
          Menu: {
            colorBgContainer: 'transparent',
          },
          Modal: {
            colorBgElevated: '#1A1040',
            colorBgContainer: 'rgba(255,255,255,0.04)',
          },
          Select: {
            colorBgContainer: 'rgba(255,255,255,0.06)',
          },
          Input: {
            colorBgContainer: 'rgba(255,255,255,0.06)',
          },
          DatePicker: {
            colorBgContainer: 'rgba(255,255,255,0.06)',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
