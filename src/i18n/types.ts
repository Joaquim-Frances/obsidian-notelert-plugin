// Tipos e interfaces para el sistema de internacionalización

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  keywords: string[];
  datePatterns: {
    today: string[];
    tomorrow: string[];
    yesterday: string[];
  };
  timePatterns: {
    format24h: string[];
    format12h: string[];
  };
}

