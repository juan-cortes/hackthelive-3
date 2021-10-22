import React from "react";
import { appWithTranslation } from "next-i18next";
import { StyleProvider } from "@ledgerhq/react-ui";

import RPCProvider from '../utils/RPCProvider';

const CustomApp = ({ Component, pageProps }) => (
  <RPCProvider>
    <StyleProvider fontsPath="assets/fonts" selectedPalette="dark">
      <Component {...pageProps} />
    </StyleProvider>
  </RPCProvider>
);

export default appWithTranslation(CustomApp);
