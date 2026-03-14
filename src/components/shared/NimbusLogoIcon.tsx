import { motion } from "framer-motion";

interface NimbusLogoIconProps {
    className?: string;
    reaction?: "static" | "loading" | "rotating";
}

export const NimbusLogoIcon = ({ className = "w-12 h-12", reaction = "static" }: NimbusLogoIconProps) => {
    // Configuração da animação de Loading: Gira, para, pisca, pula
    const loadingAnimation: any = {
        rotate: [0, 360, 360, 360, 360],
        scale: [1, 1, 1, 1.2, 1],
        y: [0, 0, 0, -10, 0],
        opacity: [1, 1, 0.4, 1, 1],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.4, 0.6, 0.8, 1],
        }
    };

    const simpleRotation: any = {
        rotate: 360,
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "linear"
        }
    };

    const animation = reaction === "loading" ? loadingAnimation : reaction === "rotating" ? simpleRotation : {};

    return (
        <div className={`relative ${className} flex items-center justify-center`}>
            <motion.img
                src="/nimbus-bot.png"
                alt="Nimbus Bot"
                className="w-full h-full object-contain mix-blend-multiply [clip-path:circle(48%)]"
                animate={animation}
            />

            {reaction !== "static" && (
                <motion.div
                    className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full -z-10"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
            )}
        </div>
    );
};
