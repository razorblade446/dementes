import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import App from './App.tsx';
import './index.scss';
import SalarySectionUsd from './components/SalarySectionUsd/SalarySectionUsd.tsx';
import { SalaryProvider } from './providers/SalaryProvider.tsx';
import { PeriodType } from './constants/constants.ts';
import SalarySectionCop from './components/SalarySectionCop/SalarySectionCop.tsx';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter basename="/dementes">
        <Routes>
          <Route path="/" element={ <App/> }>
            <Route path="usd"
                   element={ <SalaryProvider periodType={ PeriodType.USD }><SalarySectionUsd/></SalaryProvider> }/>
            <Route path="cop"
                   element={ <SalaryProvider periodType={ PeriodType.COP }><SalarySectionCop/></SalaryProvider> }/>
            <Route path="*" element={ <Navigate to="/cop" replace/> }/>
            <Route path="" element={ <Navigate to="/cop" replace/> }/>
          </Route>
        </Routes>
      </BrowserRouter>
    </StrictMode>,
);
