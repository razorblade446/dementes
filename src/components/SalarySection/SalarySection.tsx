import { useContext } from 'react';
import { financial } from '../../utils/utils.ts';
import { SalaryContext } from '../../contexts/SalaryContext.ts';

export default function SalarySection() {
  const { monthly } = useContext(SalaryContext);

  return (<section className="container my-8 p-8 flex flex-col shadow-xl bg-white bg-opacity-65 rounded-xl">
    <h2>Detalle de ingresos brutos y netos mes a mes</h2>
    <table className="table-auto shadow-xl rounded-xl bg-orange-500 overflow-hidden">
      <thead>
      <tr className="border-b-[1px] border-gray-700 text-white">
        <th scope="col">Mes</th>
        <th scope="col">Salario USD</th>
        <th scope="col">TRM</th>
        <th scope="col">Base Salarial</th>
        <th scope="col">Retenciones Salariales</th>
        <th scope="col">Retefuente</th>
        <th scope="col">Salario Neto</th>
      </tr>
      </thead>
      <tbody className="[&>tr:nth-child(odd)]:bg-orange-50 [&>tr:nth-child(even)]:bg-white rounded-b-xl [&>tr]:border-b-[1px] [&>tr:last-child()]:border-none">
      { Object.entries(monthly).map(([_, monthInfo]) => (
          <tr key={ monthInfo.month }>
            <td className="text-center">{ monthInfo.month }</td>
            <td className="text-center">{ monthInfo.salaryUsd }</td>
            <td className="text-center">$ { financial(monthInfo.trm) }</td>
            <td className="text-center">$ { financial(monthInfo.baseSalary) }</td>
            <td className="text-center">$ { financial(monthInfo.retentions.health + monthInfo.retentions.retirement + (monthInfo.retentions.solidarity ?? 0)) }</td>
            <td className="text-center">$ { financial(monthInfo.tax) }</td>
            <td className="text-center">$ { financial(monthInfo.netSalary) }</td>
          </tr>)) }

      </tbody>
    </table>
  </section>);
}