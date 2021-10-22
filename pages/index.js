import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
  useReducer
} from "react";
// import { StyleProvider, Text, Logos, Flex, Button } from "@ledgerhq/react-ui";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
const logger = require("@ledgerhq/logs");
import Head from "next/head";
import styled from "styled-components";
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

import getAppAndVersion from "../pages/cmd/getAppAndVersion";
import getAddress from "../pages/cmd/getAddress";

import connectApp from "../pages/cmd/connectApp";
import useReplaySubject from "../pages/utils/useReplaySubject";
import { reducer, getInitialState } from "../pages/deviceAction/reducer";

import { StyleProvider, Text, Logos, Flex, Button } from "@ledgerhq/react-ui";

import DeviceAction from "./deviceAction";

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

  return addresses.length?<pre>{JSON.stringify(addresses, null, 2)}</pre>:null;
}

function Home() {
  useEffect(()=>logger.listen(log => console.log(log.type + ": " + log.message)),[]);
  const [transport, setTransport] = useState();
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(getInitialState(transport));
  const deviceSubject = useReplaySubject(transport?.device); // Is device and transport interchangeable here?

  const [palette, setPalette] = React.useState("light");
  const isLight = palette === "light";

  const USBSupported = useMemo(
    () =>
      typeof window !== "undefined" &&
      !!navigator &&
      !!navigator.usb &&
      typeof navigator.usb.getDevices === "function",
    []
  );

  const onConnect = useCallback(async () => {
    if (!transport) {
      // NB This must be triggered from a native user interaction or it will fail, we can't
      // just call this at will, after this initial one we need to call `openConnected` (?)
      const transport = await TransportWebUSB.create();
      setTransport(transport);
    }
  }, []);
  
  const onGetAppAndVersion = useCallback(async () => {
    if (transport) {
      const newTransport = await TransportWebUSB.openConnected();
      const result = await getAppAndVersion(newTransport)
      console.log({transport, newTransport},"getAppAndVersionResult")
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
        if (transport._disconnectEmitted) {
          // We can no longer trust this device, clean this up to avoid multiple calls
          TransportWebUSB.openConnected().then(t=> {
            console.log("renewing connection", {transport: transport.channel, t: t.channel})
            setTransport(t);
            pollingOnDevice = t;
            loopT = setTimeout(loop, POLLING);
          })
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
        takeWhile((s) => !s.requiresAppInstallation && !s.error, true)
      ) // the state simply goes into a React state
      .subscribe(setState);

    // FIXME shouldn't we handle errors?! (is an error possible?)
    return () => {
      console.log("unmounting")
      sub.unsubscribe();
    };
  }, [state.opened, transport?.channel, pollingOnDevice, running]);

  return (
      <StyleProvider fontsPath="assets/fonts" selectedPalette={palette}>
    <Wrapper>
      <Head>
        <title>Hack the Live #3</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DeviceAction state={state} type={palette} Result={Result} />
      <div>
      <Button type="primary" disabled={!!transport} onClick={onConnect}>
        Connect device
      </Button>
      <Button
        type="primary"
        disabled={!transport}
        onClick={() => setTransport()}
      >
        Disconnect device
      </Button>
      <Button type="primary" disabled={!transport} onClick={()=>setRunning(true)}>
        Start
      </Button>
      <Button type="primary" disabled={!transport} onClick={onGetAppAndVersion}>
        Send getAppAndVersion apdu
      </Button>
      </div>
    </Wrapper>
    </StyleProvider>
  );
}


export default Home;