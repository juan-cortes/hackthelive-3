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
import SignMessageConfirm from "./signMessageConfirm";

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
  transactionData,
  derivationPath
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
    opened
  } = state;


  const modelId = device ? device.modelId : overridesPreferredDeviceModel || preferredDeviceModel;

  if (requestQuitApp) {
    return renderRequestQuitApp({ modelId, type, t });
  }

  if (allowManagerRequestedWording) {
    const wording = allowManagerRequestedWording;
    return renderAllowManager({ modelId, type, wording, t });
  }

  if (listingApps) {
    return renderListingApps({ t });
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
      t,
    });
  }

  if (inWrongDeviceForAccount) {
    return renderInWrongAppForAccount({
      onRetry,
      accountName: inWrongDeviceForAccount.accountName,
      t,
    });
  }

  if (!isLoading && error) {
    return renderError({
      error,
      onRetry,
      withExportLogs: true,
      t,
    });
  }

  if ((!isLoading && !device) || unresponsive) {
    return renderConnectYourDevice({
      modelId,
      type,
      unresponsive,
      device,
      onRetry,
      t
    });
  }

  if (isLoading || (allowOpeningGranted && !appAndVersion)) {
    return renderLoading({ modelId, t });
  }

  if (request && signMessageRequested) {
    const { account } = request;
    return (
      <SignMessageConfirm
        device={device}
        signMessageRequested={signMessageRequested}
        type={type}
      />
    );
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
        t
    });
  }

  return <Result 
    transactionData={transactionData} 
    derivationPath={derivationPath}
    state={state} 
    device={device}
    signMessageRequested={signMessageRequested}
    type={type}
    t={t}
  />;
};

export default DeviceAction;
