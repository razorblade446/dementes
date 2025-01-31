import { NavLink, NavLinkRenderProps } from 'react-router';
import { EventBus } from '../../services/EventBus.ts';

const githubImgUrl = new URL('/github-mark.svg', import.meta.url).href;

const eventBus = EventBus.getInstance();

export default function NavigationBar() {

  const resetPeriods = () => eventBus.publish('resetPeriods', null);

  const linkClassName = (navLinkProps: NavLinkRenderProps) => [
    'block hover:text-orange-400 pt-4 pb-3',
    navLinkProps.isActive ? 'text-orange-500 border-b-4 border-orange-500' : ''
  ].join(' ');

  return (
      <nav className="bg-white fixed w-full z-20 top-0 start-0 border-b border-gray-200 shadow-lg">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-8 text-orange-600">
          <a href="#" className="font-semibold text-xl tracking-tight">Calculadora de Salario</a>
          <div className="flex space-x-8 items-center order-2">
            <button
                className="text-white bg-orange-500 hover:bg-orange-400 focus:ring-4 focus:outline-none text-sm font-medium rounded-lg py-2 px-4 text-center hover:cursor-pointer"
                type="button" title="Reiniciar Valores"
                onClick={ resetPeriods }>
              Reiniciar Valores
            </button>
            <a className="py-4" href={ githubImgUrl } target="_blank" title="Repositorio Github">
              <img className="w-6 h-6" src={ githubImgUrl } alt="Github"/>
            </a>
          </div>
          <div className="items-stretch justify-between w-auto flex order-1">
            <ul className="flex flex-row font-medium text-gray-900 space-x-8">
              <li>
                <NavLink to="/cop" className={ linkClassName }>Salario en COP</NavLink>
              </li>
              <li>
                <NavLink to="/usd" className={ linkClassName }>Salario en USD</NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      /*<nav className="max-w-screen-xl w-full flex items-center justify-between flex-wrap bg-white p-4 shadow-lg fixed">
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
      </nav>*/
  );
}