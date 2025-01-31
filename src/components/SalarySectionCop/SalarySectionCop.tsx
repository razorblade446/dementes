import { useContext, useEffect } from 'react';
import { SalaryContextBuilder } from '../../contexts/SalaryContext.ts';
import SalaryPeriod from '../SalaryPeriod/SalaryPeriod.tsx';
import { Month, MONTHS, PeriodType } from '../../constants/constants.ts';
import { EventBus } from '../../services/EventBus.ts';

const eventBus = EventBus.getInstance();

export default function SalarySectionCop() {
  const { periods, updatePeriod, resetPeriods } = useContext(SalaryContextBuilder.getSalaryContext(PeriodType.COP));

  useEffect(() => {
    const resetHandler = () => {
      resetPeriods();
    };

    eventBus.subscribe('resetPeriods', resetHandler);

    return () => {
      eventBus.unsubscribe('resetPeriods', resetHandler);
    };
  }, []);

  const handleCopySalary = (month: Month) => {
    const monthIndex = MONTHS.indexOf(month);
    if (monthIndex > -1 && monthIndex < MONTHS.length - 1) {
      const nextMonth = MONTHS[monthIndex + 1];
      updatePeriod(nextMonth, { ...periods[nextMonth], salaryCop: periods[month].salaryCop });
    }
  };

  return (
      <section className="max-w-screen-xl flex flex-wrap justify-between p-8 shadow-xl bg-white bg-opacity-65">
        {/*<section className="min-w-screen-xl my-8 p-8 flex flex-col shadow-xl bg-white bg-opacity-65">*/ }
        <h2>Detalle de ingresos brutos y netos mes a mes</h2>
        <table className="table-auto w-full shadow-xl bg-orange-50">
          <thead>
          <tr className="border-b-[1px] border-gray-700 text-orange-500">
            <th scope="col" className="">Mes</th>
            <th scope="col">Salario COP</th>
            <th scope="col">Salario Base</th>
            <th scope="col" className="break-word">Retenciones<br/>Salariales</th>
            <th scope="col">Retefuente</th>
            <th scope="col">Salario Neto</th>
          </tr>
          </thead>
          <tbody
              className="[&>tr:nth-child(odd)]:bg-white rounded-b-xl">
          { Object.entries(periods).map(([_k, period]) => (
              <SalaryPeriod periodType={ PeriodType.COP } period={ period } updatePeriod={ updatePeriod }
                            handleCopySalary={ handleCopySalary }
                            key={ period.month }/>
          )) }

          </tbody>
        </table>
      </section>);
}