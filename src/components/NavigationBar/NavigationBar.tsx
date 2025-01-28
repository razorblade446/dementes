import { useContext } from 'react';
import { SalaryContext } from '../../contexts/SalaryContext.ts';

const githubImgUrl = new URL('/github-mark.svg', import.meta.url).href;

export default function NavigationBar() {
  const { resetPeriods } = useContext(SalaryContext);

  return (
      <nav className="w-full flex items-center justify-between flex-wrap bg-white p-6 shadow-lg fixed">
        <div className="flex items-center flex-shrink-0 text-orange-600 mr-6">
          <span className="font-semibold text-xl tracking-tight">Calculadora de Salario</span>
        </div>
        <div className="w-full flex items-center w-auto flex-grow lg:flex lg:items-center lg:w-auto lg:gap-4 justify-end">
          <button
              className="color-orange-500 text-orange-500 border-1 p-[8px] hover:bg-orange-500 hover:text-white hover:cursor-pointer"
              type="button" title="Reiniciar Valores"
              onClick={ resetPeriods }>
            <span>Reiniciar Valores</span>
          </button>
          <div className="inline-block text-sm leading-none">
            <a href="https://github.com/razorblade446/dementes" target="_blank" title="Repositorio Github">
              <img className="p-none w-[24px] h-[24px]" src={githubImgUrl} alt="Github"/>
            </a>
          </div>
        </div>
      </nav>
  );
}