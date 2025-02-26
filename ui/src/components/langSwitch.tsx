import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Selection } from "@heroui/react";
import { FaEarthAsia } from "react-icons/fa6";
import { getLanguageOptions, getLanguageLabel } from "../lang/config";
import i18n from "../lang/locale";
import { useEffect, useMemo, useState } from "react";
import { useStoreSelector, useStoreDispatch } from "../store/store";
import { globalConfig, setGlobalConfig } from "../store/globalConfig";
import { SaveConfig } from "../../wailsjs/go/main/App";


const LANGUAGE_OPTIONS = getLanguageOptions();
export default function LangSwitcher() {
    const config = useStoreSelector((state) => state.globalConfig.config);
    const lang = config.language.toLowerCase();
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([lang]));
    const dispatch = useStoreDispatch();
    const selectedValue = useMemo(
        () => Array.from(selectedKeys).join(", ").replace(/_/g, ""),
        [selectedKeys],
    );

    useEffect(() => {
        i18n.changeLanguage(config.language);
        setSelectedKeys(new Set([config.language]))
    }, [config]);

    return (
        <>
            <Dropdown >
                <DropdownTrigger>
                    <Button
                        className="capitalize"
                        color="default"
                        variant="light"
                        size="md"
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <FaEarthAsia size={28} />
                        {getLanguageLabel(selectedValue)}
                    </Button>
                </DropdownTrigger>
                <DropdownMenu
                    disallowEmptySelection
                    aria-label="Dropdown Variants"
                    color="default"
                    variant="light"
                    selectedKeys={selectedKeys}
                    selectionMode="single"
                    onSelectionChange={(v) => {
                        setSelectedKeys(v);
                        const lang = Array.from(v).join(", ").replace(/_/g, "");
                        if (lang !== config.language) {
                            let newConf: globalConfig = {
                                ...config
                            }
                            newConf.language = lang;
                            dispatch(setGlobalConfig(newConf));
                            SaveConfig(JSON.stringify(newConf, null, 4));
                        }
                    }}
                >
                    {LANGUAGE_OPTIONS.map((lang) => (
                        <DropdownItem key={lang.value} value={lang.value}>{lang.label}</DropdownItem>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    )
}