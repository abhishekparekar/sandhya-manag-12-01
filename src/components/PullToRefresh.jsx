import React, { useState, useRef, useEffect } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

/**
 * PullToRefresh Component
 * Native-like pull-to-refresh functionality for mobile
 */

const PullToRefresh = ({ onRefresh, children, disabled = false }) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const startY = useRef(0);
    const containerRef = useRef(null);

    const PULL_THRESHOLD = 80; // Distance to trigger refresh
    const MAX_PULL = 120; // Maximum pull distance

    useEffect(() => {
        const container = containerRef.current;
        if (!container || disabled) return;

        let touchStartY = 0;
        let scrollTop = 0;

        const handleTouchStart = (e) => {
            scrollTop = container.scrollTop;
            touchStartY = e.touches[0].clientY;
            startY.current = touchStartY;
        };

        const handleTouchMove = (e) => {
            // Only allow pull-to-refresh when at the top of the scroll
            if (scrollTop > 0) return;

            const touchY = e.touches[0].clientY;
            const distance = touchY - startY.current;

            if (distance > 0 && !isRefreshing) {
                setIsPulling(true);
                // Apply resistance to the pull
                const resistedDistance = Math.min(distance * 0.5, MAX_PULL);
                setPullDistance(resistedDistance);

                // Prevent default scroll behavior when pulling
                if (distance > 10) {
                    e.preventDefault();
                }
            }
        };

        const handleTouchEnd = async () => {
            if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
                setIsRefreshing(true);
                setPullDistance(PULL_THRESHOLD);

                try {
                    await onRefresh();
                } catch (error) {
                    console.error('Refresh error:', error);
                } finally {
                    setTimeout(() => {
                        setIsRefreshing(false);
                        setPullDistance(0);
                        setIsPulling(false);
                    }, 500);
                }
            } else {
                setPullDistance(0);
                setIsPulling(false);
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [pullDistance, isRefreshing, onRefresh, disabled]);

    const rotation = (pullDistance / PULL_THRESHOLD) * 360;
    const opacity = Math.min(pullDistance / PULL_THRESHOLD, 1);

    return (
        <div ref={containerRef} className="relative h-full overflow-auto">
            {/* Pull indicator */}
            <div
                className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 pointer-events-none z-10"
                style={{
                    height: `${pullDistance}px`,
                    opacity: opacity,
                }}
            >
                <div className="bg-white rounded-full p-2 shadow-lg">
                    <FiRefreshCw
                        className={`w-5 h-5 text-[#F47920] ${isRefreshing ? 'animate-spin' : ''}`}
                        style={{
                            transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
                            transition: isRefreshing ? 'none' : 'transform 0.2s'
                        }}
                    />
                </div>
            </div>

            {/* Content */}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: isPulling ? 'none' : 'transform 0.3s ease-out'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
