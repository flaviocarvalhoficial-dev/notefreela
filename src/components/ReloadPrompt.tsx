import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from 'react';

export function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            // eslint-disable-next-line no-console
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    const { toast } = useToast();

    const close = () => {
        setOfflineReady(false)
        setNeedRefresh(false)
    }

    useEffect(() => {
        if (offlineReady) {
            toast({
                title: "App pronto para uso offline",
                description: "Agora você pode usar o app sem internet.",
            });
            setOfflineReady(false);
        }
    }, [offlineReady, toast, setOfflineReady]);

    useEffect(() => {
        if (needRefresh) {
            toast({
                title: "Atualização disponível",
                description: "Uma nova versão está disponível. Clique para atualizar.",
                action: (
                    <Button variant="outline" size="sm" onClick={() => updateServiceWorker(true)}>
                        Atualizar
                    </Button>
                ),
                duration: Infinity,
            });
        }
    }, [needRefresh, toast, updateServiceWorker]);

    return null;
}
