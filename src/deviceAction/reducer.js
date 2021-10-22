export const getInitialState = (device) => ({
  isLoading: !!device,
  requestQuitApp: false,
  requestOpenApp: null,
  unresponsive: false,
  requiresAppInstallation: null,
  allowOpeningRequestedWording: null,
  allowOpeningGranted: false,
  allowManagerRequestedWording: null,
  allowManagerGranted: false,
  device: null,
  opened: false,
  appAndVersion: null,
  error: null,
  derivation: null,
  displayUpgradeWarning: false,
  installingApp: false,
  listingApps: false,
});


export const reducer = (state, e) => {
  switch (e.type) {
    case "unresponsiveDevice":
      return { ...state, unresponsive: true };

    case "disconnected":
      return getInitialState();

    case "deviceChange":
      return { ...getInitialState(e.device), device: e.device };

    case "listing-apps":
      return { ...state, listingApps: true };

    case "error":
      return {
        ...getInitialState(e.device),
        device: e.device || null,
        error: e.error,
        isLoading: false,
        listingApps: false,
      };

    case "ask-open-app":
      return {
        isLoading: false,
        requestQuitApp: false,
        requiresAppInstallation: null,
        allowOpeningRequestedWording: null,
        allowOpeningGranted: false,
        allowManagerRequestedWording: null,
        allowManagerGranted: false,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        unresponsive: false,
        requestOpenApp: e.appName,
      };

    case "ask-quit-app":
      return {
        isLoading: false,
        requestOpenApp: null,
        requiresAppInstallation: null,
        allowOpeningRequestedWording: null,
        allowOpeningGranted: false,
        allowManagerRequestedWording: null,
        allowManagerGranted: false,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        unresponsive: false,
        requestQuitApp: true,
      };

    case "device-permission-requested":
      return {
        isLoading: false,
        requestQuitApp: false,
        requestOpenApp: null,
        requiresAppInstallation: null,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        unresponsive: false,
        allowOpeningGranted: false,
        allowOpeningRequestedWording: null,
        allowManagerGranted: false,
        allowManagerRequestedWording: e.wording,
      };

    case "device-permission-granted":
      return {
        isLoading: false,
        requestQuitApp: false,
        requestOpenApp: null,
        requiresAppInstallation: null,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        unresponsive: false,
        allowOpeningGranted: true,
        allowOpeningRequestedWording: null,
        allowManagerGranted: true,
        allowManagerRequestedWording: null,
      };

    case "app-not-installed":
      return {
        requestQuitApp: false,
        requestOpenApp: null,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        isLoading: false,
        unresponsive: false,
        allowOpeningGranted: false,
        allowOpeningRequestedWording: null,
        allowManagerGranted: false,
        allowManagerRequestedWording: null,
        requiresAppInstallation: {
          appNames: e.appNames,
          appName: e.appName,
        },
      };

    case "opened":
      return {
        requestQuitApp: false,
        requestOpenApp: null,
        requiresAppInstallation: null,
        allowOpeningGranted: false,
        allowOpeningRequestedWording: null,
        allowManagerGranted: false,
        allowManagerRequestedWording: null,
        device: state.device,
        error: null,
        isLoading: false,
        unresponsive: false,
        opened: true,
        appAndVersion: e.app,
        derivation: e.derivation,
      };
  }

  return state;
};