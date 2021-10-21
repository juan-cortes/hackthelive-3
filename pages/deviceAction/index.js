import React, { useEffect, Component, useReducer } from "react";
import {
  renderAllowManager,
  renderAllowOpeningApp,
  renderBootloaderStep,
  renderConnectYourDevice,
  renderError,
  renderInWrongAppForAccount,
  renderLoading,
  renderRequestQuitApp,
  renderRequiresAppInstallation,
  renderInstallingApp,
  renderListingApps,
  renderWarningOutdated,
  renderSwapDeviceConfirmationV2,
  renderSellDeviceConfirmation,
} from "./rendering";
import reducer from "./reducer";

const DeviceAction = ({
  action,
  request,
  Result,
  onResult,
  reduxDevice,
  overridesPreferredDeviceModel,
  preferredDeviceModel,
  dispatch,
}) => {
  const {
    appAndVersion,
    device,
    unresponsive,
    error,
    isLoading,
    allowManagerRequestedWording,
    requestQuitApp,
    deviceInfo,
    requestOpenApp,
    allowOpeningRequestedWording,
    progress,
    listingApps,
    requiresAppInstallation,
    inWrongDeviceForAccount,
    onRetry,
    deviceSignatureRequested,
    deviceStreamingProgress,
    allowOpeningGranted,
    signMessageRequested,
  } = useReducer(reducer);


  const modelId = device ? device.modelId : overridesPreferredDeviceModel || preferredDeviceModel;

  if (requestQuitApp) {
    return renderRequestQuitApp({ modelId, type });
  }

  if (allowManagerRequestedWording) {
    const wording = allowManagerRequestedWording;
    return renderAllowManager({ modelId, type, wording });
  }

  if (listingApps) {
    return renderListingApps();
  }

  if (allowOpeningRequestedWording || requestOpenApp) {
    // requestOpenApp for Nano S 1.3.1 (need to ask user to open the app.)
    const wording = allowOpeningRequestedWording || requestOpenApp;
    const tokenContext = request && request.tokenCurrency;
    return renderAllowOpeningApp({
      modelId,
      type,
      wording,
      tokenContext,
      isDeviceBlocker: !requestOpenApp,
    });
  }

  if (inWrongDeviceForAccount) {
    return renderInWrongAppForAccount({
      onRetry,
      accountName: inWrongDeviceForAccount.accountName,
    });
  }

  if (!isLoading && error) {
    if (
      error instanceof ManagerNotEnoughSpaceError ||
      error instanceof OutdatedApp ||
      error instanceof UpdateYourApp
    ) {
      return renderError({
        error,
        managerAppName: error.managerAppName,
      });
    }

    if (error instanceof LatestFirmwareVersionRequired) {
      return renderError({
        error,
        requireFirmwareUpdate: true,
      });
    }

    return renderError({
      error,
      onRetry,
      withExportLogs: true,
    });
  }

  if ((!isLoading && !device) || unresponsive) {
    return renderConnectYourDevice({
      modelId,
      type,
      unresponsive,
      device,
      onRepairModal,
      onRetry,
    });
  }

  if (isLoading || (allowOpeningGranted && !appAndVersion)) {
    return renderLoading({ modelId });
  }

  if (request && device && deviceSignatureRequested) {
    const { account, parentAccount, status, transaction } = request;
    if (account && status && transaction) {
      return (
        <TransactionConfirm
          device={device}
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          status={status}
        />
      );
    }
  }

  if (request && signMessageRequested) {
    const { account } = request;
    return (
      <SignMessageConfirm
        device={device}
        account={account}
        signMessageRequested={signMessageRequested}
      />
    );
  }

  if (typeof deviceStreamingProgress === "number") {
    return renderLoading({
      modelId,
      children:
        deviceStreamingProgress > 0 ? (
          // with streaming event, we have accurate version of the wording
          <Trans
            i18nKey="send.steps.verification.streaming.accurate"
            values={{ percentage: (deviceStreamingProgress * 100).toFixed(0) + "%" }}
          />
        ) : (
          // otherwise, we're not accurate (usually because we don't need to, it's fast case)

          <Trans i18nKey="send.steps.verification.streaming.inaccurate" />
        ),
    });
  }

  return null;
};

const mapStateToProps = createStructuredSelector({
  reduxDevice: getCurrentDevice,
  preferredDeviceModel: preferredDeviceModelSelector,
});

export default DeviceAction;
