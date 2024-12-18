import React from 'react';
import styled from 'styled-components';
import { AppDisplay, AppDisplayProps } from '../AppDisplay/AppDisplay';

export interface AppContainerProps {
  children: React.ReactElement<AppDisplayProps>[];
  direction?: 'rtl' | 'ltr';
}

const Container = styled.div<{ $direction: 'rtl' | 'ltr' }>`
  display: grid;
  grid-template-columns: repeat(auto-fill, 100px);
  gap: 20px;
  padding: 20px;
  position: absolute;
  top: 0;
  right: 0;
  width: min-content;
  height: calc(100vh - 100px);
  justify-content: end;
  grid-auto-flow: column;
  grid-template-rows: repeat(auto-fill, minmax(100px, 1fr));
  grid-auto-columns: 100px;
  direction: ${props => props.$direction};
`;

export const AppContainer: React.FC<AppContainerProps> = ({
  children,
  direction = 'rtl'
}) => {
  // 验证子组件类型
  React.Children.forEach(children, child => {
    if (!React.isValidElement(child) || child.type !== AppDisplay) {
      throw new Error('AppContainer children must be AppDisplay components');
    }
  });

  return (
    <Container $direction={direction}>
      {children}
    </Container>
  );
}; 