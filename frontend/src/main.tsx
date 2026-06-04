import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN'; // 中文语言包
import App from './App';
import './index.css';

/**
 * 应用入口 - 挂载 React 根组件
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 全局配置：中文语言 + Antd App 包裹（解决 message 静态方法警告） */}
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff' } }}>
      <AntdApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>,
);