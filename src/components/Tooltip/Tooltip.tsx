import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import styled from 'styled-components';

export interface TooltipProps {
    content: string;
    children: React.ReactNode;
    disabled?: boolean;
}

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const TooltipContent = styled.div<{
    $x: number;
    $y: number;
    $shouldAnimate: boolean
}>`
  position: fixed;
  top: ${props => props.$y}px;
  left: ${props => props.$x}px;
  transform: translate(-50%, ${props => props.$shouldAnimate ? '-4px' : '0'});
  background: var(--tooltip-background);
  color: var(--tooltip-text);
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 13px;
  white-space: nowrap;
  opacity: 0;
  transition: ${props => props.$shouldAnimate ? 'all 0.15s ease' : 'none'};
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
               "Helvetica Neue", Arial, sans-serif;
  font-weight: 500;
  z-index: 9999;

  &.visible {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
    border-style: solid;
    border-width: 0 4px 4px 4px;
    border-color: transparent transparent var(--tooltip-background) transparent;
  }
`;

export const Tooltip: React.FC<TooltipProps> = ({
                                                    content,
                                                    children,
                                                    disabled = false
                                                }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [position, setPosition] = useState({x: 0, y: 0});
    const wrapperRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number>();

    useEffect(() => {
        if (!wrapperRef.current) return;

        const updatePosition = () => {
            const rect = wrapperRef.current?.getBoundingClientRect();
            if (rect) {
                setPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 8
                });
            }
        };

        const handleMouseEnter = () => {
            updatePosition();
            timeoutRef.current = window.setTimeout(() => {
                setIsVisible(true);
                setShouldAnimate(true);
            }, 200);
        };

        const handleMouseLeave = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            setIsVisible(false);
        };

        const element = wrapperRef.current;
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            element.removeEventListener('mouseenter', handleMouseEnter);
            element.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, []);

    if (disabled) return <>{children}</>;

    return (
        <>
            <TooltipWrapper ref={wrapperRef}>
                {children}
            </TooltipWrapper>
            {createPortal(
                <TooltipContent
                    $x={position.x}
                    $y={position.y}
                    $shouldAnimate={shouldAnimate}
                    className={isVisible ? 'visible' : ''}
                >
                    {content}
                </TooltipContent>,
                document.body
            )}
        </>
    );
}; 