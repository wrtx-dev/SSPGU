import { Button, Modal, ModalBody, ModalContent, Progress, useDisclosure } from "@heroui/react";
import { forwardRef, Ref, useEffect, useImperativeHandle, useState } from "react";
import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime";

interface transInfo {
    size: number
}

function bytesHuman(bytes: number, precision: number): string {
    if (bytes === 0) return '0';
    const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const num = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = (bytes / Math.pow(1024, Math.floor(num))).toFixed(precision);
    return `${value} ${units[num]}`;
}
export const TransDetail = forwardRef((_: {}, ref: Ref<any>) => {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const [fileName, setFileName] = useState("");
    const [fileLen, setFileLen] = useState(0);
    const [transSize, setTransSize] = useState(0);
    const [isDown, setIsDown] = useState(false);
    const [startTime, setStartTime] = useState(0);
    const [speed, setSpeed] = useState("0");
    useImperativeHandle(ref, () => ({
        open: (down: boolean, name: string, size: number) => {
            setFileName(name);
            setFileLen(size);
            setTransSize(0);
            setIsDown(down);
            setStartTime(Math.floor(Date.now() / 1000));
            onOpen();
        },
        close: () => {
            onClose();

        }
    }));
    useEffect(() => {
        EventsOn("UpdateTransInfo", (data) => {
            const info = data as transInfo;
            setTransSize((prev) => prev + info.size);
            const curr = Math.floor(Date.now() / 1000);
            const cost = curr - startTime;
            if (cost > 0) {
                setSpeed(bytesHuman(transSize / cost, 2));
            }
        });
        return () => {
            EventsOff("UpdateTransInfo");
        }
    })
    return (
        <>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                onClose={onClose}
                radius="sm"
                isDismissable={false}
                isKeyboardDismissDisabled={true}
                hideCloseButton
            >
                <ModalContent>
                    <ModalBody>
                        <div className="flex flex-col w-full h-full">
                            <div className="flex flex-row justify-center items-center">
                                <p className="text-lg font-bold select-none pointer-events-none cursor-default">{isDown ? "下载" : "上传"}</p>
                            </div>
                            <div className="flex flex-col flex-1 w-full h-full justify-start items-start gap-4">
                                <Progress
                                    className="max-w-md"
                                    color="success"
                                    label={fileName}
                                    maxValue={fileLen}
                                    value={transSize}
                                />
                                <div className="flex flex-row w-full justify-between items-center gap-2">
                                    <p className="font-light pointer-events-none select-none cursor-default text-small">{bytesHuman(transSize, 2)} / {bytesHuman(fileLen, 2)} {((100 * transSize) / fileLen).toFixed(2)}% {speed}/s</p>
                                    <Button onPress={onClose} size="sm" className="hidden">关闭</Button>
                                </div>
                            </div>
                        </div>

                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    )
})