import React, { useMemo, useState, useCallback } from 'react'
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import Head from 'next/head'
import styled from "styled-components";

import { StyleProvider, Text, Logos, Flex, Button } from "@ledgerhq/react-ui";

const Wrapper = styled(Flex).attrs(() => ({
  p: 2,
  flex: 1,
  justifyContent: "center",
  alignItems: "center"
}))`
background-color: ${p => p.theme.colors.palette.background.main};
height: 100vh;
width: 100vw;
`



export default function Home() {
  const [transport, setTransport] = useState();

  const [palette, setPalette] = React.useState("light");
  const isLight = palette === "light";

  const USBSupported = useMemo(()=>typeof window !== "undefined" && !!navigator && !!navigator.usb && typeof navigator.usb.getDevices === "function"
  , [])
  
  const onConnect = useCallback(()=>{
    if (!transport) {
      TransportWebUSB.create().then(setTransport);
    }
  }, [])

  const onSetDummyName = useCallback(async ()=>{
    await transport.send(0xe0, 0xd4, 0x00, 0x00, Buffer.from("dummy name"))
    console.log("deviceInfo write", "dummy name")
  }, [transport])

  const onClick = useCallback(async ()=>{
    await transport.send(0xe0, 0x50, 0x00, 0x00).catch(() => {});
    const res = await transport.send(0xe0, 0xd2, 0x00, 0x00);
    console.log("deviceInfo read", res.slice(0, res.length - 2).toString("utf-8"));
  }, [transport])

  const onOpenApp = useCallback(async ()=>{
    const name = "Bitcoin";
    await transport.send(0xe0, 0xd8, 0x00, 0x00, Buffer.from(name, "ascii"))
  })

  return (
    <StyleProvider fontsPath="assets/fonts" selectedPalette={"light"}>
    <Wrapper>
      <Head>
        <title>Hack the Live #3</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>{USBSupported?"WebUSB supported":"WebUSB not supported"}</div>
      <pre>{JSON.stringify(transport, null, 2)}</pre>
      <Flex flexDirection="column">
      <Button type="primary" disabled={!!transport} onClick={onConnect}>Connect device</Button>
      <Button type="primary" disabled={!transport} onClick={()=>setTransport()}>Disconnect device</Button>
      <Button type="primary" disabled={!transport} onClick={onOpenApp}>Open Bitcoin</Button>
      <Button type="primary" disabled={!transport} onClick={onClick}>Read device name</Button>
      <Button type="primary" disabled={!transport} onClick={onSetDummyName}>Set dummy name</Button>
      </Flex>
    </Wrapper>
    </StyleProvider>
  )
}
