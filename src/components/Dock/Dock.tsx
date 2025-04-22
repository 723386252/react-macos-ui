import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import styled from 'styled-components';
import {AppDisplayProps} from '../AppDisplay/AppDisplay';
import {useMouse} from 'react-use';

export interface DockProps {
    position?: 'bottom' | 'left' | 'right';
    children?: React.ReactElement<AppDisplayProps>[];
    autoHide?: boolean;
    scale?: number;
}

const DockContainer = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 120px; // 检测区域高度
  z-index: 1000;
  overflow: hidden;
  pointer-events: auto;
`;

const DockWrapper = styled.div<{
    $position: 'bottom' | 'left' | 'right',
    $visible: boolean
}>`
  position: absolute;
  ${props => {
    switch (props.$position) {
        case 'left':
            return 'left: 16px; top: 50%; transform: translateY(-50%);';
        case 'right':
            return 'right: 16px; top: 50%; transform: translateY(-50%);';
        default:
            return `
          left: 50%; 
          bottom: ${props.$visible ? '16px' : '-100px'}; 
          transform: translateX(-50%);
          transition: bottom 0.35s cubic-bezier(0.4, 0.14, 0.3, 1);
        `;
    }
}}
  padding: var(--dock-padding);
  border-radius: var(--dock-border-radius);
  background: var(--dock-background);
  backdrop-filter: blur(var(--dock-backdrop-blur));
  box-shadow: var(--dock-shadow);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: var(--dock-border-radius);
    background: var(--dock-border-gradient);
    -webkit-mask: linear-gradient(#fff 0 0) content-box,
                 linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
`;

const DockContent = styled.div<{ $position: 'bottom' | 'left' | 'right' }>`
  display: flex;
  flex-direction: ${props => props.$position === 'bottom' ? 'row' : 'column'};
  gap: 8px;
  position: relative;
`;

const MIN_SCALE = 1;
const HORIZONTAL_INFLUENCE = 80;
const VERTICAL_INFLUENCE = 50;

export const Dock: React.FC<DockProps> = ({
                                              children = [],
                                              position = 'bottom',
                                              autoHide = false,
                                              scale = 1.4
                                          }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dockRef = useRef<HTMLDivElement>(null);
    const containerMouse = useMouse(containerRef as React.RefObject<Element>);
    const dockMouse = useMouse(dockRef as React.RefObject<Element>);
    const [isVisible, setIsVisible] = useState(!autoHide);


    const getScale = useCallback((index: number) => {
        if (!dockRef.current || dockMouse.elX === null || dockMouse.elY === null) return MIN_SCALE;

        const dock = dockRef.current;
        const rect = dock.getBoundingClientRect();
        const isHorizontal = position === 'bottom';

        if (isHorizontal) {
            const itemWidth = rect.width / React.Children.count(children);
            const itemCenter = itemWidth * (index + 0.5);
            const horizontalDistance = Math.abs(dockMouse.elX - itemCenter);
            const verticalDistance = Math.abs(dockMouse.elY - rect.height / 2);

            const horizontalScale = Math.max(0, 1 - (horizontalDistance / HORIZONTAL_INFLUENCE));
            const verticalScale = Math.max(0, 1 - (verticalDistance / VERTICAL_INFLUENCE));

            const combinedScale = horizontalScale * verticalScale;
            return MIN_SCALE + (scale - MIN_SCALE) * combinedScale;
        } else {
            const itemHeight = rect.height / React.Children.count(children);
            const itemCenter = itemHeight * (index + 0.5);
            const verticalDistance = Math.abs(dockMouse.elY - itemCenter);
            const horizontalDistance = Math.abs(dockMouse.elX - rect.width / 2);

            const verticalScale = Math.max(0, 1 - (verticalDistance / HORIZONTAL_INFLUENCE));
            const horizontalScale = Math.max(0, 1 - (horizontalDistance / VERTICAL_INFLUENCE));

            const combinedScale = verticalScale * horizontalScale;
            return MIN_SCALE + (scale - MIN_SCALE) * combinedScale;
        }
    }, [dockMouse.elX, dockMouse.elY, children, position, scale]);

    const isMouseInTriggerArea = useMemo(() => {
        if (!containerRef.current) return false;
        return containerMouse.elY > containerRef.current.clientHeight * 0.5;
    }, [containerMouse.elY]);

    const isMouseInDock = useMemo(() => {
        if (!dockRef.current) return false;
        return dockMouse.elX >= 0 && dockMouse.elY >= 0 && dockMouse.elX <= dockRef.current.clientWidth && dockMouse.elY <= dockRef.current.clientHeight;
    }, [dockMouse.elX, dockMouse.elY]);

    // 处理自动隐藏逻辑
    useEffect(() => {
        if (!autoHide) {
            setIsVisible(true);
            return;
        }
        setIsVisible((isMouseInDock && isVisible) || isMouseInTriggerArea);
    }, [autoHide, isMouseInDock, isMouseInTriggerArea]);

    const content = (
        <DockWrapper ref={dockRef} $position={position} $visible={isVisible}>
            <DockContent $position={position}>
                {React.Children.map(children, (child, index) => {
                    if (!React.isValidElement<AppDisplayProps>(child)) {
                        return null;
                    }

                    return React.cloneElement(child, {
                        ...child.props,
                        showName: false,
                        size: "medium",
                        scale: getScale(index),
                        enableHoverScale: true
                    });
                })}
            </DockContent>
        </DockWrapper>
    );

    return (
        <DockContainer ref={containerRef}>
            {content}
        </DockContainer>
    );
}; 