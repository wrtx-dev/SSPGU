import { Button, Input, Select, SelectItem } from "@heroui/react";
import { MdOutlineChevronLeft, MdOutlineChevronRight } from "react-icons/md";
import { forwardRef, Ref, useEffect, useImperativeHandle, useState } from "react";
import { useStoreSelector, useStoreDispatch } from "../store/store";
import { setSerialOpenStatus } from "../store/serialStatus";
import { OpenSerialPort, ClosePort, StartPortsWatcher, StartRead } from "../../wailsjs/go/main/Serial";
import toast from 'react-hot-toast';
import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime";
import { useTranslation } from "react-i18next";

const protName = (port: string) => {
    let name = port.match(/\/dev\/(.*)/);
    return name ? name[1] : port;
}

export const SerialSetting = forwardRef((_: {}, settingRef: Ref<any>) => {
    const [ports, setPorts] = useState<string[]>([]);
    const [hide, setHide] = useState(false);
    // GetSerialPorts().then((ps) => {
    //     setPorts(ps)
    // });
    const { t } = useTranslation();
    const dispatch = useStoreDispatch();
    const serialStatus = useStoreSelector((state) => state.serial.isOpen);
    const [receiveBytes, setReceiveBytes] = useState(0);
    const [sentBytes, setSentBytes] = useState(0);

    useImperativeHandle(settingRef, () => ({
        addReceiveBytes: (n: number) => {
            setReceiveBytes((prev) => prev + n);
        },
        addSentBytes: (n: number) => {
            setSentBytes((prev) => prev + n);
        }
    }));
    useEffect(() => {
        EventsOff("UpdataUartPort");
        EventsOn("UpdataUartPort", (data) => {
            setPorts(data)
        });
        EventsOff("SerialErr");
        EventsOn("SerialErr", (e) => {
            toast.error(`${t("uartErr")}: ${e}`);
            ClosePort();
            dispatch(setSerialOpenStatus(false));
        });
        return () => {
            EventsOff("UpdataUartPort");
        }
    }, [])
    const config = useStoreSelector((state) => state.globalConfig.config);
    const uiMode = useStoreSelector((state) => state.tabname.tab);
    const [serialPort, setSerialPort] = useState<string>("");
    const handleSerialSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSerialPort(e.target.value);
    };
    StartPortsWatcher();
    const [baudRate, setBaudRate] = useState("115200");
    const [dataBits, setDataBits] = useState("digit8");
    const handleDatabitSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === "") {
            return;
        }
        setDataBits(e.target.value);
    }
    const [stopBits, setStopBits] = useState("stop1");
    const handleStopbitSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === "") {
            return;
        }
        setStopBits(e.target.value);
    }
    const [parity, setParity] = useState("None");
    const handleParitySelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === "") {
            return;
        }
        setParity(e.target.value);
    }
    return (
        <div className="flex flex-row-reverse h-full bg-white border-1 rounded-md transition-all duration-200">
            <div className="flex h-full w-3 items-center bg-gray-50 justify-center cursor-pointer" onClick={() => {
                setHide((old) => {
                    return !old;
                });
                setTimeout(() => {
                    window.dispatchEvent(new Event("resize"));
                }, 100);
            }}>
                {!hide ? <MdOutlineChevronLeft /> : <MdOutlineChevronRight />}
            </div>
            <div className={"flex w-52 flex-col h-full bg-transparent m-1 justify-start gap-1" + (hide ? " hidden" : "")}>
                <div className="flex flex-col jusitfy-start w-52 border-1 border-gray-100 rounded-md p-1 gap-1">
                    <div className="flex justify-start items-center bg-gray-50 border-1 border-gray-50 shadow-sm rounded-md px-2">
                        <p className="text-sm font-light select-none justify-center pointer-events-none">{t("serialPortSetup")}</p>
                    </div>
                    <Select className="w-52 px-2" label={t("serialPort")} size="sm" variant="bordered" isDisabled={serialStatus} selectedKeys={[serialPort]} onChange={handleSerialSelectionChange}>
                        {ports.map((port) => (
                            <SelectItem key={port}>{protName(port)}</SelectItem>
                        ))}
                    </Select>
                    <Input className="w-52 px-2" label={t("baudrate")} variant="bordered" size="sm" type="number" isDisabled={serialStatus} value={baudRate} onValueChange={setBaudRate}></Input>
                    <Select className="w-52 px-2" label={t("dataBit")} size="sm" variant="bordered" isDisabled={serialStatus} selectedKeys={[dataBits]} onChange={handleDatabitSelectionChange}>
                        <SelectItem key="digit8">8</SelectItem>
                        <SelectItem key="digit7">7</SelectItem>
                    </Select>
                    <Select className="w-52 px-2" label={t("stopBit")} size="sm" variant="bordered" isDisabled={serialStatus} selectedKeys={[stopBits]} onChange={handleStopbitSelectionChange}>
                        <SelectItem key="stop1">1</SelectItem>
                        <SelectItem key="stop2">2</SelectItem>
                    </Select>
                    <Select className="w-52 px-2" label={t("parity")} size="sm" variant="bordered" isDisabled={serialStatus} selectedKeys={[parity]} onChange={handleParitySelectionChange}>
                        <SelectItem key="None">None</SelectItem>
                        <SelectItem key="Even">Even</SelectItem>
                        <SelectItem key="Odd">Odd</SelectItem>
                    </Select>
                </div>
                <div className="flex flex-1 flex-col w-full h-full border-1 rounded-md gap-0.5">
                    <div className="flex justify-start items-center bg-gray-50 border-1 border-gray-50 shadow-sm rounded-md ps-2">
                        <p className="text-sm font-light select-none justify-start pointer-events-none">{t("status")}</p>
                    </div>
                    <p className="block ps-2 text-sm font-light break-all truncate select-none pointer-events-none">{t("connection")}: {serialStatus ? protName(serialPort) : t("waitConnect")}</p>
                    <p className="block ps-2 text-sm font-light break-all truncate select-none pointer-events-none">{t("rxCount")}</p>
                    <p className="block ps-2 text-xs font-light break-all truncate select-none pointer-events-none">{receiveBytes}</p>
                    <p className="block ps-2 text-sm font-light break-all truncate select-none pointer-events-none">{t("txCount")}</p>
                    <p className="block ps-2 text-xs font-light break-all truncate select-none pointer-events-none">{sentBytes}</p>

                </div>
                <Button
                    size="sm"
                    className="w-48 m-3"
                    color={serialStatus ? "danger" : "primary"}
                    onPress={() => {
                        if (serialStatus) {
                            ClosePort();
                            dispatch(setSerialOpenStatus(false));
                        } else {
                            OpenSerialPort(serialPort, parseInt(baudRate), dataBits === "digit8" ? 8 : 7, stopBits === "stop1" ? 1 : 2, parity, uiMode !== "debug").then((flag) => {
                                dispatch(setSerialOpenStatus(flag));
                                setSentBytes(0);
                                setReceiveBytes(0);
                                if (uiMode == "debug") {
                                    if (config.clearDataOnUartOpen) {
                                        window.dispatchEvent(new Event("resetUartLogData"));
                                    }
                                    StartRead("UartData");
                                } else {
                                    if (config.clearDataOnUartOpen) {
                                        window.dispatchEvent(new Event("resetXterm"));
                                    }
                                    StartRead("UartTermData");
                                    if (config.autoHideSerialSettingOnTermMode) {
                                        setHide(true);
                                        setTimeout(() => {
                                            window.dispatchEvent(new Event("resize"));
                                        }, 100);
                                    }
                                }

                            }).catch((e) => {
                                toast.error(`open serial error:${e}`);
                                dispatch(setSerialOpenStatus(false));
                            })
                        }
                    }}
                    isDisabled={serialPort === ""}
                >
                    {serialStatus ? t("closeSerialPort") : t("openSerialPort")}
                </Button>
            </div>
        </div>
    )
}
)