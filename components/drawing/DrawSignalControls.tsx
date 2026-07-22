"use client";

import React from "react";
import { ButtonToggle, TextBoxSliders } from "@/components/controls/ControlPanelSource";
import { theme } from "@/styles/theme";


type DrawSignalControlsProps = {
  signalName: string;
  amplitude: number;
  amplitudeText: string;
  setAmplitude: React.Dispatch<React.SetStateAction<number>>;
  setAmplitudeText: React.Dispatch<React.SetStateAction<string>>;
  amplitudeMin: number;
  amplitudeMax: number;
  amplitudeStep: number;
  onOpen: () => void;
  onClear: () => void;
  isDiscrete: boolean;
  signalLabel: string;
  varLetter: string;
};

export default function DrawSignalControls({
    signalName,
    amplitude,
    amplitudeText,
    setAmplitude,
    setAmplitudeText,
    amplitudeMin,
    amplitudeMax,
    amplitudeStep,
    onOpen,
    onClear,
    isDiscrete,
    signalLabel,
    varLetter
}: DrawSignalControlsProps) {
    return (
    <>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: theme.spacing.controlGap }}>
            <ButtonToggle label="Open drawing pad" active={false} onClick={onOpen}/>
            <ButtonToggle label="Clear" active={false} onClick={onClear}/>
        </div>
        <div>
            <TextBoxSliders
              signalName = {signalName}
              varLetter = {varLetter}
              strWidthAmp = "Amplitude"
              isDiscrete = {isDiscrete}
              roundOnDiscrete={true}
              minRange = {amplitudeMin}
              maxRange = {amplitudeMax}
              stepRange = {amplitudeStep}
              widthValue = {amplitude}
              setWidthValue = {setAmplitude}
              widthText={amplitudeText}
              setWidthText={setAmplitudeText}
              signalLabel={signalLabel}
            />
        </div>
    </>
  );
}
