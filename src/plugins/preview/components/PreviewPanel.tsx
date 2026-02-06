/**
 * Preview Panel Component
 * 
 * Plugin wrapper around the DevicePreview component.
 */

import React from 'react';
import styled from 'styled-components';
import { usePluginContext } from '../../../core/hooks/usePluginContext';
import { useDocumentStore } from '../../../core/store/documentStore';
import { DevicePreview } from '../../../components/Preview/DevicePreview';

const PanelWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PanelHeader = styled.div`
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.bgSecondary};
`;

const HeaderTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${p => p.theme.colors.textPrimary};
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: hidden;
`;

export function PreviewPanel() {
  const ctx = usePluginContext();
  const { data } = useDocumentStore();
  
  // Log preview renders (useful for debugging)
  React.useEffect(() => {
    ctx.log.debug('Preview panel rendered with data update');
  }, [data, ctx]);
  
  return (
    <PanelWrapper>
      <PanelHeader>
        <HeaderTitle>Device Preview</HeaderTitle>
      </PanelHeader>
      <ContentArea>
        <DevicePreview data={data} />
      </ContentArea>
    </PanelWrapper>
  );
}

export default PreviewPanel;
