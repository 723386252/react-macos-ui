import React from 'react';
import styled from 'styled-components';

type ButtonType = 'close' | 'minimize' | 'fullscreen';

export interface WindowButtonProps {
    type: ButtonType;
    onClick?: () => void;
    title?: string;
    disabled?: boolean;
    children?: React.ReactNode;
}

const ButtonWrapper = styled.button<{ $type: ButtonType; $disabled?: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.$disabled ? 'default' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  background: ${props => {
    switch (props.$type) {
        case 'close':
            return 'var(--button-close)';
        case 'minimize':
            return 'var(--button-minimize)';
        case 'fullscreen':
            return 'var(--button-fullscreen)';
    }
}};
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => {
    switch (props.$type) {
        case 'close':
            return 'var(--button-close-hover)';
        case 'minimize':
            return 'var(--button-minimize-hover)';
        case 'fullscreen':
            return 'var(--button-fullscreen-hover)';
    }
}};
  }

  svg {
    width: 8px;
    height: 8px;
    opacity: 0;
    transition: opacity 0.2s ease;
    color: var(--button-icon);
  }

  &:hover:not(:disabled) svg {
    opacity: 1;
  }
`;

export const WindowButton: React.FC<WindowButtonProps> = ({
                                                              type,
                                                              onClick,
                                                              title,
                                                              disabled,
                                                              children
                                                          }) => {
    return (
        <ButtonWrapper
            $type={type}
            onClick={onClick}
            title={title}
            disabled={disabled}
            $disabled={disabled}
        >
            {!disabled && children}
        </ButtonWrapper>
    );
}; 