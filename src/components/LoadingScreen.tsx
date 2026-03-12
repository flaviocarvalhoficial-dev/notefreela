import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const LoadingScreen = () => {
    const [phase, setPhase] = useState<"core" | "expand" | "converge">("core");
    const [showLogo, setShowLogo] = useState(false);

    useEffect(() => {
        // Sequência acelerada para completar em 4s totais
        // 0s-0.5s: Núcleo aparece
        // 0.5s-1.5s: Expande e Gira acelerando
        // 1.5s-2.0s: Junta no centro (Impacto)
        // 2.0s-4.0s: Logo estática com brilho

        const timer1 = setTimeout(() => setPhase("expand"), 500);
        const timer2 = setTimeout(() => setPhase("converge"), 1500);
        const timer3 = setTimeout(() => setShowLogo(true), 2000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    const petals = Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        angle: i * 60,
    }));

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background select-none overflow-hidden">

            <div className="relative w-64 h-64 flex items-center justify-center">

                {/* 
                    CONTAINER GLOBAL DE ROTAÇÃO 
                    Sincroniza o giro das pétalas E da revelação da logo
                */}
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{
                        // O giro começa na expansão (0->360) e a logo finaliza o movimento no impacto
                        rotate: phase === "expand" ? 360 : phase === "converge" ? 720 : 0
                    }}
                    transition={{
                        duration: phase === "converge" ? 0.5 : 1,
                        ease: phase === "converge" ? "easeOut" : "easeIn"
                    }}
                >
                    {/* NÚCLEO INICIAL */}
                    <motion.div
                        className="absolute rounded-full bg-primary"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: phase === "core" ? 1.2 : 0,
                            opacity: phase === "converge" ? 0 : 1,
                            width: 15,
                            height: 15
                        }}
                        transition={{ duration: 0.4 }}
                    />

                    {/* AS 6 PÉTALAS */}
                    {petals.map((petal) => (
                        <motion.div
                            key={petal.id}
                            className="absolute rounded-full bg-primary"
                            initial={{ x: 0, y: 0, width: 10, height: 10, opacity: 0 }}
                            animate={{
                                x: phase === "core" ? 0 :
                                    phase === "converge" ? 0 :
                                        Math.cos((petal.angle * Math.PI) / 180) * 40,
                                y: phase === "core" ? 0 :
                                    phase === "converge" ? 0 :
                                        Math.sin((petal.angle * Math.PI) / 180) * 40,

                                opacity: phase === "core" ? 0 : 0.7,
                                scale: phase === "converge" ? 0.5 : 1,
                            }}
                            transition={{
                                x: {
                                    duration: phase === "converge" ? 0.4 : 0.6,
                                    ease: phase === "converge" ? "circIn" : "easeOut"
                                },
                                y: {
                                    duration: phase === "converge" ? 0.4 : 0.6,
                                    ease: phase === "converge" ? "circIn" : "easeOut"
                                },
                            }}
                            style={{ filter: "blur(3px)" }}
                        />
                    ))}

                    {/* 3. REVELAÇÃO DA LOGO NO IMPACTO DENTRO DO MESMO GIRO */}
                    {showLogo && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.4, y: -20, rotate: -180 }}
                                animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                                transition={{
                                    duration: 0.5,
                                    type: "spring",
                                    stiffness: 150,
                                    damping: 15
                                }}
                            >

                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <img
                                        src="/nimbus-logo.webp"
                                        alt="Nimbus Logo"
                                        className="w-full h-full object-contain"
                                    />
                                    <motion.div
                                        className="absolute inset-0 bg-primary/20 blur-2xl rounded-full -z-10"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: [0, 1.8, 1.2] }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </motion.div>

                            <div className="overflow-hidden mt-1">
                                <motion.div
                                    initial={{ opacity: 0, y: -30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                                >
                                    <h1 className="text-lg font-bold tracking-tight text-foreground">
                                        Nimbus
                                    </h1>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
