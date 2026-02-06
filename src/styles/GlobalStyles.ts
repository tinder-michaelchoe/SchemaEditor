import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: ${p => p.theme.fonts.system};
    background-color: ${p => p.theme.colors.bgPrimary};
    color: ${p => p.theme.colors.textPrimary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: ${p => p.theme.colors.textTertiary};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${p => p.theme.colors.textSecondary};
  }

  .json-key { color: ${p => p.theme.json.key}; }
  .json-string { color: ${p => p.theme.json.string}; }
  .json-number { color: ${p => p.theme.json.number}; }
  .json-boolean { color: ${p => p.theme.json.boolean}; }
  .json-null { color: ${p => p.theme.json.null}; }

  .tree-wrap-text .truncate {
    overflow: visible;
    text-overflow: clip;
    white-space: normal;
    word-break: break-word;
  }

  .tree-wrap-text input[type="text"],
  .tree-wrap-text textarea {
    white-space: pre-wrap;
    word-break: break-word;
  }
`;
