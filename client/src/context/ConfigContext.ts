import { createContext, useContext } from 'react';

// We re-declare the types here to avoid importing from server
export interface ExamplePrompt {
    icon: string;
    label: string;
    query: string;
}

export interface ClientAppConfig {
    appName: string;
    appTagline: string;
    accentColor: string;
    examplePrompts: ExamplePrompt[];
    openrouterApiKey: string; // masked on client
    _keyIsSet: boolean;
    modelAllowlist: string[];
}

export interface ConfigContextValue {
    config: ClientAppConfig | null;
    isLoading: boolean;
    saveConfig: (partial: Partial<ClientAppConfig>) => Promise<void>;
}



export const ConfigContext = createContext<ConfigContextValue>({
    config: null,
    isLoading: true,
    saveConfig: async () => { },
});

export function useConfigContext(): ConfigContextValue {
    return useContext(ConfigContext);
}
