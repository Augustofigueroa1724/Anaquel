/** Color del texto de la barra de estado (hora, batería) según el tema. Fuera de la app no hace nada. */
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export function barraDeEstado(oscuro: boolean): void {
  if (!Capacitor.isNativePlatform()) return;
  void StatusBar.setStyle({ style: oscuro ? Style.Dark : Style.Light }).catch(() => {});
}
