import { useContext, useEffect } from 'react';
import { SalaryContextBuilder } from '../../contexts/SalaryContext.ts';
import SalaryPeriod from '../SalaryPeriod/SalaryPeriod.tsx';
import { Month, MONTHS, PeriodType } from '../../constants/constants.ts';
import { EventBus } from '../../services/EventBus.ts';
import { isIntegralSalary } from '../../utils/utils.ts';

const eventBus = EventBus.getInstance();

export default function SalarySectionUsd() {
  const { periods, updatePeriod, resetPeriods } = useContext(SalaryContextBuilder.getSalaryContext(PeriodType.USD));

  useEffect(() => {
    const resetHandler = () => {
      resetPeriods();
    };

    eventBus.subscribe('resetPeriods', resetHandler);

    return () => {
      eventBus.unsubscribe('resetPeriods', resetHandler);
    };
  },[]);

  const handleCopySalary = (month: Month) => {
    const monthIndex = MONTHS.indexOf(month);

    if (monthIndex > -1 && monthIndex < MONTHS.length - 1) {
      const nextMonth = MONTHS[monthIndex + 1];
      updatePeriod(nextMonth, { ...periods[nextMonth], salaryUsd: periods[month].salaryUsd });
    }
  };

  const showPrima = Object.values(periods).some((period) => !isIntegralSalary(period.salaryCop));
  const showDeductions = Object.values(periods).some((period) => period.deductions > 0);

  return (
      <section className="flex flex-wrap justify-between p-8 shadow-xl bg-white bg-opacity-65">
        {/*<section className="min-w-screen-xl my-8 p-8 flex flex-col shadow-xl bg-white bg-opacity-65">*/ }
        <h2>Detalle de ingresos brutos y netos mes a mes</h2>
        <table className="table-auto w-full shadow-xl bg-orange-50">
          <thead>
          <tr className="border-b-[1px] border-gray-700 text-orange-500">
            <th scope="col">Mes</th>
            <th scope="col" className="w-[150px]">Salario USD</th>
            <th scope="col" className="w-[150px]">Bono USD</th>
            <th scope="col" className="w-[150px]">TRM</th>
            <th scope="col">Salario COP</th>
            <th scope="col">Salario Base</th>
            <th scope="col" className="max-w-[200px]">Bono COP</th>
            { showPrima && <th scope="col">Prima</th> }
            { showDeductions && <th scope="col">Deducciones</th> }
            <th scope="col" className="break-word">Retenciones<br/>Salariales</th>
            <th scope="col">Retefuente</th>
            <th scope="col">Salario Neto</th>
          </tr>
          </thead>
          <tbody
              className="[&>tr:nth-child(odd)]:bg-white rounded-b-xl">
          { Object.entries(periods).map(([_, period]) => (
              <SalaryPeriod periodType={ PeriodType.USD } period={ period } periods={ periods }
                            updatePeriod={ updatePeriod } handleCopySalary={ handleCopySalary }
                            showPrima={ showPrima } showDeductions={ showDeductions } key={ period.month }/>
          )) }

          </tbody>
        </table>
      </section>
  );
}