import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Switch, useDisclosure } from "@heroui/react";
import React, { forwardRef, useEffect, useState } from "react";
import { useStoreSelector, useStoreDispatch } from "../store/store";
import { globalConfig, setGlobalConfig } from "../store/globalConfig";
import { SaveConfig } from "../../wailsjs/go/main/App";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import i18n from "../lang/locale";


export const SettingDialog = forwardRef((_: {}, xref: React.Ref<any>) => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const config = useStoreSelector((state) => state.globalConfig.config);
    const [autoClean, setAutoClean] = useState(config.clearDataOnUartOpen);
    const [autoHide, setAutoHide] = useState(config.autoHideSerialSettingOnTermMode);
    const [showTimestamp, setShowTimestamp] = useState(config.debugShowTimestamp);
    const [showtag, setShowTag] = useState(config.debugShowInOutTag);
    const [autoScroll, setAutoScroll] = useState(config.debugAutoScroll);
    const dispatch = useStoreDispatch();
    const { t } = useTranslation();
    React.useImperativeHandle(xref, () => ({
        open: () => {
            onOpen();
        }
    }));
    useEffect(() => {
        setAutoClean(config.clearDataOnUartOpen);
        setAutoHide(config.autoHideSerialSettingOnTermMode);
        setShowTag(config.debugShowInOutTag);
        setShowTimestamp(config.debugShowTimestamp);
        setAutoScroll(config.debugAutoScroll);
    }, [config])
    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            radius="sm"
            backdrop="blur"
            isDismissable={false}
            isKeyboardDismissDisabled={true}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>
                            <div className="flex flex-row justify-center text-lg w-full select-none pointer-events-none cursor-default">
                                <p>{t("setup")}</p>
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <div className="flex flex-col w-full h-full gap-2">
                                <Switch color="success" isSelected={autoClean} onValueChange={setAutoClean}>{t("cleanHistoryDataWhenUartOpened")}</Switch>
                                <Switch color="success" isSelected={autoHide} onValueChange={setAutoHide}>{t("autoHideUartSettingWhenInTermMode")}</Switch>
                                <Switch color="success" isSelected={showTimestamp} onValueChange={setShowTimestamp}>{t("showTimeStampInDebugMode")}</Switch>
                                <Switch color="success" isSelected={showtag} onValueChange={setShowTag}>{t("showInputOutputTagInDebugMode")}</Switch>
                                <Switch color="success" isSelected={autoScroll} onValueChange={setAutoScroll}>{t("autoScrollInDebugMode")}</Switch>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onPress={() => {
                                onClose();
                                const newConfig: globalConfig = {
                                    clearDataOnUartOpen: autoClean,
                                    debugAutoScroll: autoScroll,
                                    debugShowInOutTag: showtag,
                                    debugShowTimestamp: showTimestamp,
                                    autoHideSerialSettingOnTermMode: autoHide,
                                    language: i18n.language
                                }
                                dispatch(setGlobalConfig(newConfig));
                                SaveConfig(JSON.stringify(newConfig, null, 4)).then((_) => {
                                    toast.success(t("saveConfSuccess"));
                                }).catch((e) => {
                                    toast.error(`${t("saveConfFailed")}\n${t("errInfo")}: ${e}`)
                                })
                            }}>{t("setup")}</Button>
                            <Button color="default" onPress={() => {
                                onClose();
                            }}>{t("close")}</Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
})