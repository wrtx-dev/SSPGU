import { Button, Navbar, NavbarBrand, NavbarContent, NavbarItem, Tab, Tabs } from "@heroui/react"
import { MdSettings } from "react-icons/md";
import { useStoreDispatch, useStoreSelector } from "../store/store";
import { setTabs } from "../store/tabSelector";
import About from "./about";
import { SettingDialog } from "./settingDlg";
import { useEffect, useRef, useState } from "react";
import { WindowToggleMaximise, Environment, WindowShow } from "../../wailsjs/runtime/runtime";
import { useTranslation } from "react-i18next";
import LangSwitcher from "./langSwitch";
import { VscDebugConsole } from "react-icons/vsc";
import { VscTerminal } from "react-icons/vsc";

export default function TitleBar() {
    const tabname = useStoreSelector((state) => state.tabname);
    const serialStatus = useStoreSelector((state) => state.serial.isOpen);
    const dispatch = useStoreDispatch();
    const sref = useRef<any>(null);
    const [isMacos, setIsMacos] = useState(false);
    const { t } = useTranslation();
    useEffect(() => {
        Environment().then((env) => {
            setIsMacos(env.platform === "darwin");
            setTimeout(() => {
                WindowShow();
            }, 20);
        })
    })
    return (
        <>
            <Navbar className={`cursor-default ${isMacos && "wails-drag"}`} height={isMacos ? 44 : undefined} maxWidth="full" isBlurred={false} isBordered onDoubleClick={() => {
                WindowToggleMaximise();
            }}>
                <NavbarBrand>
                    <div className={`w-12 pointer-events-none ${!isMacos && "hidden"}`} />
                    {tabname.tab === "debug" ? <VscDebugConsole size={28} className="me-2" /> : <VscTerminal size={28} className="me-2" />}
                    <p className={`font-bold text-sm select-none pointer-events-none cursor-default ${isMacos ? "bg-gradient-to-r from-red-400 via-blue-500 to-black bg-clip-text text-transparent" : "text-black"}`}>
                        SSPGU
                    </p>
                </NavbarBrand>
                <NavbarContent justify="center">
                    <Tabs
                        aria-label="Tab"
                        size="md"
                        selectedKey={tabname.tab}
                        onSelectionChange={(key) => {
                            dispatch(setTabs(key.toString()));
                            if (key.toString() === "term") {
                                setTimeout(() => {
                                    window.dispatchEvent(new Event("resize"));
                                }, 10);
                            }
                        }}
                        color="primary"
                        isDisabled={serialStatus}
                    >
                        <Tab key="debug" title={t("debugMode")} />
                        <Tab key="term" title={t("termMode")} />
                    </Tabs>
                </NavbarContent>
                <NavbarContent justify="end" className="flex items-center" >
                    <NavbarItem  >
                        <LangSwitcher />
                        <Button
                            color="default"
                            variant="light"
                            isIconOnly
                            radius="full"
                            onPress={() => {
                                if (sref.current) {
                                    sref.current.open();
                                }
                            }}
                            onDoubleClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}>
                            <MdSettings size={30} />
                        </Button>
                        <About hidden={isMacos} />
                        <div className="w-2" />
                    </NavbarItem>
                </NavbarContent>
            </Navbar>
            <SettingDialog ref={sref} />
        </>
    )
}