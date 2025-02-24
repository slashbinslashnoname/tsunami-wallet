export interface Theme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  white: string;
  black: string;
  text: {
    primary: string;
    secondary: string;
  };
  border: string;
  error: string;
  success: string;
  card: {
    background: string;
    border: string;
    shadow: string;
  };
  warning?: string;
} 