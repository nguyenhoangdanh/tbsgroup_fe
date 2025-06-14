'use client';

import React, { createContext, useContext, ReactNode } from 'react';

export function createEntityContext<T>(entityName: string, useEntityHook: () => T) {
  const EntityContext = createContext<T | null>(null);

  interface EntityProviderProps {
    children: ReactNode;
  }

  const EntityProvider: React.FC<EntityProviderProps> = ({ children }) => {
    const entityState = useEntityHook();
    return <EntityContext.Provider value={entityState}>{children}</EntityContext.Provider>;
  };

  const useEntityContext = (): T => {
    const context = useContext(EntityContext);
    if (!context) {
      throw new Error(`use${entityName}Context must be used within a ${entityName}Provider`);
    }
    return context;
  };

  const useEntityForm = (defaultValues: any) => {
    const [formData, setFormData] = React.useState(defaultValues);

    const updateFormField = React.useCallback((field: string, value: any) => {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }, []);

    const resetForm = React.useCallback(() => {
      setFormData(defaultValues);
    }, [defaultValues]);

    const loadEntityData = React.useCallback((entity: any) => {
      if (entity) {
        setFormData(entity);
      }
    }, []);

    return {
      formData,
      updateFormField,
      resetForm,
      loadEntityData,
    };
  };

  return {
    EntityProvider,
    useEntityContext,
    useEntityForm,
  };
}
