import { useContext } from 'react';
import { SalaryContext } from '../../contexts/SalaryContext.ts';
import SalaryPeriod from '../SalaryPeriod/SalaryPeriod.tsx';
import { Month, MONTHS } from '../../constants/constants.ts';

export default function SalarySection() {
  const { periods, updatePeriod } = useContext(SalaryContext);

  const handleCopySalary = (month: Month) => {
    const monthIndex = MONTHS.indexOf(month);
    console.log('monthIndex', monthIndex);
    console.log('month', month);

    if (monthIndex > -1 && monthIndex < MONTHS.length - 1) {
      const nextMonth = MONTHS[monthIndex + 1];
      console.log('nextMonth', nextMonth);
      updatePeriod(nextMonth, { ...periods[nextMonth], salaryUsd: periods[month].salaryUsd });
    }
  };

  return (<section className="container-fluid my-8 p-8 flex flex-col shadow-xl bg-white bg-opacity-65">
    <h2>Detalle de ingresos brutos y netos mes a mes</h2>
    <table className="table-auto shadow-xl bg-orange-50">
      <thead>
      <tr className="border-b-[1px] border-gray-700 text-orange-500">
        <th scope="col" className="">Mes</th>
        <th scope="col">Salario USD</th>
        <th scope="col">TRM</th>
        <th scope="col">Salario COP</th>
        <th scope="col">Salario Base</th>
        <th scope="col" className="break-word">Retenciones<br/>Salariales</th>
        <th scope="col">Retefuente</th>
        <th scope="col">Salario Neto</th>
      </tr>
      </thead>
      <tbody
          className="[&>tr:nth-child(odd)]:bg-white rounded-b-xl">
      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */ }
      { Object.entries(periods).map(([_, period]) => (
          <SalaryPeriod period={ period } updatePeriod={ updatePeriod } handleCopySalary={ handleCopySalary }
                        key={ period.month }/>
      )) }

      </tbody>
    </table>
  </section>);
}