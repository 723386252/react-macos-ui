import React from 'react';
import styled from 'styled-components';

export interface AppDisplayProps {
    icon: string | React.ReactNode;
    name: string;
    onClick?: () => void;
    isActive?: boolean;
    showName?: boolean;
    size?: 'small' | 'medium' | 'large';
    scale?: number;
    enableHoverScale?: boolean;
}

const DisplayContainer = styled.div<{
    $size: 'small' | 'medium' | 'large',
    $showName: boolean,
    $enableHoverScale: boolean
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform: scale(var(--app-scale));
  width: ${props => {
    switch (props.$size) {
        case 'small':
            return '48px';
        case 'large':
            return '96px';
        default:
            return '64px';
    }
}};
  height: fit-content;
  padding: 4px;
  border-radius: 8px;

  &:hover {
    transform: scale(calc(var(--app-scale) * ${props => props.$enableHoverScale ? 1.1 : 1}));
  }

  &:active {
    transform: scale(calc(var(--app-scale) * ${props => props.$enableHoverScale ? 0.95 : 1}));
  }
`;

const IconContainer = styled.div<{
    $size: 'small' | 'medium' | 'large',
    $isActive?: boolean
}>`
  width: ${props => {
    switch (props.$size) {
        case 'small':
            return '40px';
        case 'large':
            return '80px';
        default:
            return '56px';
    }
}};
  height: ${props => {
    switch (props.$size) {
        case 'small':
            return '40px';
        case 'large':
            return '80px';
        default:
            return '56px';
    }
}};
  border-radius: 12px;
  overflow: hidden;
  background: ${props => props.$isActive ? 'var(--app-display-active-bg)' : 'var(--app-display-bg)'};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Name = styled.div<{ $size: 'small' | 'medium' | 'large' }>`
  font-size: ${props => {
    switch (props.$size) {
        case 'small':
            return '11px';
        case 'large':
            return '14px';
        default:
            return '12px';
    }
}};
  color: var(--text-primary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  user-select: none;
`;

const ActiveIndicator = styled.div<{ $size: 'small' | 'medium' | 'large' }>`
  width: ${props => props.$size === 'small' ? '3px' : '4px'};
  height: ${props => props.$size === 'small' ? '3px' : '4px'};
  border-radius: 50%;
  background: var(--app-display-active-indicator);
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
`;

export const AppDisplay: React.FC<AppDisplayProps> = ({
                                                          icon,
                                                          name,
                                                          onClick,
                                                          isActive = false,
                                                          showName = true,
                                                          size = 'medium',
                                                          scale = 1,
                                                          enableHoverScale = true
                                                      }) => {
    return (
        <DisplayContainer
            onClick={onClick}
            $size={size}
            $showName={showName}
            $enableHoverScale={enableHoverScale}
            style={{
                '--app-scale': scale
            } as React.CSSProperties}
        >
            <IconContainer $size={size} $isActive={isActive}>
                {typeof icon === 'string' ? (
                    <img src={icon} alt={name} draggable={false}/>
                ) : (
                    icon
                )}
                {isActive && <ActiveIndicator $size={size}/>}
            </IconContainer>
            {showName && <Name $size={size}>{name}</Name>}
        </DisplayContainer>
    );
}; 