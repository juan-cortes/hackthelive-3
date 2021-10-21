import React, { useMemo, useState, useCallback } from 'react'
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import Head from 'next/head'
import styled from "styled-components";

const Wrapper = styled.div`
  padding: 20px;
  border: 1px solid red;
`



export default function Home() {
  const [transport, setTransport] = useState();

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
    <Wrapper>
      <Head>
        <title>Hack the Live #3</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>{USBSupported?"WebUSB supported":"WebUSB not supported"}</div>
      <pre>{JSON.stringify(transport, null, 2)}</pre>
      <button disabled={!!transport} onClick={onConnect}>Connect device</button>
      <button disabled={!transport} onClick={()=>setTransport()}>Disconnect device</button>
      <button disabled={!transport} onClick={onOpenApp}>Open Bitcoin</button>
      <button disabled={!transport} onClick={onClick}>Read device name</button>
      <button disabled={!transport} onClick={onSetDummyName}>Set dummy name</button>
    </Wrapper>
  )
}
