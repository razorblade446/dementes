import { financial, getNetSalaryRetentions } from '../../utils/utils.ts';
import { Period } from '../../models/Period.ts';
import { ISalaryContext } from '../../contexts/SalaryContext.ts';
import { ChangeEvent, useEffect, useState } from 'react';
import { Month, PeriodType } from '../../constants/constants.ts';
import { ChevronDoubleDownIcon } from '@heroicons/react/24/solid';

export default function SalaryPeriod({ periodType, period, updatePeriod, handleCopySalary }: {
  periodType: PeriodType,
  period: Period,
  updatePeriod: ISalaryContext['updatePeriod'],
  handleCopySalary: (month: Month) => void;
}) {
  const [trm, setTrm] = useState(period.trm);
  const [salaryUsd, setSalaryUsd] = useState(period.salaryUsd);
  const [salaryCop, setSalaryCop] = useState(period.salaryCop);

  useEffect(() => {
    setSalaryUsd(period.salaryUsd);
  }, [period.salaryUsd]);

  useEffect(() => {
    setSalaryCop(period.salaryCop);
  }, [period.salaryCop]);

  const handleUpdateTrm = (e: ChangeEvent<HTMLInputElement>, month: Month) => {
    const newTrm = parseFloat(e.target.value);

    if (!isNaN(newTrm)) {
      setTrm(newTrm);
      updatePeriod(month, { ...period, trm: newTrm });
    }

  };

  const handleUpdateSalary = (e: ChangeEvent<HTMLInputElement>, month: Month) => {
    const newSalary = parseFloat(e.target.value);

    if (!isNaN(newSalary)) {
      const setSalaryFn = periodType === PeriodType.USD ? setSalaryUsd : setSalaryCop;
      setSalaryFn(newSalary);

      const updateSalary = periodType === PeriodType.USD ? { salaryUsd: newSalary } : { salaryCop: newSalary };

      updatePeriod(month, {
        ...period, ...updateSalary
      });
    }
  };

  let copyDowmTrm;

  if (period.month !== 'Diciembre') {
    copyDowmTrm = <button type="button"
                          className="p-1 focus:outline-none border-1 border-gray-200 rounded-md hover:bg-orange-100"
                          title="Copiar al siguiente mes" onClick={ () => handleCopySalary(period.month) }>
      <ChevronDoubleDownIcon className="size-6 text-orange-600"></ChevronDoubleDownIcon>
    </button>;
  }

  const salaryUsdCell =
      <td className="text-center p-2">
        <div
            className="flex items-center rounded-md bg-white pl-3 outline-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-orange-300">
          <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">$</div>
          <input
              className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
              type="number" inputMode="decimal" name="salaryUsd" value={ salaryUsd }
              onChange={ (e) => handleUpdateSalary(e, period.month) }
              autoComplete="off"/>
          { copyDowmTrm }
        </div>
      </td>;

  const trmCell =
      <td className="text-center p-2">
        <div
            className="flex items-center rounder-md bg-white pl-3 outline-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-orange-300">
          <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">$</div>
          <input
              className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
              type="number" inputMode="decimal" name="trm" defaultValue={ trm }
              autoComplete="off" onChange={ (e) => handleUpdateTrm(e, period.month) }/>
        </div>
      </td>;

  const salaryCopCell = periodType === PeriodType.COP ? (
      <div
          className="flex items-center rounded-md bg-white pl-3 outline-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-orange-300">
        <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">$</div>
        <input
            className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
            type="number" inputMode="decimal" name="salaryUsd" value={ salaryCop }
            onChange={ (e) => handleUpdateSalary(e, period.month) }
            autoComplete="off"/>
        { copyDowmTrm }
      </div>
  ) : (
      financial(period.salaryCop)
  );

  return (
      <tr className="border-b-[1px] last:border-none" key={ period.month }>
        <td className="text-center p-2">{ period.month }</td>
        { periodType === PeriodType.USD && salaryUsdCell }
        { periodType === PeriodType.USD && trmCell }
        <td>{ salaryCopCell }</td>
        <td className="text-center p-2">{ financial(period.baseSalary) }</td>
        <td className="text-center p-2">{ financial(getNetSalaryRetentions(period.salaryCop)) }</td>
        <td className="text-center p-2">{ financial(period.tax) }</td>
        <td className="text-center p-2">{ financial(period.netSalary) }</td>
      </tr>
  );
};