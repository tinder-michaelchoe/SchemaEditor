/**
 * Error Console Panel Component
 * 
 * Plugin wrapper around the ErrorConsole component.
 */

import React, { useState, useCallback } from 'react';
import { usePluginContext } from '../../../core/hooks/usePluginContext';
import { useDocumentStore } from '../../../core/store/documentStore';
import { ErrorConsole } from '../../../components/ErrorConsole';

export function ErrorConsolePanel() {
  const ctx = usePluginContext();
  const { data, errors } = useDocumentStore();
  const [isOpen, setIsOpen] = useState(true);
  
  // Handle navigation to error location
  const handleErrorClick = useCallback((line: number) => {
    if (ctx.hasCapability('events:emit')) {
      ctx.events?.emit?.('error-console:navigate-to-error', { line });
    }
    ctx.log.debug('Navigating to error at line', line);
  }, [ctx]);
  
  // Handle close
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  // Don't render if no errors
  if (errors.size === 0) {
    return null;
  }
  
  return (
    <ErrorConsole
      errors={errors}
      data={data}
      isOpen={isOpen}
      onClose={handleClose}
      onErrorClick={handleErrorClick}
    />
  );
}

export default ErrorConsolePanel;
