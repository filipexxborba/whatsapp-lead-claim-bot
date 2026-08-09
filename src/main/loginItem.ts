import { app } from 'electron'

/** Argumento reconhecido em createWindow() para não mostrar a janela ao abrir via login do SO. */
export const HIDDEN_LAUNCH_ARG = '--hidden'

export function wasLaunchedHidden(): boolean {
  return app.commandLine.hasSwitch('hidden') || process.argv.includes(HIDDEN_LAUNCH_ARG)
}

export function getLaunchAtLogin(): boolean {
  return app.getLoginItemSettings().openAtLogin
}

export function setLaunchAtLogin(enabled: boolean): void {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    // openAsHidden só tem efeito no macOS; no Windows/Linux quem decide é o
    // próprio processo, checando HIDDEN_LAUNCH_ARG em process.argv no boot.
    openAsHidden: enabled,
    args: enabled ? [HIDDEN_LAUNCH_ARG] : []
  })
}
