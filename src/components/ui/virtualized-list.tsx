'use client'

import React, { forwardRef, useMemo } from 'react'
import { motion } from 'framer-motion'

interface VirtualizedListProps {
  items: any[]
  height: number
  itemHeight: number
  renderItem: (props: { index: number; style: React.CSSProperties; data: any[] }) => React.ReactNode
  loadMoreRef?: (node?: Element | null) => void
  hasNextPage?: boolean
  isLoadingMore?: boolean
  className?: string
  overscan?: number
}

export const VirtualizedList = forwardRef<any, VirtualizedListProps>(({
  items,
  height,
  itemHeight,
  renderItem,
  loadMoreRef,
  hasNextPage = false,
  isLoadingMore = false,
  className = '',
  overscan = 5
}, ref) => {
  const itemData = useMemo(() => ({
    items,
    loadMoreRef,
    hasNextPage,
    isLoadingMore
  }), [items, loadMoreRef, hasNextPage, isLoadingMore])

  const itemCount = items.length + (hasNextPage ? 1 : 0)

  // Fallback to simple scrollable div since react-window has import issues
  return (
    <div 
      ref={ref}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      {items.map((_, index) => {
        const style = {
          height: itemHeight,
          minHeight: itemHeight
        }
        
        return (
          <div key={index} style={style}>
            {renderItem({ index, style, data: items })}
          </div>
        )
      })}
      
      {hasNextPage && (
        <div ref={loadMoreRef} style={{ height: itemHeight }}>
          <div className="flex items-center justify-center py-8">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Loading more...</span>
              </div>
            ) : (
              <div className="text-muted-foreground">Loading more...</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

VirtualizedList.displayName = 'VirtualizedList'

// Loading skeleton for virtualized lists
export function VirtualizedListSkeleton({ 
  height, 
  itemHeight, 
  itemCount = 10 
}: { 
  height: number
  itemHeight: number
  itemCount?: number 
}) {
  return (
    <div style={{ height }} className="space-y-2">
      {Array.from({ length: itemCount }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 }}
          className="animate-pulse"
          style={{ height: itemHeight }}
        >
          <div className="bg-muted rounded-lg h-full" />
        </motion.div>
      ))}
    </div>
  )
}