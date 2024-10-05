import { createContext, useContext, useState, ReactNode } from 'react';

// Create the context for date management
interface DateContextProps {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
}

// Create the actual context with a default value
const DateContext = createContext<DateContextProps | undefined>(undefined);

// Custom hook to use the DateContext
export const useDate = () => {
    const context = useContext(DateContext);
    if (!context) {
        throw new Error('useDate must be used within a DateProvider');
    }
    return context;
};

// Provider component to wrap around the app
export const DateProvider = ({ children }: { children: ReactNode }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    return (
        <DateContext.Provider value={{ currentDate, setCurrentDate }}>
            {children}
        </DateContext.Provider>
    );
};
