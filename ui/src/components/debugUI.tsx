import { Button, ButtonGroup, Checkbox, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Selection, Spinner, Switch } from "@heroui/react";
import { useStoreSelector } from "../store/store";
import { useEffect, useMemo, useRef, useState } from "react";
import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime";
import { WriteToPort } from "../../wailsjs/go/main/Serial";
import toast from "react-hot-toast";
import { FaCaretDown } from "react-icons/fa";
import Dayjs from "dayjs";
import { SaveFile } from "../../wailsjs/go/main/App";
import { ClipboardSetText } from "../../wailsjs/runtime/runtime";
import { BsSend } from "react-icons/bs";
import { useTranslation } from "react-i18next";

const timestamp = () => {
    return `[${Dayjs().format('YYYY-MM-DD HH:mm:ss.SSS')}] `
}

const strToHex = (hex: string) => {
    const value = hex.replace(/\s+/g, '')
    if (/^[0-9A-Fa-f]+$/.test(value) && value.length % 2 === 0) {
        let data = []
        for (let i = 0; i < value.length; i = i + 2) {
            data.push(parseInt(value.substring(i, i + 2), 16))
        }
        return Uint8Array.from(data);
    }
}

const useSubmitHandler = () => {
    const isComposing = useRef(false);
    useEffect(() => {
        const onCompositionStart = () => {
            isComposing.current = true;
        };
        const onCompositionEnd = () => {
            isComposing.current = false;
        };
        window.addEventListener("compositionstart", onCompositionStart);
        window.addEventListener("compositionend", onCompositionEnd);

        return () => {
            window.removeEventListener("compositionstart", onCompositionStart);
            window.removeEventListener("compositionend", onCompositionEnd);
        };
    }, []);
    const shouldSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Fix Chinese input method "Enter" on Safari
        if (e.keyCode == 229) return false;
        if (e.key !== "Enter") return false;
        if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
            return false;
        return true;
    }
    return {
        shouldSubmit,
    };
}

export default function DebugUI() {
    const serialStatus = useStoreSelector((state) => state.serial.isOpen);
    const config = useStoreSelector((state) => state.globalConfig.config);
    const [serialLog, setSerialLog] = useState("");
    const [serialData, setSerialData] = useState("");
    const [newLine, setNewLine] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [autoScroll, setAutoScroll] = useState(config.debugAutoScroll);
    const [logModes, setLogModes] = useState<Selection>(new Set(["string"]));
    const [loopSend, setLoopSend] = useState(false);
    const [sendInterval, setSendInterval] = useState(1000);
    const [loopSendID, setLoopSendID] = useState<number | null>(null);
    const [hexMode, setHexMode] = useState(false);
    const logModeValue = useMemo(
        () => Array.from(logModes).join(", ").replace(/_/g, ""),
        [logModes],
    );
    const { t } = useTranslation();
    const logMode: { [key: string]: string } = {
        "string": t("text"),
        "hex": t("hex")
    }
    const [newlineChar, setNewlineChar] = useState("LF");
    useEffect(() => {
        EventsOff("UartData");
        EventsOn("UartData", (data) => {
            let s = atob(data);

            if (logModeValue === "hex") {
                const byteArray = new Uint8Array(s.length);
                for (let i = 0; i < s.length; i++) {
                    byteArray[i] = s.charCodeAt(i);
                }
                const hexArray = Array.from(byteArray).map(byte => `${byte.toString(16).padStart(2, '0').toUpperCase()}`);
                s = hexArray.join(' ') + " ";
            }
            s = `${config.debugShowTimestamp ? timestamp() : ""}${config.debugShowInOutTag ? `[${t("serialOutput")}] ` : ""}${s}${config.debugShowInOutTag || config.debugShowTimestamp ? "\n" : ""}`;
            setSerialLog((prev) => {
                let newLog = prev + s;
                let split = logModeValue === "hex" && !(config.debugShowInOutTag || config.debugShowTimestamp) ? "0A " : "\n";
                let logLines = newLog.split(split);
                if (logLines.length > 1200) {
                    newLog = newLog.endsWith(split) ? logLines.slice(-1000).join(split) + split : logLines.slice(-1000).join(split);
                }
                return newLog;
            });
        });
        const handleRestUartLog = () => {
            setSerialLog("");
        }
        window.addEventListener("resetUartLogData", handleRestUartLog);
        return () => {
            EventsOff("UartData");
            window.removeEventListener("resetUartLogData", handleRestUartLog);
        }
    }, [config, logModes]);
    useEffect(() => {
        if (textareaRef.current && autoScroll) {
            textareaRef.current.scrollTo({
                top: textareaRef.current.scrollHeight,
                // behavior: "smooth"
            });
        }
    }, [serialLog, autoScroll]);
    useEffect(() => {
        if (!serialStatus && loopSendID !== null) {
            clearInterval(loopSendID);
            setLoopSendID(null);
            setSerialData("");
        }
    }, [serialStatus]);

    const sendHandler = () => {
        if (serialData.length > 0) {
            let textencoder = new TextEncoder();
            let data = textencoder.encode(`${serialData}${newLine ? (newlineChar === "LF" ? "\n" : "\r\n") : ""}`);
            let serialSendData = Array.from(data);
            if (hexMode) {
                let res = strToHex(serialData);
                if (!res) {
                    toast.error(`parse ${data} to hex faild`);
                    return;
                }
                //todo: send hex data
                serialSendData = Array.from(res);

            }
            // if (newLine) {
            //     data = data + (newlineChar === "LF" ? "\n" : "\r\n");
            // }
            if (!loopSend) {
                WriteToPort(serialSendData).then(() => {

                    setSerialData("");
                }).catch((e) => {
                    toast.error(`write to uart error: ${e}`);
                });
            } else {
                if (loopSendID === null) {
                    WriteToPort(serialSendData).then(() => {

                        const id = setInterval(() => {
                            WriteToPort(serialSendData).catch((e) => {
                                toast.error(`write to uart error: ${e}`);
                            });
                        }, sendInterval);
                        setLoopSendID(id);
                    }).catch((e) => {
                        toast.error(`write to uart error: ${e}`);
                    });
                } else {
                    clearInterval(loopSendID);
                    setLoopSendID(null);
                    setSerialData("");
                }
            }
        }
    }

    const { shouldSubmit } = useSubmitHandler();

    return (
        <div className="flex flex-col w-full h-full bg-white">
            <div className="flex flex-row w-full gap-2 rounded-sm p-1 justify-start border-b-1 shadow-sm">
                <div className="flex w-40 h-full items-center justify-start select-none cursor-default ps-3">
                    <p className="text-lg font-bold text-center pointer-events-none cursor-default">{t("serialPortLog")}</p>
                </div>


                <div className="flex flex-row w-full h-full gap-1 justify-end items-center">

                    <Switch isSelected={autoScroll} onValueChange={setAutoScroll} size="sm" color="success">
                        {t("autoScroll")}
                    </Switch>

                    <Dropdown>
                        <DropdownTrigger>
                            <Button color="default" size="sm" variant="ghost" className="w-36" endContent={<FaCaretDown />}>
                                {`${t("logType")}: ${logMode[logModeValue]}`}
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            disallowEmptySelection={true}
                            aria-label={t("logType")}
                            variant="flat"
                            selectedKeys={logModes}
                            selectionMode="single"
                            onSelectionChange={setLogModes}
                        >
                            <DropdownItem key="string">{t("text")}</DropdownItem>
                            <DropdownItem key="hex">{t("hex")}</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                    <ButtonGroup radius="sm" size="sm">
                        <Button color="default" size="sm" variant="bordered" isDisabled={serialLog.length === 0} onPress={() => setSerialLog("")}>
                            {t("Clean")}
                        </Button>
                        <Button color="default" size="sm" variant="bordered" isDisabled={serialLog.length === 0} onPress={() => {
                            let copyData = serialLog
                            if (textareaRef.current && textareaRef.current.selectionEnd > textareaRef.current.selectionStart) {
                                let selectData = textareaRef.current.value.substring(textareaRef.current.selectionStart, textareaRef.current.selectionEnd);
                                if (selectData.length > 0) {
                                    copyData = selectData;
                                }
                            }
                            ClipboardSetText(copyData).then((flag) => {
                                if (flag) {
                                    toast.success(t("copiedSuccessed"))
                                } else {
                                    toast.error(t("copiedFailed"))
                                }
                            }).catch((e) => {
                                toast.error(`${t("copiedFailedCase")} ${e}`)
                            })
                        }}>
                            {t("Copy")}
                        </Button>
                        <Button color="default" size="sm" variant="bordered" isDisabled={serialLog.length === 0} onPress={() => {
                            SaveFile(serialLog).then((r) => {
                                if (r) {
                                    toast.success(t("exportSuccessed"));
                                }
                            }).catch((e) => {
                                toast.error(`${t("exportFailed")} ${e}`)
                            });
                        }}>
                            {t("exportBtn")}
                        </Button>
                    </ButtonGroup>
                </div>

            </div>
            <div className="flex flex-1 w-full p-1">
                {/* <Textarea className="p-1 h-full" radius="sm" size="lg" isReadOnly minRows={1000} disableAnimation={true} /> */}
                <textarea className="py-3 px-4 w-full border-gray-200 focus: outline-none border-1 rounded-md text-sm resize-none overflow-y-auto font-mono" readOnly={true} value={serialLog} ref={textareaRef}></textarea>
            </div>
            <div className="flex flex-col px-2 mb-3 w-full h-16 gap-1">
                <Input
                    className="w-full outline-none"
                    size="sm"
                    variant="faded"
                    placeholder={!serialStatus ? t("openUartPortFirst") : t("sendByEnter")}
                    isDisabled={!serialStatus || loopSendID !== null}
                    value={serialData}
                    onValueChange={setSerialData}
                    spellCheck="false"
                    onKeyDown={(e) => {
                        if (shouldSubmit(e) && serialData.length > 0) {
                            sendHandler();
                        }
                    }}
                />
                <div className="flex flex-row justify-between">
                    <div className="flex flex-row justify-start items-center gap-2">
                        <Checkbox size="sm" className="font-light" isSelected={newLine && !hexMode} isDisabled={hexMode} onValueChange={setNewLine}>{t("addNewLineChar")}</Checkbox>
                        <select
                            className="p-2 block w-16 border-1 border-gray-200 rounded-sm text-xs outline-none bg-transparent disabled:opacity-50 disabled:pointer-events-none"
                            value={newlineChar}
                            onChange={(e) => {
                                setNewlineChar(e.target.value);
                            }}
                            disabled={!newLine || loopSendID !== null || hexMode}
                        >
                            <option value="LF">LF</option>
                            <option value="CRLF">CRLF</option>
                        </select>
                        <Checkbox size="sm" className="font-light" isSelected={hexMode} isDisabled={loopSendID !== null} onValueChange={setHexMode}>{t("sendHexMode")}</Checkbox>
                        <Checkbox size="sm" className="font-light" isSelected={loopSend} onValueChange={setLoopSend} isDisabled={loopSendID !== null}>{t("loopSend")}</Checkbox>
                        <div className={`flex flex-row h-full gap-2 justify-start cursor-default items-center ${loopSend ? "" : "hidden"}`}>
                            <p className="text-xs font-light select-none cursor-default pointer-events-none">{t("sendInterval")}</p>
                            <input
                                type="text"
                                className="py-3 px-2 block w-16 h-4 border-1 border-gray-200 rounded-md text-sm outline-none disabled:opacity-50 disabled:pointer-events-none bg-gray-100"
                                placeholder="ms"
                                disabled={!loopSend || loopSendID !== null}
                                value={sendInterval}
                                onChange={(e) => {
                                    setSendInterval(parseInt(e.target.value));
                                }}
                            />
                            <p className="text-xs font-light select-none pointer-events-none">ms</p>
                        </div>
                    </div>
                    <Button
                        size="sm" color={loopSendID === null ? "primary" : "danger"} radius="sm" isDisabled={!serialStatus || serialData.length === 0}
                        onPress={sendHandler}
                    >
                        {loopSendID !== null && <Spinner color="white" size="sm" />}
                        {loopSendID === null && <BsSend />}
                        {loopSendID === null ? t("send") : t("stop")}
                    </Button>
                </div>
            </div>
        </div >
    )
}