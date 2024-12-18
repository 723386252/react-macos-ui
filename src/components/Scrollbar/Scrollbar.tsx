import React, {useRef} from 'react';
import styled from 'styled-components';

export interface ScrollbarProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

const ScrollbarContainer = styled.div<{ $showScrollbar: boolean }>`
  overflow: auto;
  
  &::-webkit-scrollbar {
    width: var(--scrollbar-width);
    height: var(--scrollbar-width);
  }

  &::-webkit-scrollbar-track {
    background: transparent;
    margin: var(--scrollbar-track-margin);
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.$showScrollbar
    ? 'var(--scrollbar-thumb)'
    : 'transparent'};
    border-radius: var(--scrollbar-thumb-radius);
    transition: background-color 0.3s ease;
    
    &:hover {
      background: var(--scrollbar-thumb-hover);
    }
    
    &:active {
      background: var(--scrollbar-thumb-active);
    }
  }
`;

export const Scrollbar: React.FC<ScrollbarProps> = ({
                                                        children,
                                                        className,
                                                        style
                                                    }) => {
    const [isScrolling, setIsScrolling] = React.useState(false);
    const [showScrollbar, setShowScrollbar] = React.useState(false);
    const scrollDebounceTimer = useRef<NodeJS.Timeout | null>(null);

    const handleScroll = () => {
        setIsScrolling(true);

        // 清除之前的防抖定时器
        if (scrollDebounceTimer.current) {
            clearTimeout(scrollDebounceTimer.current);
        }

        // 设置新的防抖定时器
        scrollDebounceTimer.current = setTimeout(() => {
            setIsScrolling(false);
        }, 500);
    };

    // 监听 isScrolling 状态，处理隐藏滚动条的逻辑
    React.useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (isScrolling) {
            setShowScrollbar(true);
        } else {
            timer = setTimeout(() => {
                setShowScrollbar(false);
            }, 1500);
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [isScrolling]);

    // 组件卸载时清理防抖定时器
    React.useEffect(() => {
        return () => {
            if (scrollDebounceTimer.current) {
                clearTimeout(scrollDebounceTimer.current);
            }
        };
    }, []);

    return (
        <ScrollbarContainer
            className={className}
            style={style}
            $showScrollbar={showScrollbar}
            onScroll={handleScroll}
        >
            {children}
        </ScrollbarContainer>
    );
}; 