import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export function useXterm() {
    const termRef = useRef<HTMLDivElement | null>(null);
    const termInstance = useRef<Terminal | null>(null);
    const fitAddon = useRef<FitAddon | null>(null);

    useEffect(() => {
        if (termRef.current && !termInstance.current) {
            const term = new Terminal({
                scrollback: 1000,
                cursorBlink: true,
                cursorInactiveStyle: "outline",
                cursorStyle: "bar",
            });
            fitAddon.current = new FitAddon();
            term.loadAddon(fitAddon.current);
            term.open(termRef.current);
            fitAddon.current?.fit();
            termInstance.current = term;
            const handleResize = () => {
                if (fitAddon.current) {
                    fitAddon.current.fit();
                }
            }
            window.addEventListener("resize", handleResize);
            const viewport = termRef.current.querySelector('.xterm-viewport') as HTMLElement;
            if (viewport) {
                viewport.style.display = "auto";
            }
            const cleanDataHandler = () => {
                if (termInstance && termInstance.current) {
                    termInstance.current.reset();
                }
            }
            window.addEventListener("resetXterm", cleanDataHandler);
            return () => {
                window.removeEventListener("resize", handleResize);
                window.removeEventListener("resetXterm", cleanDataHandler);
                if (termInstance.current) {
                    termInstance.current.dispose();
                    termInstance.current = null;
                    termRef.current = null;
                }
            }
        }
    }, []);
    return {
        ref: termRef,
        instance: termInstance,
    }
}