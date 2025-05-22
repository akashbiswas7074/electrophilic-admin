import React, { ReactNode } from "react";

interface PageHeaderProps {
  heading: string;
  text?: string;
  children?: ReactNode;
}

export function PageHeader({
  heading,
  text,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}