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
import { StyleProvider, Text, Logos, Flex, Button } from "@ledgerhq/react-ui";

import getAppAndVersion from "../cmd/getAppAndVersion";
import getAddress from "../cmd/getAddress";
import connectApp from "../cmd/connectApp";
import useReplaySubject from "../utils/useReplaySubject";
import { reducer, getInitialState } from "../deviceAction/reducer";
import DeviceAction from "../deviceAction";

const fadeIn = keyframes`
  0% { opacity:0; }
  100% { opacity 100; }
`

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

const Container = styled(Flex).attrs(() => ({
  p: 2,
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "stretch"
}))`
  width: 100%;
  height: 100%;
  min-width: 400px;
  min-height: 400px;
  border-radius: 4px;
  overflow-x: scroll;
`

const DeviceActionWrapper = styled(Flex).attrs(() => ({
  flex: 1
}))`

max-height: 300px;
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
margin: 15px;
max-width: 600px;
min-width: 400px;
align-self: center;
animation: ${fadeIn} .4s ease-out forwards;
${Button} {
  flex: 1;
  width: 100%;
}
`


const APP = "Ethereum"; // <-- make sure you have this installed
const Result = ({state}) => {
  const [addresses, setAddresses] = useState([])
  useEffect( async () => {
    if (!state.appAndVersion) return null;
    setAddresses([]);

    const transport = await TransportWebUSB.openConnected();
    const app = state.appAndVersion.name.toLowerCase();
    for (let i=1; i<10; i++) {
      const address = await getAddress[app](transport, { path: `44'/60'/${i}'/0/0`});
      setAddresses(addresses => [...addresses, address])
    }
  }, []);

  const selectAddress = useCallback(() => {
    // postMessage logic here
  }, [])

  return addresses.length ? <Container>
    {addresses.map((addr, i) => 
    <AddressLine key={i}>
      <Button type="primary" key={i} onClick={() => selectAddress(addr)}>
        {addr.address}
      </Button>
    </AddressLine>
      )}
    </Container> : null;
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

  useEffect(()=>logger.listen(log => console.log(log.type + ": " + log.message)),[]);

  const USBSupported = useMemo(
    () =>
      typeof window !== "undefined" &&
      !!navigator &&
      !!navigator.usb &&
      typeof navigator.usb.getDevices === "function",
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
    }
  }, []);
  
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
              console.log("renewing connection", {transport: transport.channel, t: t.channel})
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
              if (!event) return;
              if (event.type === "unresponsiveDevice") {
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

  return (
    <StyleProvider fontsPath="assets/fonts" selectedPalette="dark">
      <Wrapper>
        <Head>
          <title>Hack the Live #3</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Container>
          <DeviceActionWrapper>
            <DeviceAction state={state} type={palette} Result={Result} />
          </DeviceActionWrapper>
          <ButtonWrapper>
          {
            !transport ? <>
            <Button style={{margin: "0 15px 0 0"}} type="primary" onClick={onConnectUSB}>
              USB
            </Button>
            
            <Button type="primary" disabled={typeof window === "undefined" || !window.navigator.bluetooth} onClick={onConnectBLE}>
              BLE
            </Button>          </> : <>
            {/** <Button
                type="primary"
                onClick={() => setTransport()}
              >
                Disconnect device
              </Button>
              <Button type="primary" onClick={()=>setRunning(true)}>
                Start
              </Button>
              <Button type="primary" onClick={onGetAppAndVersion}>
                Send getAppAndVersion apdu
              </Button> 
            */}
            </>
          }
          </ButtonWrapper>
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
