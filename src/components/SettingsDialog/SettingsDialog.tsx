import { useEffect, useState } from 'react';
import { CogIcon } from 'lucide-react';
import { Button } from '../ui/button.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog.tsx';
import { Input } from '../ui/input.tsx';
import { Label } from '../ui/label.tsx';
import { Checkbox } from '../ui/checkbox.tsx';
import { getSettings, setSettings } from '../../utils/settings.ts';
import { recalculateAutomaticTrmPeriods, recalculateStoredCopPeriods } from '../../utils/utils.ts';
import { DEFAULT_TRM_REFERENCE_DAY, PRIMA_TAX_METHOD, PrimaTaxMethod } from '../../constants/constants.ts';
import { EventBus } from '../../services/EventBus.ts';

const eventBus = EventBus.getInstance();

const PRIMA_TAX_METHOD_LABELS: Record<PrimaTaxMethod, string> = {
  [PrimaTaxMethod.PROCEDIMIENTO_1]: 'Procedimiento 1 (Art. 385 E.T.) — cálculo independiente',
  [PrimaTaxMethod.PROCEDIMIENTO_2]: 'Procedimiento 2 (Art. 386 E.T.) — porcentaje fijo semestral'
};

export default function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [trmReferenceDay, setTrmReferenceDay] = useState(DEFAULT_TRM_REFERENCE_DAY);
  const [hasDependents, setHasDependents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      getSettings().then((settings) => {
        setTrmReferenceDay(settings.trmReferenceDay);
        setHasDependents(settings.hasDependents);
      });
    }
  }, [open]);

  const handleSave = async () => {
    setSaving(true);

    await setSettings({ trmReferenceDay, hasDependents });
    await recalculateAutomaticTrmPeriods(trmReferenceDay, hasDependents);
    await recalculateStoredCopPeriods(hasDependents);

    eventBus.publish('settingsUpdated', null);

    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={ open } onOpenChange={ setOpen }>
      <DialogTrigger
          className="py-4 text-orange-600 hover:text-orange-400 hover:cursor-pointer"
          title="Configuración">
        <CogIcon className="w-6 h-6" />
      </DialogTrigger>
      <DialogContent className="text-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Configuración</DialogTitle>
          <DialogDescription className="text-sm">Ajustes generales de la calculadora, guardados en este navegador.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="trm-reference-day" className="text-sm">Día de referencia de la TRM oficial</Label>
            <p className="text-sm text-muted-foreground">
              Día del mes (1-31) usado para consultar la TRM oficial publicada por el Banco de la
              República. Al guardar, los valores de TRM automáticos se recalculan; los valores de
              TRM editados manualmente no se modifican.
            </p>
            <Input
                id="trm-reference-day"
                type="number"
                min={ 1 }
                max={ 31 }
                value={ trmReferenceDay }
                onChange={ (e) => setTrmReferenceDay(Number(e.target.value)) }
                className="text-sm md:text-sm" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Checkbox
                  id="has-dependents"
                  checked={ hasDependents }
                  onCheckedChange={ setHasDependents } />
              <Label htmlFor="has-dependents" className="text-sm">Declaro dependientes económicos</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Deducción por dependientes (Art. 387 E.T.): 10% del ingreso laboral bruto mensual,
              con tope de 32 UVT/mes. Aplica si hijos, cónyuge/compañero(a), padres o hermanos
              califican como dependientes económicos.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="prima-tax-method" className="text-sm">Procedimiento de retención de la prima</Label>
            <p className="text-sm text-muted-foreground">
              Método usado para calcular la retención en la fuente sobre la prima de servicios.
              Por ahora este valor no es modificable.
            </p>
            <Input
                id="prima-tax-method"
                value={ PRIMA_TAX_METHOD_LABELS[PRIMA_TAX_METHOD] }
                disabled
                className="text-sm md:text-sm" />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={ <Button variant="outline" className="text-sm">Cancelar</Button> } />
          <Button onClick={ handleSave } disabled={ saving } className="text-sm">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
