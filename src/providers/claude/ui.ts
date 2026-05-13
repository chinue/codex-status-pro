// DESIGN: v2-provider-abstraction.md#claude-ui
// AGENTS: keep-minimal

import { IUIProvider } from '../base/types';

export const claudeUIProvider: IUIProvider = {
  mainIcon: '$(claude)',
  statusBarName: 'Claude Code Usage',
  dashboardTitle: 'Claude Dashboard',
  displayName: 'Claude',
  officialUrl: 'https://www.anthropic.com/pricing',
  extensionDisplayName: 'ClaudeStatusPro',
};
