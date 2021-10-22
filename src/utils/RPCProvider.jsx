import React, { useState, useEffect } from "react";
import { RPC } from "@mixer/postmessage-rpc";

const exposedMethods = ["requestAccount", "signTransaction"];

export const RPCContext = React.createContext({});

const RPCProvider = ({ children }) => {
  const [rpcMethods, setRPCMethods] = useState({});

  useEffect(() => {
    if (!window.opener) return null;

    const rpc = new RPC({
      target: window.opener,
      service: "ledger-widget",
    });

    // expose methods to the consumer
    exposedMethods.forEach((method) => {
      rpc.expose(
        method,
        () =>
          new Promise((resolve, reject) =>
            setRPCMethods((current) => ({
              ...current,
              [method]: { resolve, reject },
            }))
          )
      );
    });

    // --- Window.opener mock call
    /* rpc.call("requestAccount").then((result) => {
    **   console.log('rpc.call("requestAccount") result', result);
    **   return result;
       }); */
  }, []);

  return (
    <RPCContext.Provider value={rpcMethods}>{children}</RPCContext.Provider>
  );
};

export default RPCProvider;
