"use client";

import React, { useEffect } from "react";

export default function MobileProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function initCapacitor() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          // Initialize StatusBar
          const { StatusBar, Style } = await import("@capacitor/status-bar");
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: "#0f172a" });

          // Hide Splash Screen after app is loaded
          const { SplashScreen } = await import("@capacitor/splash-screen");
          await SplashScreen.hide();
        }
      } catch (err) {
        // Not in native environment, safely ignore
      }
    }

    initCapacitor();
  }, []);

  return <>{children}</>;
}
