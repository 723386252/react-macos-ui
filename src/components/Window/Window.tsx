import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState} from 'react';
import styled from 'styled-components';
import {Rnd} from 'react-rnd';
import {useMouse} from 'react-use';
import {WindowButton} from './WindowButton';
import {Scrollbar} from '../Scrollbar/Scrollbar';
import {flushSync} from 'react-dom';
import CloseIcon from '../../assets/svgs/close.svg?react';
import MinimizeIcon from '../../assets/svgs/minimize.svg?react';
import FullscreenIcon from '../../assets/svgs/fullscreen.svg?react';
import ExitFullscreenIcon from '../../assets/svgs/exit-fullscreen.svg?react';
import {useWindow, WindowMessage} from './WindowManager';

export interface WindowProps {
    title: string;
    children: React.ReactNode;
    onClose?: () => void;
    onMinimize?: () => HTMLElement | null | void;
    onFullScreenChange?: (isFullScreen: boolean) => void;
    defaultWidth?: number;
    defaultHeight?: number;
    minWidth?: number;
    minHeight?: number;
    defaultPosition?: { x: number; y: number };
    zIndex?: number;
    resizable?: boolean;
    fixed?: boolean;
    onClosed?: () => void;
    onMinimized?: () => void;
    onMessage?: (message: WindowMessage) => void;
    type?: 'normal' | 'classic';
}

interface WindowSize {
    width: number;
    height: number;
    x: number;
    y: number;
}

// 添加关闭类型枚举
enum WindowCloseType {
    None,
    Close,
    Minimize
}

interface WindowWrapperProps {
    $isFullScreen?: boolean;
    $isTransitioning?: boolean;
    $visible: boolean;
    $closeType: WindowCloseType;
    $minimizePosition?: { x: number; y: number };
    $focused: boolean;
}

const WindowWrapper = styled.div<WindowWrapperProps>`
  background: var(--window-background);
  border-radius: ${props => props.$isFullScreen ? '0' : 'var(--window-radius)'};
  box-shadow: ${props => props.$isFullScreen ?
    'none' :
    props.$focused ?
        '0 12px 28px rgba(0, 0, 0, 0.2)' :
        'var(--window-shadow)'
};
  overflow: hidden;
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
              opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transform: ${props => {
    if (!props.$visible && props.$closeType === WindowCloseType.Minimize && props.$minimizePosition) {
        // 计算缩放和位移
        const scale = 0.06; // macOS 的缩放比例约为 0.06
        const {x, y} = props.$minimizePosition;
        return `translate(${x}px, ${y}px) scale(${scale})`;
    }
    if (!props.$visible && props.$closeType === WindowCloseType.Close) {
        return 'scale(0.9)';
    }
    return 'scale(1)';
}};
  opacity: ${props => props.$visible ? '1' : '0'};
  transform-origin: ${props =>
    props.$closeType === WindowCloseType.Minimize ?
        '50% 50%' : // 从窗口中心开始变换
        'center'
};
  will-change: transform, opacity;
  perspective: 1000px;
  display: flex;
  flex-direction: column;
`;

const NORMAL_HEADER_HEIGHT = '45px';
const FULLSCREEN_HEADER_HEIGHT = '38px';
const HEADER_TRIGGER_AREA = '20px';

const WindowHeader = styled.div<{ $isFullScreen: boolean, $type: 'normal' | 'classic' }>`
  padding: ${props => props.$isFullScreen ? '8px 12px' : '12px'};
  background: ${props => {
    if (props.$type === 'classic') {
        return props.$isFullScreen ?
            'var(--header-background-blur)' :
            'var(--header-background)'
    }
    return 'transparent'
}
};
  backdrop-filter: ${props => props.$isFullScreen ? 'blur(10px)' : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: ${props => {
    if (props.$type === 'classic') {
        return `1px solid ${props.$isFullScreen ? 'var(--header-border-blur)' : 'var(--header-border)'}`
    }
    return 'none'
}};
  user-select: none;
  position: ${props => {
    if (props.$isFullScreen) {
        return 'fixed'
    } else if (props.$type === 'classic') {
        return 'relative'
    }
    return 'absolute'
}};
  top: ${props => {
    if (props.$type === 'classic') {
        return props.$isFullScreen ? `-${FULLSCREEN_HEADER_HEIGHT}` : '0'
    }
    return '0'
}};
  left: 0;
  right: 0;
  height: ${props => props.$isFullScreen ? FULLSCREEN_HEADER_HEIGHT : NORMAL_HEADER_HEIGHT};
  transition: top 0.3s ease;
  color: var(--text-primary);
`;

const WindowControls = styled.div`
  display: flex;
  gap: 8px;
  position: absolute;
  left: 12px;
`;

const WindowTitle = styled.div`
  font-size: 13px;
  font-weight: 400;
  color: var(--text-primary);
  user-select: none;
`;

const WindowContent = styled.div<{ $isFullScreen: boolean }>`
  height: ${props => props.$isFullScreen ? '100vh' : `calc(100% - ${NORMAL_HEADER_HEIGHT})`};
  margin-top: ${props => props.$isFullScreen ? FULLSCREEN_HEADER_HEIGHT : '0'};
  flex: 1;
  overflow: hidden;
`;

const ScrollContainer = styled(Scrollbar)`
  height: 100%;
`;

const ScrollContent = styled.div`
  padding: 16px;
  min-height: 100%;
`;

const FixedContainer = styled.div<{ $fixed?: boolean }>`
  position: fixed;
  pointer-events: none;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
`;

// 添加 ref 类型定义
export interface WindowRef {
    sendMessage: (targetId: string, payload: any) => void;
}

// 修改组件定义为 forwardRef
export const Window = forwardRef<WindowRef, WindowProps>(({
                                                              title,
                                                              children,
                                                              onClose,
                                                              onMinimize,
                                                              onFullScreenChange,
                                                              defaultWidth = 600,
                                                              defaultHeight = 400,
                                                              minWidth = 300,
                                                              minHeight = 200,
                                                              defaultPosition = {x: 0, y: 0},
                                                              zIndex: providedZIndex,
                                                              resizable = true,
                                                              fixed = false,
                                                              onClosed,
                                                              onMinimized,
                                                              onMessage,
                                                              type = 'normal',
                                                          }, ref) => {
    const windowRef = useRef<HTMLDivElement>(null);

    // 将 useWindow 移到顶层
    let windowInstance;
    try {
        windowInstance = useWindow();
    } catch {
        windowInstance = null;
    }

    // 根据 windowInstance 创建 context
    const windowContext = useMemo(() => {
        if (windowInstance) {
            return {
                ...windowInstance,
                available: true
            };
        }
        return {
            zIndex: providedZIndex,
            focus: () => {
            },
            isFocused: true,
            sendMessage: () => {
            },
            onMessage: () => {
            },
            available: false
        };
    }, [windowInstance, providedZIndex]);

    const [isMaximized, setIsMaximized] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [previousSize, setPreviousSize] = useState<WindowSize>({
        width: defaultWidth,
        height: defaultHeight,
        x: defaultPosition.x,
        y: defaultPosition.y,
    });
    const [currentSize, setCurrentSize] = useState<WindowSize>({
        width: defaultWidth,
        height: defaultHeight,
        x: defaultPosition.x,
        y: defaultPosition.y,
    });
    const mouse = useMouse(windowRef);
    const [isHeaderVisible, setIsHeaderVisible] = useState(false);
    const [dragStartMousePos, setDragStartMousePos] = useState<{
        x: number;
        y: number;
        relativeX: number; // 相对于窗口右边的距离百分比
        relativeY: number; // 相对于窗口顶部的距离
    } | null>(null);
    const [visible, setVisible] = useState(false);
    const [closeType, setCloseType] = useState(WindowCloseType.None);
    const [minimizePosition, setMinimizePosition] = useState<{ x: number; y: number } | undefined>(undefined);

    useLayoutEffect(() => {
        requestAnimationFrame(() => {
            setVisible(true);
        });
    }, []);

    useEffect(() => {
        if (visible) {
            windowContext.focus();
        }
    }, [visible]);

    useEffect(() => {
        if (onMessage && windowContext.available) {
            windowContext.onMessage(onMessage);
        }
    }, [onMessage, windowContext]);

    useEffect(() => {
        if (!isFullScreen) return;

        const {docY} = mouse;
        const headerHeight = parseInt(FULLSCREEN_HEADER_HEIGHT);
        const triggerArea = parseInt(HEADER_TRIGGER_AREA);

        if (docY <= triggerArea) {
            setIsHeaderVisible(true);
        } else if (docY > headerHeight && isHeaderVisible) {
            setIsHeaderVisible(false);
        }
    }, [mouse, isFullScreen, isHeaderVisible]);

    useEffect(() => {
        const element = windowRef.current;
        if (!element) return;

        const handleTransitionEnd = (e: TransitionEvent) => {
            if (e.propertyName === 'transform' || e.propertyName === 'opacity') {
                if (!visible) {
                    if (closeType === WindowCloseType.Minimize) {
                        onMinimized?.();
                    } else if (closeType === WindowCloseType.Close) {
                        onClosed?.();
                    }
                }
            }
        };

        element.addEventListener('transitionend', handleTransitionEnd);
        return () => {
            element.removeEventListener('transitionend', handleTransitionEnd);
        };
    }, [visible, onClosed, onMinimized, closeType]);

    const exitMaximized = useCallback((withTransition = true) => {
        if (withTransition) {
            document.body.style.overflow = 'hidden';
            setIsTransitioning(true);
        }
        setIsMaximized(false);
        setCurrentSize(previousSize);
    }, [previousSize]);

    const handleDoubleClick = useCallback(() => {
        if (!resizable || isFullScreen) return;

        if (!isMaximized) {
            document.body.style.overflow = 'hidden';
            setIsTransitioning(true);
            setPreviousSize(currentSize);
            setIsMaximized(true);
        } else {
            exitMaximized(true);
        }
    }, [isMaximized, currentSize, previousSize, exitMaximized, resizable]);

    const handleDragStart = (e: any) => {
        setIsTransitioning(false);

        // 记录开始拖拽时的鼠标位置和相对位置
        const rect = e.target.getBoundingClientRect();
        const relativeX = (rect.right - e.clientX) / rect.width; // 计算距离右边的百分比
        const relativeY = e.clientY - rect.top; // 计算距离顶部的距离

        setDragStartMousePos({
            x: e.clientX,
            y: e.clientY,
            relativeX,
            relativeY
        });
    };

    const handleDrag = (e: any, d: { x: number; y: number }) => {
        flushSync(() => {
            if (isMaximized && dragStartMousePos) {
                exitMaximized(false);
                // 从最大化状态退出时，根据相对位置计算新位置
                const windowWidth = previousSize.width;
                const newX = e.clientX - (windowWidth * (1 - dragStartMousePos.relativeX));
                const newY = e.clientY - dragStartMousePos.relativeY;
                requestAnimationFrame(() => {
                    setCurrentSize(prev => ({
                        ...previousSize,
                        x: newX,
                        y: newY
                    }));
                });
            } else {
                // 正常拖动时直接使用位置
                setCurrentSize(prev => ({
                    ...prev,
                    x: d.x,
                    y: d.y,
                }));
            }
        });

        return;


    };

    const handleDragStop = (e: any, d: { x: number; y: number }) => {
        setDragStartMousePos(null);
        setCurrentSize(prev => ({
            ...prev,
            x: d.x,
            y: d.y,
        }));
    };

    const handleResize = (
        e: MouseEvent | TouchEvent,
        direction: string,
        ref: HTMLElement,
        delta: { width: number; height: number },
        position: { x: number; y: number }
    ) => {
        setIsTransitioning(false);
        const width = parseInt(ref.style.width, 10);
        const height = parseInt(ref.style.height, 10);

        setCurrentSize({
            width,
            height,
            x: position.x,
            y: position.y,
        });
    };

    const toggleFullScreen = useCallback(() => {
        if (!isFullScreen) {
            document.body.style.overflow = 'hidden';
            setIsTransitioning(true);
            setPreviousSize(currentSize);
            setIsFullScreen(true);
            onFullScreenChange?.(true);
        } else {
            setIsFullScreen(false);
            onFullScreenChange?.(false);
            if (!isMaximized) {
                setCurrentSize(previousSize);
            }
        }
    }, [isFullScreen, currentSize, previousSize, isMaximized, onFullScreenChange]);

    const handleClose = useCallback(() => {
        if (!onClose && !onClosed) return;

        onClose?.();
        setCloseType(WindowCloseType.Close);
        setVisible(false);
    }, [onClose, onClosed]);

    // 优化计算最小化位置的函数
    const calculateMinimizePosition = useCallback((targetElement?: HTMLElement) => {
        if (!windowRef.current) return undefined;

        const rect = windowRef.current.getBoundingClientRect();
        const currentX = rect.left + rect.width / 2;
        const currentY = rect.top + rect.height / 2;

        if (targetElement) {
            const targetRect = targetElement.getBoundingClientRect();
            const targetX = targetRect.left + targetRect.width / 2;
            const targetY = targetRect.top + targetRect.height / 2;

            return {
                x: targetX - currentX,
                y: targetY - currentY
            };
        }

        const targetX = window.innerWidth / 2;
        const targetY = window.innerHeight + 50;

        return {
            x: targetX - currentX,
            y: targetY - currentY
        };
    }, []); // 不依赖任何外部变量

    const handleMinimize = useCallback(() => {
        if (!onMinimize && !onMinimized) return;

        let targetElement: HTMLElement | null = null;

        // 如果有 onMinimize 回调，调用它并获取目标元素
        if (onMinimize) {
            targetElement = onMinimize() ?? null;
        }

        const position = calculateMinimizePosition(targetElement || undefined);
        setMinimizePosition(position);

        setCloseType(WindowCloseType.Minimize);
        setVisible(false);
    }, [onMinimize, onMinimized, calculateMinimizePosition]);


    // 处理窗口获得焦点
    const handleFocus = useCallback(() => {
        windowContext.focus();
    }, [windowContext]);

    // 处理窗口失去焦点
    const handleBlur = useCallback(() => {

    }, []);

    // 组件挂载时自动获得焦点
    useEffect(() => {
        if (windowRef.current) {
            windowRef.current.focus();
        }
    }, []);

    // 修改 useImperativeHandle
    useImperativeHandle(ref, () => ({
        sendMessage: windowContext.sendMessage
    }), [windowContext]);

    // 优化 Rnd 的 position 计算
    const position = useMemo(() => {
        return isFullScreen || isMaximized ?
            {x: 0, y: 0} :
            {x: currentSize.x, y: currentSize.y};
    }, [isFullScreen, isMaximized, currentSize.x, currentSize.y]);

    // 优化 Rnd 的 size 计算
    const size = useMemo(() => {
        return isFullScreen || isMaximized ?
            {width: '100%', height: '100%'} :
            {width: currentSize.width, height: currentSize.height};
    }, [isFullScreen, isMaximized, currentSize.width, currentSize.height]);

    // 优化 Rnd 的 style 计算
    const rndStyle = useMemo(() => ({
        zIndex: providedZIndex ?? windowContext.zIndex,
        pointerEvents: 'auto' as const,
        transition: isTransitioning ?
            'width 0.3s ease, height 0.3s ease, transform 0.3s ease' :
            'none'
    }), [providedZIndex, windowContext.zIndex, isTransitioning]);

    // 优化 resizeHandleStyles
    const resizeHandleStyles = useMemo(() => ({
        bottomRight: {
            width: '20px',
            height: '20px',
            right: '0',
            bottom: '0',
            cursor: resizable ? 'se-resize' : 'default',
            display: resizable ? 'block' : 'none',
        }
    }), [resizable]);

    // 优化 WindowWrapper 的 props
    const wrapperProps = useMemo(() => ({
        $isFullScreen: isFullScreen,
        $isTransitioning: isTransitioning,
        $visible: visible,
        $closeType: closeType,
        $minimizePosition: minimizePosition,
        $focused: windowContext.isFocused,
    }), [isFullScreen, isTransitioning, visible, closeType, minimizePosition, windowContext.isFocused]);

    // 优化 WindowHeader 的 style
    const headerStyle = useMemo(() => ({
        top: isFullScreen ?
            (isHeaderVisible ? '0' : `-${FULLSCREEN_HEADER_HEIGHT}`) :
            '0'
    }), [isFullScreen, isHeaderVisible]);

    const windowContent = (
        <Rnd
            className="rnd-wrapper"
            default={{
                x: defaultPosition.x,
                y: defaultPosition.y,
                width: defaultWidth,
                height: defaultHeight,
            }}
            minWidth={minWidth}
            minHeight={minHeight}
            dragHandleClassName="window-header"
            enableResizing={resizable && !isMaximized && !isFullScreen}
            disableDragging={isFullScreen}
            position={position}
            size={size}
            style={rndStyle}
            resizeHandleStyles={resizeHandleStyles}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragStop={handleDragStop}
            onResize={handleResize}
            onResizeStart={useCallback(() => setIsTransitioning(false), [])}
            onResizeStop={useCallback(() => setIsTransitioning(false), [])}
        >
            <WindowWrapper
                ref={windowRef}
                {...wrapperProps}
                tabIndex={-1}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={{outline: 'none'}}
            >
                <WindowHeader
                    className="window-header"
                    onDoubleClick={handleDoubleClick}
                    $isFullScreen={isFullScreen}
                    $type={type}
                    style={headerStyle}
                >
                    <WindowControls>
                        <WindowButton
                            type="close"
                            onClick={handleClose}
                            title="关闭"
                            disabled={!onClose && !onClosed}
                        >
                            <CloseIcon/>
                        </WindowButton>
                        <WindowButton
                            type="minimize"
                            onClick={handleMinimize}
                            title="最小化"
                            disabled={!onMinimize && !onMinimized}
                        >
                            <MinimizeIcon/>
                        </WindowButton>
                        <WindowButton
                            type="fullscreen"
                            onClick={toggleFullScreen}
                            title={isFullScreen ? "退出全屏" : "全屏"}
                            disabled={!resizable}
                        >
                            {isFullScreen ? <ExitFullscreenIcon/> : <FullscreenIcon/>}
                        </WindowButton>
                    </WindowControls>
                    {type === 'normal' ? null : <WindowTitle>{title}</WindowTitle>}
                </WindowHeader>
                <WindowContent $isFullScreen={isFullScreen}>
                    <ScrollContainer>
                        <ScrollContent>
                            {children}
                        </ScrollContent>
                    </ScrollContainer>
                </WindowContent>
            </WindowWrapper>
        </Rnd>
    );

    // 优化最终的渲染判断
    return useMemo(() => (
        fixed ? (
            <FixedContainer $fixed={fixed} style={{zIndex: windowContext.zIndex}}>
                {windowContent}
            </FixedContainer>
        ) : windowContent
    ), [fixed, windowContext.zIndex, windowContent]);
}); 