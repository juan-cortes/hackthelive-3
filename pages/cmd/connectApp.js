import semver from "semver";
import { Observable, concat, from, of, throwError, defer } from "rxjs";
import { mergeMap, concatMap, map, catchError, delay } from "rxjs/operators";
import getAppAndVersion from "./getAppAndVersion";

const cmd = ({
  transport,
  appName,
  requiresDerivation,
}) => new Observable((o) => {

    const timeoutSub = of({
      type: "unresponsiveDevice",
    })
      .pipe(delay(1000))
      .subscribe((e) => o.next());

    const innerSub = ({ appName }) => defer(() => from(getAppAndVersion(transport))).pipe(
        concatMap((appAndVersion) => {
          timeoutSub.unsubscribe();
          if (["BOLOS", "OLOS\u0000"].includes(appAndVersion.name)) {
            // Try to open app
            return concat(
              of({
                type: "ask-open-app",
                appName,
              }),
              defer(() => from(transport.send(0xe0, 0xd8, 0x00, 0x00, Buffer.from(appName, "ascii")))).pipe(
                concatMap(() =>
                  of({
                    type: "device-permission-granted",
                  })
                ),
                catchError((e) => {
                  of({
                    type: "error",
                    e
                  })
                })
              ))
          } else if (appAndVersion?.name !== appName) {
            // Quit open app, WARNING about using this without checking if the app
            // is capable of exit blablabla, don't get mad at me if you wipe your device.
            // emit a disconnect after to restart the thing
            return from(transport.send(0xb0, 0xa7, 0x00, 0x00)).pipe(
              delay(1000),
              concatMap(() =>
                of({
                  type: "disconnected",
                })
              )
            );
          }

          if (requiresDerivation) {
            // Some logic here to getAddress yada yada
            return of({type: "derive shit"})
          } else {
            // We did it!
            const et = {
              type: "opened",
              app: appAndVersion,
            };
            return of(et);
          }
        }),
        catchError((e) => {
          // All errors are disconnects now
          return of({
              type: "disconnected",
              error: e
            });
        })
      );
    
    const sub = innerSub({
      appName,
    }).subscribe(o);

    return () => {
      timeoutSub.unsubscribe();
      sub.unsubscribe();
    };
  });

export default cmd;
