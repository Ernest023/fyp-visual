import type { ReactNode } from "react";
import { SignalSourceSelection } from "@/components/controls/ControlPanelSource";
import type { SignalSource } from "@/library/types";

// Shared editor shell for x and h. The page supplies mode-specific controls,
// while this component owns source selection and progressive rendering.
export default function SignalSourceEditor({
    signalName,
    varLetter,
    source,
    setSource,
    gapBottom,
    children,
}: {
    signalName: "x" | "h";
    varLetter: string;
    source: SignalSource;
    setSource: React.Dispatch<React.SetStateAction<SignalSource>>;
    gapBottom: number;
    children: ReactNode;
}) {
    return (
        <section aria-label={`${signalName}${varLetter} signal source editor`}>
            <SignalSourceSelection
                signalName={signalName}
                varLetter={varLetter}
                source={source}
                setSource={setSource}
                gapBottom={gapBottom}
            />
            {children}
        </section>
    );
}
