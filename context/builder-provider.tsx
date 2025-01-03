"use client"
import { FormBlockInstance } from "@/@types/form-block.type";
import { FormWithSettings } from "@/@types/form.type";
import { useParams } from "next/navigation";
import React, { createContext, useEffect } from "react";


type TBuilderContext = {
    loading: boolean;
    formData: FormWithSettings | null;
    setFormData: React.Dispatch<React.SetStateAction<FormWithSettings | null>>;

    blocks: FormBlockInstance[];
    setBlocks: React.Dispatch<React.SetStateAction<FormBlockInstance[]>>;
}

export const BuilderContext = createContext<TBuilderContext | null>(null);

export default function BuilderContextProvider({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const formId = params.formId as string;
    const [loading, setLoading] = React.useState<boolean>(false);
    const [formData, setFormData] = React.useState<FormWithSettings | null>(null);
    const [blocks, setBlocks] = React.useState<FormBlockInstance[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const rs = await fetch(`/api/fetchFormById?formId=${formId}`, {
                    method: "GET",
                });

                if (!rs.ok) {
                    throw new Error("Failed to fetch form data");
                }

                const { data } = await rs.json();
                const { form } = data;
                console.log("form", form);
                if (form) {
                    setFormData(form);
                    if (form.jsonBlocks) {
                        const parsedBlocks = JSON.parse(form.jsonBlocks);
                        setBlocks(parsedBlocks);
                    }
                }
            } catch (error) {
                console.log("Failed to fetch form data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [formId]);

    return (
        <BuilderContext.Provider value={{ loading, formData, setFormData, blocks, setBlocks }}>
            {children}
        </BuilderContext.Provider>
    )
}
export const useBuilder = () => {
    const context = React.useContext(BuilderContext);
    if (!context) {
        throw new Error("useBuilder must be used within a BuilderContextProvider");
    }

    return context;
}