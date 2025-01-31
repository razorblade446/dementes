import './App.scss';
import NavigationBar from './components/NavigationBar/NavigationBar.tsx';
import { LegalInfo } from './components/LegalInfo/LegalInfo.tsx';
import { Outlet } from 'react-router';

function App() {
  return (
      <>
        <NavigationBar></NavigationBar>

        <main className="container max-w-screen-xl mx-auto mt-20 flex flex-wrap flex-col gap-6">
          <LegalInfo></LegalInfo>
          <Outlet></Outlet>
        </main>
      </>
  );
}

export default App;
