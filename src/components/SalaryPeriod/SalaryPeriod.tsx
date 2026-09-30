import {
  financial,
  getEffectiveTrm,
  getNetSalaryRetentions,
  getSemesterAvgBaseSalary,
  isPrimaMonth,
} from '../../utils/utils.ts';
import { Period } from '../../models/Period.ts';
import { ISalaryContext } from '../../contexts/SalaryContext.ts';
import { ChangeEvent, useEffect, useState } from 'react';
import { DEPENDENTS_DEDUCTION_RATE, DEPENDENTS_UVT_LIMIT, Month, PeriodType } from '../../constants/constants.ts';
import {
  ArrowPathIcon,
  ChevronDoubleDownIcon,
} from '@heroicons/react/24/solid';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip.tsx';

export default function SalaryPeriod({
  periodType,
  period,
  periods,
  updatePeriod,
  handleCopySalary,
  showPrima,
  showDeductions,
}: {
  periodType: PeriodType;
  period: Period;
  periods: Record<Month, Period>;
  updatePeriod: ISalaryContext['updatePeriod'];
  handleCopySalary: (month: Month) => void;
  showPrima: boolean;
  showDeductions: boolean;
}) {
  const [manualTrm, setManualTrm] = useState(period.manualTrm);
  const [salaryUsd, setSalaryUsd] = useState(period.salaryUsd);
  const [salaryCop, setSalaryCop] = useState(period.salaryCop);
  const [bonusUsd, setBonusUsd] = useState(period.bonusUsd);
  const [bonusCop, setBonusCop] = useState(period.bonusCop);

  useEffect(() => {
    setSalaryUsd(period.salaryUsd);
  }, [period.salaryUsd]);

  useEffect(() => {
    setSalaryCop(period.salaryCop);
  }, [period.salaryCop]);

  useEffect(() => {
    setManualTrm(period.manualTrm);
  }, [period.manualTrm]);

  const effectiveTrm = getEffectiveTrm({ trm: period.trm, manualTrm });

  const handleUpdateTrm = (e: ChangeEvent<HTMLInputElement>, month: Month) => {
    const newRate = parseFloat(e.target.value);

    if (!isNaN(newRate)) {
      setManualTrm(newRate);
      updatePeriod(month, { ...period, manualTrm: newRate });
    }
  };

  const handleRestoreTrm = (month: Month) => {
    setManualTrm(null);
    updatePeriod(month, { ...period, manualTrm: null });
  };

  const handleUpdateSalary = (
    e: ChangeEvent<HTMLInputElement>,
    month: Month,
  ) => {
    const newSalary = parseFloat(e.target.value);

    if (!isNaN(newSalary)) {
      const setSalaryFn =
        periodType === PeriodType.USD ? setSalaryUsd : setSalaryCop;
      setSalaryFn(newSalary);

      const updateSalary =
        periodType === PeriodType.USD
          ? { salaryUsd: newSalary }
          : { salaryCop: newSalary };

      updatePeriod(month, {
        ...period,
        ...updateSalary,
      });
    }
  };

  const handleUpdateBonus = (
    e: ChangeEvent<HTMLInputElement>,
    month: Month,
  ) => {
    const newBonus = parseFloat(e.target.value);

    if (!isNaN(newBonus)) {
      const setBonusFn =
        periodType === PeriodType.USD ? setBonusUsd : setBonusCop;
      setBonusFn(newBonus);

      const updateBonus =
        periodType === PeriodType.USD
          ? { bonusUsd: newBonus }
          : { bonusCop: newBonus };

      updatePeriod(month, { ...period, ...updateBonus });
    }
  };

  let copyDowmTrm;

  if (period.month !== 'Diciembre') {
    copyDowmTrm = (
      <button
        type="button"
        className="p-1 focus:outline-none border-1 border-gray-200 rounded-md hover:bg-orange-100"
        title="Copiar al siguiente mes"
        onClick={() => handleCopySalary(period.month)}
      >
        <ChevronDoubleDownIcon className="size-6 text-orange-600"></ChevronDoubleDownIcon>
      </button>
    );
  }

  const salaryUsdCell = (
    <td className="text-start p-2">
      <div className="flex justify-start items-center rounded-md bg-white pl-3 outline-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-orange-300 w-[150px]">
        <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
          $
        </div>
        <input
          className="block min-w-0 py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
          type="number"
          inputMode="decimal"
          name="salaryUsd"
          value={salaryUsd}
          onChange={(e) => handleUpdateSalary(e, period.month)}
          autoComplete="off"
        />
        {copyDowmTrm}
      </div>
    </td>
  );

  const bonusUsdCell = (
    <td className="text-center p-2">
      <div className="flex items-center rounded-md bg-white pl-3 outline-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-orange-300 w-[100px]">
        <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
          $
        </div>
        <input
          className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
          type="number"
          inputMode="decimal"
          name="bonusUsd"
          value={bonusUsd}
          onChange={(e) => handleUpdateBonus(e, period.month)}
          autoComplete="off"
        />
      </div>
    </td>
  );

  const restoreTrmButton = (
    <button
      type="button"
      disabled={manualTrm === null}
      className="p-1 focus:outline-none rounded-md hover:enabled:bg-orange-100 disabled:opacity-30 disabled:cursor-not-allowed"
      title="Restaurar TRM oficial"
      onClick={() => handleRestoreTrm(period.month)}
    >
      <ArrowPathIcon className="size-4 text-orange-600"></ArrowPathIcon>
    </button>
  );

  const trmCell = (
    <td className="text-center p-2">
      <div className="flex items-center rounder-md bg-white pl-3 outline-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-orange-300 w-[120px]">
        <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
          $
        </div>
        <input
          className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
          type="number"
          inputMode="decimal"
          name="trm"
          value={effectiveTrm}
          autoComplete="off"
          onChange={(e) => handleUpdateTrm(e, period.month)}
        />
        {restoreTrmButton}
      </div>
    </td>
  );

  const salaryCopCell =
    periodType === PeriodType.COP ? (
      <div className="flex items-center rounded-md bg-white pl-3 outline-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-orange-300">
        <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
          $
        </div>
        <input
          className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
          type="number"
          inputMode="decimal"
          name="salaryUsd"
          value={salaryCop}
          onChange={(e) => handleUpdateSalary(e, period.month)}
          autoComplete="off"
        />
        {copyDowmTrm}
      </div>
    ) : (
      financial(period.salaryCop)
    );

  const bonusCopCell =
    periodType === PeriodType.COP ? (
      <div className="flex items-center rounded-md bg-white pl-3 outline-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-orange-300">
        <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
          $
        </div>
        <input
          className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
          type="number"
          inputMode="decimal"
          name="bonusCop"
          value={bonusCop}
          onChange={(e) => handleUpdateBonus(e, period.month)}
          autoComplete="off"
        />
      </div>
    ) : (
      financial(period.bonusCop)
    );

  const deductionsCell = period.deductions > 0 ? (
    <Tooltip>
      <TooltipTrigger>{financial(period.deductions)}</TooltipTrigger>
      <TooltipContent>
        Dependientes económicos (Art. 387 E.T., { DEPENDENTS_DEDUCTION_RATE * 100 }% del ingreso
        laboral bruto, tope { DEPENDENTS_UVT_LIMIT } UVT/mes): { financial(period.deductions) }
      </TooltipContent>
    </Tooltip>
  ) : (
    '-'
  );

  const primaCell = isPrimaMonth(period.month) ? (
    <Tooltip>
      <TooltipTrigger>{financial(period.prima)}</TooltipTrigger>
      <TooltipContent>
        Promedio salario base del semestre: ${' '}
        {financial(getSemesterAvgBaseSalary(periods, period.month))}
      </TooltipContent>
    </Tooltip>
  ) : (
    '-'
  );

  return (
    <tr className="border-b-[1px] last:border-none" key={period.month}>
      <td className="text-center p-2">{period.month}</td>
      {periodType === PeriodType.USD && salaryUsdCell}
      {periodType === PeriodType.USD && bonusUsdCell}
      {periodType === PeriodType.USD && trmCell}
      <td className="w-[150px] text-center">{salaryCopCell}</td>
      <td className="text-center p-2">{financial(period.baseSalary)}</td>
      <td className="w-[150px] text-center">{bonusCopCell}</td>
      {showPrima && <td className="text-center p-2">{primaCell}</td>}
      {showDeductions && <td className="text-center p-2">{deductionsCell}</td>}
      <td className="text-center p-2">
        {financial(getNetSalaryRetentions(period.salaryCop))}
      </td>
      <td className="text-center p-2">{financial(period.tax)}</td>
      <td className="text-center p-2">{financial(period.netSalary)}</td>
    </tr>
  );
}
