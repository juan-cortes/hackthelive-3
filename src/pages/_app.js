import React from "react";
import { appWithTranslation } from "next-i18next";
import { StyleProvider } from "@ledgerhq/react-ui";

const CustomApp = ({ Component, pageProps }) => (
  <StyleProvider fontsPath="assets/fonts" selectedPalette="dark">
    <Component {...pageProps} />
  </StyleProvider>
);

export default appWithTranslation(CustomApp);
