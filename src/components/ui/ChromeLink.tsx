import React from 'react';

interface ChromeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function ChromeLink({ href, children, className }: ChromeLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Use chrome.tabs.create to open external links in Chrome extensions
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: href });
    } else {
      // Fallback for development/testing
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </a>
  );
}
