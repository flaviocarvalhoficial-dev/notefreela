import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useNavigationShortcuts(onOpenQuickCapture?: () => void) {
    const navigate = useNavigate();

    useEffect(() => {
        let lastKey = "";
        let lastKeyTime = 0;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input, textarea or contenteditable
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            const currentTime = Date.now();
            const isSequence = currentTime - lastKeyTime < 500; // 500ms window for sequences

            // Single key shortcuts
            if (!isSequence) {
                if (e.key.toLowerCase() === "c") {
                    e.preventDefault();
                    onOpenQuickCapture?.();
                    return;
                }
            }

            // Sequence shortcuts (G + key)
            if (lastKey.toLowerCase() === "g" && isSequence) {
                switch (e.key.toLowerCase()) {
                    case "d":
                        e.preventDefault();
                        navigate("/");
                        break;
                    case "p":
                        e.preventDefault();
                        navigate("/projetos");
                        break;
                    case "t":
                        e.preventDefault();
                        navigate("/tarefas");
                        break;
                    case "i":
                        e.preventDefault();
                        navigate("/caixa-entrada");
                        break;
                    case "f":
                        e.preventDefault();
                        navigate("/financeiro");
                        break;
                    case "c":
                        e.preventDefault();
                        navigate("/clientes");
                        break;
                    case "a":
                        e.preventDefault();
                        navigate("/agenda");
                        break;
                }
                // Reset sequence
                lastKey = "";
                return;
            }

            lastKey = e.key;
            lastKeyTime = currentTime;
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [navigate, onOpenQuickCapture]);
}
