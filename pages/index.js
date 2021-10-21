import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
} from "react";
// import { StyleProvider, Text, Logos, Flex, Button } from "@ledgerhq/react-ui";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
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
import connectApp from "../pages/cmd/connectApp";
import useReplaySubject from "../pages/utils/useReplaySubject";
import { reducer, getInitialState } from "../pages/deviceAction/reducer";

const Wrapper = styled.div`
  padding: 20px;
  border: 1px solid red;
`;

export default function Home() {
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

  const onConnect = useCallback(() => {
    if (!transport) {
      TransportWebUSB.create().then(setTransport);
    }
  }, []);
  
  // useEffect(()=>{
  //   if(!transport?.device?.opened){
  //     console.log("wadus", "open new transport connection")
  //     TransportWebUSB.create().then(t => pollingOnDevice = t);
  //   }else{
  //     console.log("wadus", "not opening because its open")
  //   }
  // },[transport?.device?.opened])

  let pollingOnDevice;
  useEffect(() => {
    if (!running || state.opened) return;
    const action = () => connectApp({transport, appName:"Bitcoin"})
    
    // Buckle up for spageti 
    const sub = Observable.create((o) => {
      const POLLING = 2000;
      const INIT_DEBOUNCE = 5000;
      const DISCONNECT_DEBOUNCE = 5000;
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
        console.log("wadus", "app/polling", "device init timeout");
      }, INIT_DEBOUNCE);

      let connectSub;
      let loopT;
      let disconnectT;
      let device = null; // used as internal state for polling

      function loop() {
        if (!pollingOnDevice) {
          console.log("wadus", "!pollingOnDevice, so rerunning")
          loopT = setTimeout(loop, POLLING);
          return;
        }

        connectSub = from(action())
          .pipe(
            timeout(DEVICE_POLLING_TIMEOUT),
            catchError((err) => {
              console.log("wadus", "error", err);
            })
          )
          .subscribe({
            next: (event) => {
              if (!event) return;
              if (initT) {
                clearTimeout(initT);
                initT = null;
              }
              if (disconnectT) {
                // any connect app event unschedule the disconnect debounced event
                disconnectT = null;
                clearTimeout(disconnectT);
              }
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
      sub.unsubscribe();
    };
  }, [state.opened, pollingOnDevice, running]);

  const onClick = useCallback(async ()=>{
    await transport.send(0xe0, 0x50, 0x00, 0x00).catch(() => {});
    const res = await transport.send(0xe0, 0xd2, 0x00, 0x00);
    console.log("deviceInfo read", res.slice(0, res.length - 2).toString("utf-8"));
  }, [transport])

  return (
    <Wrapper>
      <Head>
        <title>Hack the Live #3</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>{USBSupported ? "WebUSB supported" : "WebUSB not supported"}</div>
      <button type="primary" disabled={!!transport} onClick={onConnect}>
        Connect device
      </button>
      <button
        type="primary"
        disabled={!transport}
        onClick={() => setTransport()}
      >
        Disconnect device
      </button>
      <button type="primary" disabled={!transport} onClick={()=>setRunning(true)}>
        Start things
      </button>
      <button type="primary" disabled={!transport} onClick={onClick}>
        Read name
      </button>
    </Wrapper>
  );
}
