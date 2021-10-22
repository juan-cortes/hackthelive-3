import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
  useReducer
} from "react";
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from "next/link";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";
const logger = require("@ledgerhq/logs");
import Head from "next/head";
import Eth from "@ledgerhq/hw-app-eth";
import { Transaction } from "ethereumjs-tx"
import styled, { keyframes }from "styled-components";
import {
  concat,
  of,
  interval,
  Observable,
  throwError,
  TimeoutError,
  EMPTY,
  from,
} from "rxjs";
import {
  scan,
  debounce,
  debounceTime,
  catchError,
  timeout,
  switchMap,
  tap,
  distinctUntilChanged,
  takeWhile,
} from "rxjs/operators";
import isEqual from "lodash/isEqual";
import { StyleProvider, Text, Logos, Flex, Button, Switch } from "@ledgerhq/react-ui";

import getAppAndVersion from "../cmd/getAppAndVersion";
import getAddress from "../cmd/getAddress";
import connectApp from "../cmd/connectApp";
import useReplaySubject from "../utils/useReplaySubject";
import { reducer, getInitialState } from "../deviceAction/reducer";
import DeviceAction from "../deviceAction";
import SignMessageConfirm from "../deviceAction/signMessageConfirm";

const fadeIn = keyframes`
  0% { opacity:0; }
  100% { opacity 100; }
`

const fadeInGrow = keyframes`
  0% { opacity:0; max-height: 0; }
  100% { opacity 1; max-height: 100px; }
`

const Wrapper = styled(Flex).attrs(() => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center"
}))`
background-color: ${p => p.theme.colors.palette.background.main};
width: 100%;
height: 100vh;
min-height: 500px;
min-width: 500px;
overflow-x: visible;
overflow-y: scroll;
`

const SwitchContainer = styled.div`
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 2;
`

const Container = styled(Flex).attrs(() => ({
  p: 2,
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "stretch"
}))`
  width: 100%;
  height: 100%;
  border-radius: 4px;
  animation: ${fadeIn} .4s ease-out forwards;
`


const AddressContainer = styled(Flex).attrs(() => ({
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "stretch"
}))`
  width: 100%;
  height: 100%;

`

const DeviceActionWrapper = styled(Flex).attrs(() => ({
  flex: 1
}))`
max-height: 500px;
`

const ButtonWrapper = styled(Flex).attrs(() => ({
  flex: "0 0 50px",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "stretch"
}))`
`

const AddressLine = styled(Flex).attrs(() => ({
  flex: "0 0 50px",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center"
}))`
cursor: pointer;
margin: 7.5px;
max-width: 600px;
min-width: 400px;
align-self: center;
animation: ${fadeInGrow} .4s ease-out forwards;
`


const APP = "Ethereum"; // <-- make sure you have this installed
const GetAddressResult = ({state}) => {
  const [addresses, setAddresses] = useState([])

  useEffect(() => {
    try{
      const adrs = JSON.parse(localStorage.getItem("addresses"));

      if(addresses.length > 0)
        localStorage.setItem("addresses", JSON.stringify(
          addresses.concat(adrs || []).filter((a,i,arr) => arr
          .findIndex((ar) => ar.address === a.address) === i)
        ))
    } catch(e) {
      console.error(e);
    } 
    
  }, [addresses])

  useEffect(() => {
    try{
      const adrs = JSON.parse(localStorage.getItem("addresses"));
      console.log(adrs)
      if(adrs) setAddresses(adrs)
    } catch(e) {
      console.error(e);
    }    
  }, []);

  useEffect( async () => {
    if (!state.appAndVersion) return null;

    const transport = await TransportWebUSB.openConnected();
    const app = state.appAndVersion.name.toLowerCase();
    for (let i=1; i<10; i++) {
      const address = await getAddress[app](transport, { path: `44'/60'/${i}'/0/0`});
      setAddresses(addresses => [...addresses, address].filter((a,i,arr) => arr
          .findIndex((ar) => ar.address === a.address) === i)
        )
    }
  }, []);

  const selectAddress = useCallback(() => {
    // postMessage logic here
  }, [])

  return addresses.length ? <AddressContainer>
    {addresses.map((addr, i) => 
    <AddressLine key={i}>
      <Button style={{width: "400px"}} type="primary" key={i} onClick={() => selectAddress(addr)}>
        {addr.address}
      </Button>
    </AddressLine>
      )}
    </AddressContainer> : null;
}

const SignTransactionResult = ({ 
    transactionData, 
    derivationPath, 
    state, 
    device,
    account,
    signMessageRequested,
    type,
    t
}) => {
  // We have access to the data passed from the provider at this point
  const {
    data,
    from,
    gas,
    to,
    value,
  } = transactionData;

  const [rawTx, setRawTx] = useState();

  useEffect( async () => {
    if (!state.appAndVersion) return null;
    console.log("wadus", { transactionData })
    const transport = await TransportWebUSB.openConnected();
    const eth = new Eth(transport);
    const rawTx = new Transaction({
      nonce: '0x00', 
      gasLimit: '0x27100', 
      data,
      to,
      value,
    });
    setRawTx(rawTx);
    // TODO LUIZ HELP <==
    const result = await eth.signTransaction("44'/60'/0'/0/0", rawTx.serialize().toString("hex"))
  }, [])
  
  return rawTx ? <SignMessageConfirm
    device={device}
    signMessageRequested={rawTx}
    type={type}
    t={t}
  /> : null;
}

function Home() {
  const { t } = useTranslation("common");
  const [transport, setTransport] = useState();
  const [isBle, setIsBle] = useState(false);
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(getInitialState(transport));
  const deviceSubject = useReplaySubject(transport?.device); // Is device and transport interchangeable here?

  // TODO: make it reactive
  const [palette, setPalette] = React.useState("light");

  const USBSupported = useMemo(
    () =>
      typeof window !== "undefined" &&
      !!navigator &&
      !!navigator.usb &&
      typeof navigator.usb.getDevices === "function",
    []
  );

  const BLESupported = useMemo(
    () =>
      typeof window !== "undefined" &&
      !!navigator &&
      !!navigator.bluetooth,
    []
  );

  const onConnectUSB = useCallback(async () => {
    if (!transport) {
      // NB This must be triggered from a native user interaction or it will fail, we can't
      // just call this at will, after this initial one we need to call `openConnected` (?)
        const transport = await TransportWebUSB.create();
      setIsBle(false);
      setTransport(transport);
      setRunning(true);
      localStorage.setItem("addresses", JSON.stringify([]))
    }
  }, []);

  const onConnectBLE = useCallback(async () => {
    if (!transport) {
      // NB This must be triggered from a native user interaction or it will fail, we can't
      // just call this at will, after this initial one we need to call `openConnected` (?)
        const transport = await TransportWebBLE.create();
      setIsBle(true);
      setTransport(transport);
      setRunning(true);
      localStorage.setItem("addresses", JSON.stringify([]))
    }
  }, []);

  useEffect(()=>{
    logger.listen(log => console.log(log.type + ": " + log.message))
  },[]);
  
  const onGetAppAndVersion = useCallback(async () => {
    if (transport) {
      if(isBle) {
        const newTransport = await TransportWebBLE.openConnected();
        const result = await getAppAndVersion(newTransport)
        console.log({transport, newTransport},"getAppAndVersionResult")
      } else {
        const newTransport = await TransportWebUSB.openConnected();
        const result = await getAppAndVersion(newTransport)
        console.log({transport, newTransport},"getAppAndVersionResult")
      }
    }
  }, [transport]);
  

  let pollingOnDevice;

  useEffect(() => {
    if (!running || state.opened) return;
    const action = (transport) => connectApp({transport, appName: APP})
    
    // Buckle up for spageti 
    const sub = Observable.create((o) => {
      const POLLING = 5000;
      const INIT_DEBOUNCE = 5000;
      const DISCONNECT_DEBOUNCE = 1000;
      const DEVICE_POLLING_TIMEOUT = 20000;

      
      const sub = deviceSubject.subscribe((d) => {
        if (d) {
          pollingOnDevice = d;
        }
      });

      let initT = setTimeout(() => {
        // initial timeout to unset the device if it's still not connected
        o.next({
          type: "deviceChange",
          device: null,
        });
        device = null;
      }, INIT_DEBOUNCE);

      let connectSub;
      let loopT;
      let disconnectT;
      let device = null; // used as internal state for polling

      function loop() {
        if (transport && transport._disconnectEmitted) {
          if(isBle){
            // We can no longer trust this device, clean this up to avoid multiple calls
            TransportWebBLE.openConnected().then(t=> {
              console.log("renewing connection", {transport: transport.channel, t: t.channel})
              setTransport(t);
              pollingOnDevice = t;
              loopT = setTimeout(loop, POLLING);
            })
          } else {
            // We can no longer trust this device, clean this up to avoid multiple calls
            TransportWebUSB.openConnected().then(t=> {
              console.log("renewing connection", {transport: transport.channel, t: t && t.channel})
              setTransport(t);
              pollingOnDevice = t;
              loopT = setTimeout(loop, POLLING);
            })
          }
          
          return;
        }
        if (!pollingOnDevice) {
          loopT = setTimeout(loop, POLLING);
          return;
        }

        connectSub = from(action(transport))
          .pipe(
            timeout(DEVICE_POLLING_TIMEOUT),
            catchError((err) => {
              console.log("wadus", "error", err);
              return of("disconnected")
            })
          )
          .subscribe({
            next: (event) => {
              
              if (initT) {
                clearTimeout(initT);
                initT = null;
              }
              if (disconnectT) {
                // any connect app event unschedule the disconnect debounced event
                disconnectT = null;
                clearTimeout(disconnectT);
              }
              if (!event || event.type === "unresponsiveDevice") {
                o.next("disconnected")
                return; // ignore unresponsive case which happens for polling
              } else if (event.type === "disconnected") { 
                // the disconnect event is delayed to debounce the reconnection that happens when switching apps
                disconnectT = setTimeout(() => {
                  disconnectT = null;
                  // a disconnect will locally be remembered via locally setting device to null...
                  device = null;
                  o.next(event);
                }, DISCONNECT_DEBOUNCE);
              } else {
                if (device !== pollingOnDevice) {
                  // ...but any time an event comes back, it means our device was responding and need to be set back on in polling context
                  device = pollingOnDevice;
                  o.next({
                    type: "deviceChange",
                    device,
                  });
                }

                o.next(event);
              }
            },
            complete: () => {
              console.log("wadus", "complete?", state)
              // poll again in some time
              loopT = setTimeout(loop, POLLING);
            },
            error: (e) => {
              o.error(e);
            },
          });
      }

      // delay a bit the first loop run in order to be async and wait pollingOnDevice
      loopT = setTimeout(loop, 0);
      return () => {
        if (initT) clearTimeout(initT);
        if (disconnectT) clearTimeout(disconnectT);
        if (connectSub) connectSub.unsubscribe();
        clearTimeout(loopT);
      };
    })
      .pipe(
        // distinctUntilChanged(isEqual),
        tap(e => console.log("connectApp event", e)),
        // we gather all events with a reducer into the UI state
        scan(reducer, getInitialState()), 
        tap((s) => console.log("connectApp state", s)),
        // we debounce the UI state to not blink on the UI
        debounce((s) => {
          if (s.allowOpeningRequestedWording || s.allowOpeningGranted) {
            // no debounce for allow event
            return EMPTY;
          }

          // default debounce (to be tweak)
          return interval(2000);
        }),
        takeWhile((s) => !s.requiresAppInstallation && !s.error, true),
        catchError((e) => of("disconnected"))
      ) // the state simply goes into a React state
      .subscribe(setState);

    // FIXME shouldn't we handle errors?! (is an error possible?)
    return () => {
      console.log("unmounting")
      sub.unsubscribe();
    };
  }, [state.opened, transport?.channel, pollingOnDevice, running]);

  // TODO HOOKS THIS INTO RPC WHy am I yelling
  const transactionData = {
    data: "0x414bf389000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000001f4000000000000000000000000053a031856b23a823b71e032c92b1599ac1cc3f2000000000000000000000000000000000000000000000000000000006172c064000000000000000000000000000000000000000000000000023132503ad665330000000000000000000000000000000000000000000000000000000026a9fbde0000000000000000000000000000000000000000000000000000000000000000",
    from: "0x053a031856b23a823b71e032c92b1599ac1cc3f2",
    gas: "0x29786",
    to: "0xe592427a0aece92de3edee1f18e0157c05861564",
    value: "0x23132503ad66533",
  } ;
  const derivationPath = "44'/60'/0'/0/0"

  return (
    <StyleProvider fontsPath="assets/fonts" selectedPalette={palette}>
      <Wrapper>
        <SwitchContainer>
          <Switch checked={palette === "light"} onChange={() => setPalette(p => p === "light" ? "dark" : "light")} />
        </SwitchContainer>
        <Head>
          <title>Hack the Live #3</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Container>
          <DeviceActionWrapper>
            {/* <DeviceAction state={state} type={palette} Result={GetAddressResult} /> */}
            {/* TODO hook this nto the message from rpc? */}
            <DeviceAction state={state} type={palette} transactionData={transactionData}  derivationPath={derivationPath} Result={SignTransactionResult} />
          </DeviceActionWrapper>
          
          {
            !transport ? (
              <ButtonWrapper>
                <Button style={{margin: "0 15px 0 0"}} type="primary" onClick={onConnectUSB}>
                  USB
                </Button>
                
                <Button type="primary" disabled={!BLESupported} onClick={onConnectBLE}>
                  BLE
                </Button>         
              </ButtonWrapper>
            ) : null
          }
          
        </Container>
      </Wrapper>
    </StyleProvider>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'deviceAction'])),
    },
  };
}

export default Home;
