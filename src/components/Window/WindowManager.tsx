import React, {createContext, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {Window} from './Window';

// 定义消息类型
export interface WindowMessage {
    payload?: any;
    from: string;
    to?: string;
}

// 定义窗口上下文类型
interface WindowContext {
    id: string;
    zIndex: number;
    messageHandlers: Set<(message: WindowMessage) => void>;
    sendMessage: (id: string, message: any) => void;
}

interface WindowManagerContextType {
    registerWindow: (
        id: string,
        onMessage?: (message: WindowMessage) => void
    ) => void;
    unregisterWindow: (id: string) => void;
    focusWindow: (id: string) => void;
    useZIndex: (id: string, providedZIndex?: number) => number;
    sendMessage: (id: string, fromId: string, message: any) => void;
    createWindow: (options: CreateWindowOptions) => void;
    focusedWindowId: string | null;
    subscribe: (windowId: string, handler: (message: WindowMessage) => void) => void;
    unsubscribe: (windowId: string, handler: (message: WindowMessage) => void) => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | null>(null);

export const useWindowManager = () => {
    const context = useContext(WindowManagerContext);
    if (!context) {
        throw new Error('useWindowManager must be used within a WindowManager');
    }
    return context;
};

export interface WindowManagerProps {
    children: React.ReactNode;
    baseZIndex?: number;
}

// 添加 CreateWindowOptions 类型定义
interface CreateWindowOptions {
    title: string;
    content: React.ReactNode;
    defaultWidth?: number;
    defaultHeight?: number;
    defaultPosition?: { x: number; y: number };
    minWidth?: number;
    minHeight?: number;
    zIndex?: number;
    resizable?: boolean;
    minimize?: () => void | HTMLElement | null;
    onMessage?: (message: WindowMessage) => void;
    onMinimized?: () => void;
    onClosed?: () => void;
    onClose?: () => void;
}

// 添加窗口 hook 的返回类型
export interface UseWindowReturn {
    zIndex: number;
    sendMessage: (targetId: string, message: any) => void;
    focus: () => void;
    isFocused: boolean;
    onMessage: (handler: (message: WindowMessage) => void) => void;
}

// 添加 WindowIdContext
const WindowIdContext = createContext<string | null>(null);

// 添加 useWindowId hook
const useWindowId = () => {
    const windowId = useContext(WindowIdContext);
    if (!windowId) {
        throw new Error('useWindowId must be used within a Window component');
    }
    return windowId;
};

export const WindowManager: React.FC<WindowManagerProps> = ({
                                                                children,
                                                                baseZIndex = 1000
                                                            }) => {
    const contextMap = useRef<Map<string, WindowContext>>(new Map());
    const [windows, setWindows] = useState<Map<string, CreateWindowOptions>>(new Map());
    const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
    const [maxZIndex, setMaxZIndex] = useState<number>(baseZIndex);

    // 注册窗口
    const registerWindow = useCallback((id: string, onMessage?: (message: WindowMessage) => void) => {
        const newContext: WindowContext = {
            id,
            zIndex: baseZIndex,
            messageHandlers: new Set(),
            sendMessage: (to: string, message: any) => {
                const targetContext = contextMap.current.get(to);
                const messageBody: WindowMessage = {
                    to,
                    from: id,
                    payload: message
                };
                if (targetContext) {
                    // 向所有订阅者发送消息
                    targetContext.messageHandlers.forEach(handler => {
                        handler(messageBody);
                    });
                }
            }
        };

        // 如果提供了初始的消息处理函数，添加到 Set 中
        if (onMessage) {
            newContext.messageHandlers.add(onMessage);
        }

        contextMap.current.set(id, newContext);
    }, [baseZIndex]);

    // 注销窗口
    const unregisterWindow = useCallback((id: string) => {
        contextMap.current.delete(id);
    }, []);

    // 聚焦窗口
    const focusWindow = useCallback((id: string) => {
        const context = contextMap.current.get(id);
        if (!context) return;

        // 更新最大 zIndex 并赋予给当前窗口
        setMaxZIndex(prev => {
            const newZIndex = prev + 1;
            context.zIndex = newZIndex;
            return newZIndex;
        });

        setFocusedWindowId(id);
    }, []);

    // 获取窗口 z-index，现在依赖 maxZIndex
    const useZIndex = useCallback((id: string) => {
        const context = contextMap.current.get(id);
        if (!context) return baseZIndex;

        return context.zIndex;
    }, [baseZIndex, maxZIndex]); // 添加 maxZIndex 依赖

    // 添加全局发送消息方法
    const sendMessage = useCallback((id: string, fromId: string, message: any) => {
        const targetContext = contextMap.current.get(fromId);
        if (targetContext) {
            targetContext.sendMessage(id, message);
        }
    }, []);

    // 修改 createWindow 函数实现
    const createWindow = useCallback((options: CreateWindowOptions) => {
        const windowId = Math.random().toString(36).substr(2, 9);

        // 在创建窗口时就注册
        registerWindow(windowId, options.onMessage || (() => {
        }));

        setWindows(prev => {
            const next = new Map(prev);
            next.set(windowId, {
                ...options,
                onClose: () => {
                    options.onClose?.();
                    // 在窗口关闭时注销
                    unregisterWindow(windowId);
                    setWindows(prev => {
                        const next = new Map(prev);
                        next.delete(windowId);
                        return next;
                    });
                }
            });
            return next;
        });
    }, [registerWindow, unregisterWindow]);

    // 添加订阅和取消订阅的方法
    const subscribe = useCallback((windowId: string, handler: (message: WindowMessage) => void) => {
        const context = contextMap.current.get(windowId);
        if (context) {
            context.messageHandlers.add(handler);
        }
    }, []);

    const unsubscribe = useCallback((windowId: string, handler: (message: WindowMessage) => void) => {
        const context = contextMap.current.get(windowId);
        if (context) {
            context.messageHandlers.delete(handler);
        }
    }, []);

    const value = {
        registerWindow,
        unregisterWindow,
        focusWindow,
        useZIndex,
        sendMessage,
        createWindow,
        focusedWindowId,
        subscribe,
        unsubscribe
    };

    return (
        <WindowManagerContext.Provider value={value}>
            {children}
            {/* 渲染所有窗口，使用 WindowIdContext.Provider 包裹每个窗口 */}
            {Array.from(windows.entries()).map(([id, options]) => (
                <WindowIdContext.Provider key={id} value={id}>
                    <Window
                        title={options.title}
                        defaultWidth={options.defaultWidth}
                        defaultHeight={options.defaultHeight}
                        defaultPosition={options.defaultPosition}
                        minWidth={options.minWidth}
                        minHeight={options.minHeight}
                        zIndex={options.zIndex}
                        resizable={options.resizable}
                        onClose={options.onClose}
                        onMinimize={options.minimize}
                        onMinimized={options.onMinimized}
                        onClosed={options.onClosed}
                        fixed={true}
                    >
                        {options.content}
                    </Window>
                </WindowIdContext.Provider>
            ))}
        </WindowManagerContext.Provider>
    );
};

// 修改 useWindow hook
export const useWindow = (): UseWindowReturn => {
    const windowId = useWindowId();
    const {
        useZIndex,
        focusWindow,
        sendMessage: globalSendMessage,
        focusedWindowId,
        subscribe,
        unsubscribe
    } = useWindowManager();

    const zIndex = useZIndex(windowId);

    const isFocused = useMemo(() => {
        return windowId === focusedWindowId;
    }, [windowId, focusedWindowId]);

    const sendMessage = useCallback((targetId: string, message: any) => {
        globalSendMessage(targetId, windowId, message);
    }, [globalSendMessage, windowId]);

    const focus = useCallback(() => {
        focusWindow(windowId);
    }, [focusWindow, windowId]);

    const onMessage = useCallback((handler: (message: WindowMessage) => void) => {
        subscribe(windowId, handler);
        return () => unsubscribe(windowId, handler);
    }, [windowId, subscribe, unsubscribe]);

    return {
        zIndex,
        sendMessage,
        focus,
        isFocused,
        onMessage
    };
};