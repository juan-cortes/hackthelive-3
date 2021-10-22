// @flow
import React, { useCallback, useContext } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import Animation from "./lottie";
import { Button, Text, Flex as Box, Alert, InfiniteLoader } from "@ledgerhq/react-ui";

import { getDeviceAnimation } from "./animations";

const AnimationWrapper = styled.div`
  width: 600px;
  max-width: 100%;
  height: ${p => (p.modelId === "blue" ? 300 : 200)}px;
  padding-bottom: ${p => (p.modelId === "blue" ? 20 : 0)}px;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ProgressWrapper = styled.div`
  padding: 24px;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  max-width: 100%;
`;

const Logo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${p => (p.warning ? p.theme.colors.warning : p.theme.colors.alertRed)};
  margin-bottom: 20px;
`;

export const Header = styled.div`
  display: flex;
  flex: 1 0 0%;
  flex-direction: column;
  justify-content: flex-end;
  align-content: center;
  align-items: center;
`;

export const Footer = styled.div`
  display: flex;
  flex: 1 0 0%;
  flex-direction: column;
  justify-content: flex-start;
  align-content: center;
  align-items: center;
`;

const Title = styled(Text).attrs({
  ff: "Inter|SemiBold",
  color: "palette.neutral.c100",
  textAlign: "center",
  fontSize: 5,
})`
  white-space: pre-line;
`;

const SubTitle = styled(Text).attrs({
  ff: "Inter|Regular",
  color: "palette.neutral.c100",
  textAlign: "center",
  fontSize: 3,
})`
  margin-top: 8px;
`;

const ErrorTitle = styled(Text).attrs({
  ff: "Inter|SemiBold",
  color: "palette.neutral.c100",
  textAlign: "center",
  fontSize: 6,
})`
  user-select: text;
  margin-bottom: 10px;
`;

const ErrorDescription = styled(Text).attrs({
  ff: "Inter|Regular",
  color: "palette.neutral.c60",
  textAlign: "center",
  fontSize: 4,
})`
  user-select: text;
`;

const ButtonContainer = styled(Box).attrs(p => ({
  mt: 25,
  horizontal: true,
}))``;

const TroubleshootingWrapper = styled.div`
  margin-top: auto;
  margin-bottom: 16px;
`;

// these are not components because we want reconciliation to not remount the sub elements

export const renderRequestQuitApp = ({
  modelId,
  type,
  t
}) => <Wrapper>
    <Header />
    <AnimationWrapper modelId={modelId}>
      <Animation animation={getDeviceAnimation(modelId, type, "quitApp")} />
    </AnimationWrapper>
    <Footer>
      <Title>
        {t("quitApp")}
      </Title>
    </Footer>
  </Wrapper>;

export const renderListingApps = ({ t }) => <Wrapper id="deviceAction-loading">
    <Header />
    <ProgressWrapper>
      <InfiniteLoader />
    </ProgressWrapper>
    <Footer>
      <Title>
        {t("listApps")}
      </Title>
      <SubTitle>
        {t("listAppsDescription")}
      </SubTitle>
    </Footer>
  </Wrapper>;

export const renderAllowManager = ({
  modelId,
  type,
  wording,
  t
}) => {
  
  return (
  <Wrapper>
    <DeviceBlocker />
    <Header />
    <AnimationWrapper modelId={modelId}>
      <Animation animation={getDeviceAnimation(modelId, type, "allowManager")} />
    </AnimationWrapper>
    <Footer>
      <Title>
        {t("allowManagerPermission", { wording })}
      </Title>
    </Footer>
  </Wrapper>
);};

export const renderAllowOpeningApp = ({
  modelId,
  type,
  wording,
  tokenContext,
  isDeviceBlocker,
  t
}) => <Wrapper>
    {isDeviceBlocker ? <DeviceBlocker /> : null}
    <Header />
    <AnimationWrapper modelId={modelId}>
      <Animation animation={getDeviceAnimation(modelId, type, "openApp")} />
    </AnimationWrapper>
    <Footer>
      <Title>
        {t("allowAppPermission", { wording })}
        {!tokenContext ? null : (
          <>
            {"\n"}
            {t("allowAppPermissionSubtitleToken", { token: tokenContext.name })}
          </>
        )}
      </Title>
    </Footer>
  </Wrapper>;

export const renderError = ({
  error,
  withOpenManager,
  onRetry,
  withExportLogs,
  list,
  supportLink,
  warning,
  managerAppName,
  requireFirmwareUpdate,
  t
}) => <Wrapper id={`error-${error.name}`}>
    <Logo warning={warning}>
      <ErrorIcon size={44} error={error} />
    </Logo>
    <ErrorTitle>
      <TranslatedError error={error} />
    </ErrorTitle>
    <ErrorDescription>
      <TranslatedError error={error} field="description" /> <SupportLinkError error={error} />
    </ErrorDescription>
    <ButtonContainer>
      {onRetry ? (
            <Button type="primary" onClick={onRetry}>
              {t("common.retry")}
            </Button>
          ) : null}
    </ButtonContainer>
  </Wrapper>;

export const renderInWrongAppForAccount = ({
  onRetry,
  accountName,
  t
}) =>
  renderError({
    error: new WrongDeviceForAccount(null, { accountName }),
    withExportLogs: true,
    onRetry,
    t
  });

export const renderConnectYourDevice = ({
  modelId,
  type,
  onRetry,
  device,
  unresponsive,
  t
}) => {
  
  return (
  <Wrapper>
    <Header />
    <AnimationWrapper modelId={modelId}>
      <Animation
        animation={getDeviceAnimation(
          modelId,
          type,
          unresponsive ? "enterPinCode" : "plugAndPinCode",
        )}
      />
    </AnimationWrapper>
    <Footer>
      <Title>
        {t(unresponsive ? "unlockDevice" : "connectAndUnlockDevice")}
      </Title>
    </Footer>
  </Wrapper>
)};

export const renderFirmwareUpdating = ({
  modelId,
  type,
  t
}) => <Wrapper>
    <Header />
    <AnimationWrapper modelId={modelId}>
      <Animation animation={getDeviceAnimation(modelId, type, "firmwareUpdating")} />
    </AnimationWrapper>
    <Footer>
      <Title>
        {t("unlockDeviceAfterFirmwareUpdate")}
      </Title>
    </Footer>
  </Wrapper>;

export const renderLoading = ({
  modelId,
  children,
  t
}) => <Wrapper id="deviceAction-loading">
    <Header />
    <AnimationWrapper modelId={modelId}>
      <InfiniteLoader />
    </AnimationWrapper>
    <Footer>
      <Title>{children }</Title>
    </Footer>
  </Wrapper>;

export const renderVerifyUnwrapped = ({
  modelId,
  type,
  t
}) => (<Wrapper>
  <AnimationWrapper modelId={modelId}>
    <Animation animation={getDeviceAnimation(modelId, type, "validate")} />
  </AnimationWrapper>
  <Footer>
      <Title>{t("signTx")}</Title>
    </Footer>
  </Wrapper>
);