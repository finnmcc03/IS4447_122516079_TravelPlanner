export type Theme = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  inputBackground: string;
  headerBackground: string;
  headerText: string;
  headerSubtext: string;
  primary: string;
  primaryLight: string;
  tabBar: string;
  tabBarBorder: string;
};

export const lightTheme: Theme = {
  background: '#F5F6FA',
  card: '#fff',
  text: '#333',
  textSecondary: '#666',
  textMuted: '#999',
  border: '#ddd',
  inputBackground: '#fff',
  headerBackground: '#2980B9',
  headerText: '#fff',
  headerSubtext: '#D6EAF8',
  primary: '#2980B9',
  primaryLight: '#EBF5FB',
  tabBar: '#fff',
  tabBarBorder: '#eee',
};

export const darkTheme: Theme = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#E0E0E0',
  textSecondary: '#AAAAAA',
  textMuted: '#777',
  border: '#333',
  inputBackground: '#2A2A2A',
  headerBackground: '#1A1A2E',
  headerText: '#fff',
  headerSubtext: '#8888AA',
  primary: '#3498DB',
  primaryLight: '#1A2A3A',
  tabBar: '#1E1E1E',
  tabBarBorder: '#333',
};

export function getTheme(darkMode: boolean): Theme {
  return darkMode ? darkTheme : lightTheme;
}