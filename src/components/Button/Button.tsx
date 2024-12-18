import React from 'react';
import styled from 'styled-components';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    className?: string;
}

const StyledButton = styled.button<{ $variant: ButtonVariant; $size: ButtonSize }>`
  border: none;
  border-radius: var(--button-radius);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  /* Size styles */
  padding: ${props => {
    switch (props.$size) {
        case 'small':
            return '6px 12px';
        case 'large':
            return '12px 24px';
        default:
            return '8px 16px';
    }
}};
  font-size: ${props => {
    switch (props.$size) {
        case 'small':
            return '12px';
        case 'large':
            return '16px';
        default:
            return '14px';
    }
}};

  /* Variant styles */
  background: var(--button-${props => props.$variant});
  color: var(--button-text);

  &:hover {
    opacity: 0.9;
  }

  &:active {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Button: React.FC<ButtonProps> = ({
                                                  children,
                                                  variant = 'primary',
                                                  size = 'medium',
                                                  onClick,
                                                  disabled,
                                                  className,
                                              }) => {
    return (
        <StyledButton
            $variant={variant}
            $size={size}
            onClick={onClick}
            disabled={disabled}
            className={className}
        >
            {children}
        </StyledButton>
    );
}; 