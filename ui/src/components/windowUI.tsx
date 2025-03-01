import DebugUI from "./debugUI";
import { SerialSetting } from "./serialSetting";
import { useStoreSelector } from "../store/store";
import { useXterm } from "./termUI";
import { useEffect, useRef } from "react";
import { EventsOff, EventsOn } from "../../wailsjs/runtime/runtime";
import { WriteToPort } from "../../wailsjs/go/main/Serial";
import { TransDetail } from "./transFileDialog";

const Term = () => {
    const { ref, instance } = useXterm();
    useEffect(() => {
        if (instance && instance.current) {
            EventsOff("UartTermData");
            EventsOn("UartTermData", (data) => {
                instance.current?.write(atob(data));

            });
            let textencoder = new TextEncoder();
            instance.current.onData((data) => {
                let bytes = Array.from(textencoder.encode(data));
                WriteToPort(bytes);

            });
        }
        return () => {
            EventsOff("UartTermData");
        }
    }, []);
    const transRef = useRef<any>(null);
    useEffect(() => {
        if (transRef && transRef.current) {
            EventsOn("OpenTransDialog", (data) => {
                console.log("event data:", data);
                const info = data as transInfo;
                if (transRef && transRef.current) {
                    transRef.current.open(info.isdown, info.name, info.size);
                }
            });
            EventsOn("TransFinished", () => {
                console.log("get finished event");
                setTimeout(() => {
                    if (transRef && transRef.current) {
                        transRef.current.close();
                    }
                }, 1500);
            })
        }
        return () => {
            EventsOff("OpenTransDialog");
            EventsOff("TransFinished");
        }
    }, [])
    return (
        <>
            <div className="flex flex-col w-full h-full bg-black" ref={ref} />
            <TransDetail ref={transRef} />
        </>
    )
}

interface transInfo {
    isdown: boolean,
    name: string
    size: number
}

export default function ContentUI() {
    const tabname = useStoreSelector((state) => state.tabname.tab);
    const setRef = useRef<any>(null);
    useEffect(() => {
        EventsOff("UpdateTX");
        EventsOff("UpdateRX");
        EventsOn("UpdateTX", (data) => {
            setRef.current.addSentBytes(data as number);
        });
        EventsOn("UpdateRX", (data) => {
            setRef.current.addReceiveBytes(data as number);
        });
        return () => {
            EventsOff("UpdateTX");
            EventsOff("UpdateRX");
        }
    })
    return (
        <div className="flex flex-row w-full h-full overflow-hidden transition-all duration-200">
            <SerialSetting ref={setRef} />
            <div className={`w-full h-full overflow-hidden ${tabname !== "debug" ? "hidden" : ""}`}>
                <DebugUI />
            </div>
            <div className={`w-full h-full bg-black overflow-hidden ${tabname === "debug" ? "hidden" : ""}`}>
                <Term />
            </div>
        </div>
    )
}