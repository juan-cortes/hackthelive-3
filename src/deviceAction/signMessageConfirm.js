import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Flex as Box, Text } from "@ledgerhq/react-ui";

import { renderVerifyUnwrapped } from "./rendering";

const SignMessageConfirmField = ({
  children,
  label,
}) => (
  <Box horizontal justifyContent="space-between" mb={2}>
    <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={3}>
      {label}
    </Text>
    {children}
  </Box>
);

const FieldText = styled(Text).attrs(() => ({
  ml: 1,
  ff: "Inter|Medium",
  color: "palette.text.shade80",
  fontSize: 3,
}))`
  word-break: break-all;
  text-align: right;
  max-width: 50%;
`;

const TextField = ({ field }) => {
  return (
    <SignMessageConfirmField label={field.label}>
      <FieldText>{field.value}</FieldText>
    </SignMessageConfirmField>
  );
};

const Container = styled(Box).attrs(() => ({
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  fontSize: 4,
  pb: 4,
  flex: 1,
}))``;

const SignMessageConfirm = ({ device, signMessageRequested: message, type, t }) => {
  if (!device) return null;

  const fields = [];

  if (message.hashes && message.hashes.domainHash) {
    fields.push({
      type: "text",
      label: t("SignMessageConfirm.domainHash"),
      // $FlowFixMe
      value: message.hashes.domainHash,
    });
  }
  if (message.hashes && message.hashes.messageHash) {
    fields.push({
      type: "text",
      label: t("SignMessageConfirm.messageHash"),
      // $FlowFixMe
      value: message.hashes.messageHash,
    });
  }
  if (message.hashes && message.hashes.stringHash) {
    fields.push({
      type: "text",
      label: t("SignMessageConfirm.stringHash"),
      // $FlowFixMe
      value: message.hashes.stringHash,
    });
  }
  fields.push({
    type: "text",
    label: t("SignMessageConfirm.message"),
    value: message.message && message.message.domain ? JSON.stringify(message.message) : message.message,
  });

  return renderVerifyUnwrapped({ modelId: device.modelId, type, t });
};

export default SignMessageConfirm;
