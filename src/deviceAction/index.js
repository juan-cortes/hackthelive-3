import React, { useEffect, Component, useReducer } from "react";
import {
  renderAllowManager,
  renderAllowOpeningApp,
  renderConnectYourDevice,
  renderError,
  renderInWrongAppForAccount,
  renderLoading,
  renderRequestQuitApp,
  renderListingApps,
} from "./rendering";
import { reducer, getInitialState } from "./reducer";
import { useTranslation } from "react-i18next";

const DeviceAction = ({
  action,
  request,
  Result,
  onResult,
  reduxDevice,
  overridesPreferredDeviceModel,
  preferredDeviceModel = "nanoX",
  type,
  state,
}) => {
  const { t } = useTranslation("deviceAction");
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
  } = state;


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
      onRetry,
    });
  }

  if (isLoading || (allowOpeningGranted && !appAndVersion)) {
    return renderLoading({ modelId });
  }

  if (request && signMessageRequested) {
    const { account } = request;
    return null;
    // return (
    //   <SignMessageConfirm
    //     device={device}
    //     account={account}
    //     signMessageRequested={signMessageRequested}
    //   />
    // );
  }

  if (typeof deviceStreamingProgress === "number") {
    return renderLoading({
      modelId,
      children:
        deviceStreamingProgress > 0 ? (
          // with streaming event, we have accurate version of the wording
          t("send.steps.verification.streaming.accurate", { percentage: (deviceStreamingProgress * 100).toFixed(0) + "%" })
        ) : (
          // otherwise, we're not accurate (usually because we don't need to, it's fast case)

          t("send.steps.verification.streaming.inaccurate")
        ),
    });
  }

  return <Result state={state} />;
};

export default DeviceAction;
