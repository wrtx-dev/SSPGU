import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/react";
import { BiSolidInfoCircle } from "react-icons/bi";
import { useTranslation } from "react-i18next";

export default function About({ hidden }: { hidden: boolean }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { t } = useTranslation();
    return (
        <>
            <Button
                className={`${hidden && "hidden"}`}
                color="default"
                onPress={onOpen}
                variant="light"
                isIconOnly
                radius="full"
                onDoubleClick={(e) => {
                    e.stopPropagation();
                }}>
                <BiSolidInfoCircle size={30} />
            </Button>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" size="xs">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-row w-full justify-center select-none pointer-events-none">{t("about")}</ModalHeader>
                            <ModalBody>
                                <p>{t("appInfo")}</p>
                                <p>{t("devToolInfo")}</p>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="default" onPress={onClose}>
                                    {t("close")}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    )
}