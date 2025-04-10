import { toast } from "./use-toast";

export const useFeedback = () => {
    const showSuccess = (title: string, description: string) => toast({ title, description });
  const showError = (title: string, description: string) => toast({ title, description, variant: 'destructive' });
    return { showSuccess, showError };
  };