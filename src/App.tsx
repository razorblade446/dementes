import './App.scss';
import NavigationBar from './components/NavigationBar/NavigationBar.tsx';
import { LegalInfo } from './components/LegalInfo/LegalInfo.tsx';
import { Outlet } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';

function App() {
  return (
    <>
      <TooltipProvider>
        <NavigationBar></NavigationBar>

        <main className="container max-w-dvw mx-auto mt-20 flex flex-wrap flex-col gap-6">
          <LegalInfo></LegalInfo>
          <Outlet></Outlet>
        </main>
      </TooltipProvider>
    </>
  );
}

export default App;
