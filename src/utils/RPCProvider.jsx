import React, { useState, useEffect } from "react";
import { RPC } from "@mixer/postmessage-rpc";

const exposedMethods = ["requestAccount", "signTransaction"];

export const RPCContext = React.createContext({});

const RPCProvider = ({ children }) => {
  const [requestAccount, setRequestAccounts] = useState({});
  const [transactionData, setTransactionData] = useState({});

  useEffect(() => {
    if (!window.opener) return null;

    const rpc = new RPC({
      target: window.opener,
      service: "ledger-widget",
    });

    // expose methods to the consumer
    rpc.expose("requestAccount",
        () => new Promise((resolve, reject) =>  setRequestAccounts({ resolve, reject }))
    );

    rpc.expose("signTransaction", (transaction, derivationPath) => {
      setTransactionData({transaction, derivationPath});
    });

    rpc.call("ready");
  }, []);

  return (
    <RPCContext.Provider value={{requestAccount, transactionData}}>{children}</RPCContext.Provider>
  );
};

export default RPCProvider;
