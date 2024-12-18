import React from 'react';
import styled from 'styled-components';
import { useWindowManager, WindowManager } from '../components/Window/WindowManager';
import { Dock } from '../components/Dock/Dock';
import { AppDisplay } from '../components/AppDisplay/AppDisplay';
import { demoIcons } from './demoIcons';
import { AppContainer } from '../components/AppContainer/AppContainer';

const DemoContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background: var(--window-background);
  position: relative;
  overflow: hidden;
`;

// 将主要内容移到单独的组件中
const DesktopContent = () => {
  const [activeApp, setActiveApp] = React.useState<string | null>(null);
  const [dockAutoHide] = React.useState(false);
  const { createWindow } = useWindowManager();

  const desktopApps = [
    { id: 'finder', name: '访达', icon: demoIcons.finder },
    { id: 'safari', name: 'Safari', icon: demoIcons.safari },
    { id: 'messages', name: '信息', icon: demoIcons.messages },
    { id: 'mail', name: '邮件', icon: demoIcons.mail },
    { id: 'photos', name: '照片', icon: demoIcons.photos },
    { id: 'music', name: '音乐', icon: demoIcons.music },
    { id: 'settings', name: '系统设置', icon: demoIcons.settings },
    { id: 'notes', name: '备忘录', icon: demoIcons.notes },
    { id: 'calendar', name: '日历', icon: demoIcons.calendar },
    { id: 'calculator', name: '计算器', icon: demoIcons.calculator }
  ];

  const handleAppClick = (appId: string, appName: string) => {
    setActiveApp(appId);
    
    createWindow({
      title: appName,
      content: (
        <div style={{ padding: '20px' }}>
          <h2>{appName} 应用窗口</h2>
          <p>这是 {appName} 的示例内容。</p>
        </div>
      ),
      defaultWidth: 600,
      defaultHeight: 400,
      defaultPosition: {
        x: Math.random() * (window.innerWidth - 600),
        y: Math.random() * (window.innerHeight - 400)
      },
      onClose: () => {
        setActiveApp(null);
      },
      onMinimized: () => {
        setActiveApp(null);
      }
    });
  };

  return (
    <DemoContainer>
      <AppContainer>
        {desktopApps.slice().reverse().map(app => (
          <AppDisplay
            key={app.id}
            icon={app.icon}
            name={app.name}
            isActive={activeApp === app.id}
            onClick={() => handleAppClick(app.id, app.name)}
            showName={true}
            size="medium"
            enableHoverScale={true}
          />
        ))}
      </AppContainer>

      {/* Dock 栏 */}
      <Dock position="bottom" autoHide={dockAutoHide}>
        {desktopApps.slice(0, 5).map(app => (
          <AppDisplay
            key={app.id}
            icon={app.icon}
            name={app.name}
            isActive={activeApp === app.id}
            onClick={() => handleAppClick(app.id, app.name)}
          />
        ))}
      </Dock>
    </DemoContainer>
  );
};

const App = () => {
  return (
    <WindowManager>
      <DesktopContent />
    </WindowManager>
  );
};

export default App; 