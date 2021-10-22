import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const config = {
  resources: {
    en: {
      DeviceAction: {
        allowAppPermission: "Open the {{wording}} app on your device",
        allowAppPermissionSubtitleToken: "to manage your {{token}} tokens",
        allowManagerPermission: "Allow {{wording}} on your device",
        loading: "Loading...",
        connectAndUnlockDevice: "Connect and unlock your device",
        unlockDevice: "Unlock your device",
        unlockDeviceAfterFirmwareUpdate: "Wait for the firmware to update and unlock your device with your PIN",
        quitApp: "Quit the application on your device",
        appNotInstalledTitle: "Missing required app",
        appNotInstalledTitle_plural: "Missing required apps",
        appNotInstalled: "The {{appName}} app is required to complete this action. Please go to the manager and install it on your device",
        appNotInstalled_plural: "The {{appName}} apps are required to complete this action. Please go to the manager and install them on your device",
        openManager: "Open Manager",
        outdated: "App version outdated",
        outdatedDesc: "An important update is available for the {{appName}} application on your device. Please go to the Manager to update it.",
        installApp: "{{appName}} App installation",
        installAppDescription: "Please wait until the installation is finished",
        listApps: "Checking App dependencies",
        listAppsDescription: "Please wait while we make sure you have all the required apps",
      },
    }
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  debug: false,
  react: {
    useSuspense: false,
  },
};

i18n.use(initReactI18next).init(config);

export default i18n;
