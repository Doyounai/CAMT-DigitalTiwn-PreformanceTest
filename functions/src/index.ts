import * as functions from 'firebase-functions';
import * as admin  from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2';

setGlobalOptions({region: 'asia-southeast1'});

admin.initializeApp();

export const onCamtDeviceRealtimeDBUpdate = functions.database.ref("/camt-device/{deviceID}").onWrite(async (snapshot, context) => {
    debugger;

    if(context.params.deviceID == "id-Display-1" || context.params.deviceID == "id-Display-2"){
        return;
    }

    const currentTime = Date.now();
    const sendingTime = snapshot.before.val()["Timestamp"];

    const latency = currentTime - sendingTime;

    // header
    const docRef = admin.firestore().collection("latency").doc("1");
    const res = (await docRef.get()).data();

    if(res?.count > 0){
        await docRef.set({
            "latency": (res?.total + latency) / (res?.count + 1),
            "total": res?.total + latency,
            "count": res?.count + 1,
        });
    } else {
        await docRef.set({
            "latency": latency,
            "total": latency,
            "count": 1,
        });
    }

    // log
    const logDocRef = admin.firestore().collection("latency").doc("1").collection("log").doc();
    await logDocRef.set({
        "deviceId": context.params.deviceID,
        "latency": latency,
        "receive": currentTime,
        "sending": sendingTime
    });
});