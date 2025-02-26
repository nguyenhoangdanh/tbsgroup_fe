"use client";
import React from "react";
import { Button } from "./ui/button";

export default function SubmitButton(
  props: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) {
  return (
    <Button
      type="submit"
      className="bg-green-700 text-white hover:bg-green-800 hover:text-white"
      {...props}
    >
      {props.name}
    </Button>
  );
}
