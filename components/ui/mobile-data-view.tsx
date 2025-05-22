import React, { ReactNode } from 'react';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface MobileDataItemProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function MobileDataItem({ label, value, className }: MobileDataItemProps) {
  return (
    <div className={cn("mobile-data-item", className)}>
      <div className="mobile-data-label">{label}</div>
      <div className="mobile-data-value">{value}</div>
    </div>
  );
}

interface MobileDataCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  actions?: ReactNode;
}

export function MobileDataCard({ children, className, onClick, actions }: MobileDataCardProps) {
  return (
    <div 
      className={cn(
        "mobile-card",
        onClick && "cursor-pointer hover:bg-gray-50",
        className
      )}
      onClick={onClick}
    >
      {children}
      
      {actions && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end items-center gap-2">
          {actions}
        </div>
      )}
      
      {onClick && !actions && (
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      )}
    </div>
  );
}

interface MobileDataViewProps {
  data: any[];
  renderItem: (item: any, index: number) => ReactNode;
  keyExtractor: (item: any, index: number) => string;
  emptyMessage?: string;
  className?: string;
  header?: ReactNode;
}

export function MobileDataView({ 
  data, 
  renderItem, 
  keyExtractor,
  emptyMessage = "No items found",
  className,
  header
}: MobileDataViewProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {header && <div className="mb-4">{header}</div>}
      
      {data.length > 0 ? (
        data.map((item, index) => (
          <React.Fragment key={keyExtractor(item, index)}>
            {renderItem(item, index)}
          </React.Fragment>
        ))
      ) : (
        <div className="mobile-card flex items-center justify-center p-8 text-gray-500">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

interface MobileDataViewHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function MobileDataViewHeader({ 
  title, 
  description, 
  actions,
  className 
}: MobileDataViewHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center justify-between mb-2">
        <h1 className="mobile-heading text-gray-800">{title}</h1>
        {actions && <div>{actions}</div>}
      </div>
      {description && (
        <p className="text-gray-500 text-sm">{description}</p>
      )}
    </div>
  );
}

interface MobileActionBarProps {
  children: ReactNode;
  className?: string;
}

export function MobileActionBar({ children, className }: MobileActionBarProps) {
  return (
    <div className={cn("mobile-action-bar", className)}>
      {children}
    </div>
  );
}

export function MobileFilter({ 
  label, 
  active = false,
  onClick 
}: { 
  label: string; 
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button 
      variant={active ? "default" : "outline"} 
      size="sm" 
      onClick={onClick}
      className={cn(
        "whitespace-nowrap text-sm",
        active ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300" : ""
      )}
    >
      {label}
    </Button>
  );
}
